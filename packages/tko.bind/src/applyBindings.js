
/* eslint no-cond-assign: 0 */

import {
    extend, objectMap, virtualElements, tagNameLower, domData, objectForEach,
    arrayIndexOf, arrayForEach, options
} from 'tko.utils'

import {
    dependencyDetection
} from 'tko.observable'

import {
    computed
} from 'tko.computed'

import {
    bindingContext, storedBindingContextForNode, boundElementDomDataKey,
    contextSubscribeSymbol
} from './bindingContext'

import {
  LegacyBindingHandler
} from './LegacyBindingHandler'

// The following element types will not be recursed into during binding.
const bindingDoesNotRecurseIntoElementTypes = {
    // Don't want bindings that operate on text nodes to mutate <script> and <textarea> contents,
    // because it's unexpected and a potential XSS issue.
    // Also bindings should not operate on <template> elements since this breaks in Internet Explorer
    // and because such elements' contents are always intended to be bound in a different context
    // from where they appear in the document.
  'script': true,
  'textarea': true,
  'template': true
}

function asProperHandlerClass (handler, bindingKey) {
  if (!handler) { return }
  return handler.isBindingHandlerClass ? handler
    : LegacyBindingHandler.getOrCreateFor(bindingKey, handler)
}

function getBindingHandlerFromComponent (bindingKey, $component) {
  if (!$component || typeof $component.getBindingHandler !== 'function') { return }
  return asProperHandlerClass($component.getBindingHandler(bindingKey))
}

export function getBindingHandler (bindingKey) {
  return asProperHandlerClass(options.bindingProviderInstance.bindingHandlers.get(bindingKey), bindingKey)
}

// Returns the valueAccessor function for a binding value
function makeValueAccessor (value) {
  return function () {
    return value
  }
}

// Returns the value of a valueAccessor function
function evaluateValueAccessor (valueAccessor) {
  return valueAccessor()
}

// Given a function that returns bindings, create and return a new object that contains
// binding value-accessors functions. Each accessor function calls the original function
// so that it always gets the latest value and all dependencies are captured. This is used
// by ko.applyBindingsToNode and getBindingsAndMakeAccessors.
function makeAccessorsFromFunction (callback) {
  return objectMap(dependencyDetection.ignore(callback), function (value, key) {
    return function () {
      return callback()[key]
    }
  })
}

// Given a bindings function or object, create and return a new object that contains
// binding value-accessors functions. This is used by ko.applyBindingsToNode.
function makeBindingAccessors (bindings, context, node) {
  if (typeof bindings === 'function') {
    return makeAccessorsFromFunction(bindings.bind(null, context, node))
  } else {
    return objectMap(bindings, makeValueAccessor)
  }
}

// This function is used if the binding provider doesn't include a getBindingAccessors function.
// It must be called with 'this' set to the provider instance.
function getBindingsAndMakeAccessors (node, context) {
  return makeAccessorsFromFunction(this.getBindings.bind(this, node, context))
}

function applyBindingsToDescendantsInternal (bindingContext, elementOrVirtualElement, asyncBindingsApplied) {
  let nextInQueue = virtualElements.firstChild(elementOrVirtualElement)

  if (!nextInQueue) { return }

  let currentChild
  const provider = options.bindingProviderInstance
  const preprocessNode = provider.preprocessNode

  // Preprocessing allows a binding provider to mutate a node before bindings are applied to it. For example it's
  // possible to insert new siblings after it, and/or replace the node with a different one. This can be used to
  // implement custom binding syntaxes, such as {{ value }} for string interpolation, or custom element types that
  // trigger insertion of <template> contents at that point in the document.
  if (preprocessNode) {
    while (currentChild = nextInQueue) {
      nextInQueue = virtualElements.nextSibling(currentChild)
      preprocessNode.call(provider, currentChild)
    }

    // Reset nextInQueue for the next loop
    nextInQueue = virtualElements.firstChild(elementOrVirtualElement)
  }

  while (currentChild = nextInQueue) {
        // Keep a record of the next child *before* applying bindings, in case the binding removes the current child from its position
    nextInQueue = virtualElements.nextSibling(currentChild)
    applyBindingsToNodeAndDescendantsInternal(bindingContext, currentChild, asyncBindingsApplied)
  }
}

function hasBindings (node) {
  const provider = options.bindingProviderInstance
  return provider.FOR_NODE_TYPES.includes(node.nodeType) && provider.nodeHasBindings(node)
}

function applyBindingsToNodeAndDescendantsInternal (bindingContext, nodeVerified, asyncBindingsApplied) {
  var isElement = nodeVerified.nodeType === 1
  if (isElement) { // Workaround IE <= 8 HTML parsing weirdness
    virtualElements.normaliseVirtualElementDomStructure(nodeVerified)
  }

  // Perf optimisation: Apply bindings only if...
  // (1) We need to store the binding info for the node (all element nodes)
  // (2) It might have bindings (e.g., it has a data-bind attribute, or it's a marker for a containerless template)

  let shouldApplyBindings = isElement || // Case (1)
      hasBindings(nodeVerified)          // Case (2)

  const {shouldBindDescendants} = shouldApplyBindings
    ? applyBindingsToNodeInternal(nodeVerified, null, bindingContext, asyncBindingsApplied)
    : { shouldBindDescendants: true }

  if (shouldBindDescendants && !bindingDoesNotRecurseIntoElementTypes[tagNameLower(nodeVerified)]) {
    // We're recursing automatically into (real or virtual) child nodes without changing binding contexts. So,
    //  * For children of a *real* element, the binding context is certainly the same as on their DOM .parentNode,
    //    hence bindingContextsMayDifferFromDomParentElement is false
    //  * For children of a *virtual* element, we can't be sure. Evaluating .parentNode on those children may
    //    skip over any number of intermediate virtual elements, any of which might define a custom binding context,
    //    hence bindingContextsMayDifferFromDomParentElement is true
    applyBindingsToDescendantsInternal(bindingContext, nodeVerified, asyncBindingsApplied)
  }
}


function * topologicalSortBindings (bindings, $component) {
  const results = []
  // Depth-first sort
  const bindingsConsidered = {}    // A temporary record of which bindings are already in 'result'
  const cyclicDependencyStack = [] // Keeps track of a depth-search so that, if there's a cycle, we know which bindings caused it

  objectForEach(bindings, function pushBinding (bindingKey) {
    if (!bindingsConsidered[bindingKey]) {
      const binding = getBindingHandlerFromComponent(bindingKey, $component) || getBindingHandler(bindingKey)
      if (!binding) { return }
        // First add dependencies (if any) of the current binding
      if (binding.after) {
        cyclicDependencyStack.push(bindingKey)
        arrayForEach(binding.after, function (bindingDependencyKey) {
          if (!bindings[bindingDependencyKey]) { return }
          if (arrayIndexOf(cyclicDependencyStack, bindingDependencyKey) !== -1) {
            throw Error('Cannot combine the following bindings, because they have a cyclic dependency: ' + cyclicDependencyStack.join(', '))
          } else {
            pushBinding(bindingDependencyKey)
          }
        })
        cyclicDependencyStack.length--
      }
        // Next add the current binding
      results.push([ bindingKey, binding ])
    }
    bindingsConsidered[bindingKey] = true
  })

  for (const result of results) { yield result }
}

function applyBindingsToNodeInternal (node, sourceBindings, bindingContext, asyncBindingsApplied) {
  const bindingInfo = domData.get(node, boundElementDomDataKey)
  // Prevent multiple applyBindings calls for the same node, except when a binding value is specified
  if (!sourceBindings) {
    if (bindingInfo) {
      onBindingError({
        during: 'apply',
        errorCaptured: new Error('You cannot apply bindings multiple times to the same element.'),
        element: node,
        bindingContext
      })
      return false
    }
    domData.set(node, boundElementDomDataKey, { context: bindingContext })
    if (bindingContext[contextSubscribeSymbol]) {
      bindingContext[contextSubscribeSymbol]._addNode(node)
    }
  }

  // Use bindings if given, otherwise fall back on asking the bindings provider to give us some bindings
  var bindings
  if (sourceBindings && typeof sourceBindings !== 'function') {
    bindings = sourceBindings
  } else {
    const provider = options.bindingProviderInstance
    const getBindings = provider.getBindingAccessors || getBindingsAndMakeAccessors

    if (provider.FOR_NODE_TYPES.includes(node.nodeType)) {
          // Get the binding from the provider within a computed observable so that we can update the bindings whenever
          // the binding context is updated or if the binding provider accesses observables.
      var bindingsUpdater = computed(
              function () {
                bindings = sourceBindings ? sourceBindings(bindingContext, node) : getBindings.call(provider, node, bindingContext)
                  // Register a dependency on the binding context to support observable view models.
                if (bindings && bindingContext[contextSubscribeSymbol]) { bindingContext[contextSubscribeSymbol]() }
                return bindings
              },
              null, { disposeWhenNodeIsRemoved: node }
          )

      if (!bindings || !bindingsUpdater.isActive()) { bindingsUpdater = null }
    }
  }

  var bindingHandlerThatControlsDescendantBindings
  if (bindings) {
    const $component = bindingContext.$component || {}

    const allBindingHandlers = {}
    domData.set(node, 'bindingHandlers', allBindingHandlers)

        // Return the value accessor for a given binding. When bindings are static (won't be updated because of a binding
        // context update), just return the value accessor from the binding. Otherwise, return a function that always gets
        // the latest binding value and registers a dependency on the binding updater.
    const getValueAccessor = bindingsUpdater
            ? (bindingKey) => function (optionalValue) {
              var valueAccessor = bindingsUpdater()[bindingKey]
              if (arguments.length === 0) {
                return evaluateValueAccessor(valueAccessor)
              } else {
                return valueAccessor(optionalValue)
              }
            } : (bindingKey) => bindings[bindingKey]

        // Use of allBindings as a function is maintained for backwards compatibility, but its use is deprecated
    function allBindings () {
      return objectMap(bindingsUpdater ? bindingsUpdater() : bindings, evaluateValueAccessor)
    }
        // The following is the 3.x allBindings API
    allBindings.has = (key) => key in bindings
    allBindings.get = (key) => bindings[key] && evaluateValueAccessor(getValueAccessor(key))

    const bindingsGenerated = topologicalSortBindings(bindings, $component)
    for (const [key, BindingHandlerClass] of bindingsGenerated) {
        // Go through the sorted bindings, calling init and update for each
      function reportBindingError (during, errorCaptured) {
        onBindingError({
          during,
          errorCaptured,
          bindings,
          allBindings,
          bindingKey: key,
          bindingContext,
          element: node,
          valueAccessor: getValueAccessor(key)
        })
      }

      if (node.nodeType === 8 && !BindingHandlerClass.allowVirtualElements) {
        throw new Error(`The binding [${key}] cannot be used with virtual elements`)
      }

      try {
        const bindingHandler = dependencyDetection.ignore(() =>
          new BindingHandlerClass({
            allBindings,
            $element: node,
            $context: bindingContext,
            onError: reportBindingError,
            valueAccessor (...v) { return getValueAccessor(key)(...v) }
          })
        )

              // Expose the bindings via domData.
        allBindingHandlers[key] = bindingHandler

        if (bindingHandler.controlsDescendants) {
          if (bindingHandlerThatControlsDescendantBindings !== undefined) { throw new Error('Multiple bindings (' + bindingHandlerThatControlsDescendantBindings + ' and ' + key + ') are trying to control descendant bindings of the same element. You cannot use these bindings together on the same element.') }
          bindingHandlerThatControlsDescendantBindings = key
        }

        if (bindingHandler.bindingCompleted instanceof options.Promise) {
          asyncBindingsApplied.add(bindingHandler.bindingCompleted)
        }
      } catch (err) {
        reportBindingError('creation', err)
      }
    }
  }

  return {
    shouldBindDescendants: bindingHandlerThatControlsDescendantBindings === undefined
  }
}

function getBindingContext (viewModelOrBindingContext, extendContextCallback) {
  return viewModelOrBindingContext && (viewModelOrBindingContext instanceof bindingContext)
    ? viewModelOrBindingContext
    : new bindingContext(viewModelOrBindingContext, undefined, undefined, extendContextCallback)
}

export function applyBindingAccessorsToNode (node, bindings, viewModelOrBindingContext, asyncBindingsApplied) {
  if (node.nodeType === 1) { // If it's an element, workaround IE <= 8 HTML parsing weirdness
    virtualElements.normaliseVirtualElementDomStructure(node)
  }
  return applyBindingsToNodeInternal(node, bindings, getBindingContext(viewModelOrBindingContext), asyncBindingsApplied)
}

export function applyBindingsToNode (node, bindings, viewModelOrBindingContext) {
  const asyncBindingsApplied = new Set()
  var context = getBindingContext(viewModelOrBindingContext)
  applyBindingAccessorsToNode(node, makeBindingAccessors(bindings, context, node), context, asyncBindingsApplied)
  return options.Promise.all(asyncBindingsApplied)
}

export function applyBindingsToDescendants (viewModelOrBindingContext, rootNode) {
  const asyncBindingsApplied = new Set()
  if (rootNode.nodeType === 1 || rootNode.nodeType === 8) {
    applyBindingsToDescendantsInternal(getBindingContext(viewModelOrBindingContext), rootNode, asyncBindingsApplied)
  }
  return options.Promise.all(asyncBindingsApplied)
}

export function applyBindings (viewModelOrBindingContext, rootNode, extendContextCallback) {
  const asyncBindingsApplied = new Set()
  // If jQuery is loaded after Knockout, we won't initially have access to it. So save it here.
  if (!options.jQuery === undefined && options.jQuery) {
    options.jQuery = options.jQuery
  }

  // rootNode is optional
  if (!rootNode) {
    rootNode = window.document.body
    if (!rootNode) {
      throw Error('ko.applyBindings: could not find window.document.body; has the document been loaded?')
    }
  } else if (rootNode.nodeType !== 1 && rootNode.nodeType !== 8) {
    throw Error('ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node')
  }
  const rootContext = getBindingContext(viewModelOrBindingContext, extendContextCallback)
  applyBindingsToNodeAndDescendantsInternal(rootContext, rootNode, asyncBindingsApplied)
  return options.Promise.all(asyncBindingsApplied)
}

function onBindingError (spec) {
  var error, bindingText
  if (spec.bindingKey) {
        // During: 'init' or initial 'update'
    error = spec.errorCaptured
    spec.message = 'Unable to process binding "' + spec.bindingKey +
            '" in binding "' + spec.bindingKey +
            '"\nMessage: ' + (error.message ? error.message : error)
  } else {
        // During: 'apply'
    error = spec.errorCaptured
  }
  try {
    extend(error, spec)
  } catch (e) {
        // Read-only error e.g. a DOMEXception.
    spec.stack = error.stack
    error = new Error(error.message ? error.message : error)
    extend(error, spec)
  }
  options.onError(error)
}
