import {
    virtualElements, fixUpContinuousNodeArray, replaceDomNodes, memoization,
    domNodeIsAttachedToDocument, moveCleanedNodesToContainerElement,
    arrayFilter, domData, options as koOptions
} from '@tko/utils'

import {
    applyBindings, setDomNodeChildrenFromArrayMapping, AsyncBindingHandler,
    bindingEvent, bindingContext as BindingContextConstructor
} from '@tko/bind'

import {
    computed
} from '@tko/computed'

import {
    isObservable, dependencyDetection, unwrap, observable, isObservableArray
} from '@tko/observable'

import {
    templateEngine
} from './templateEngine'

import {
  anonymousTemplate as AnonymousTemplate
} from './templateSources'

var _templateEngine
const cleanContainerDomDataKey = domData.nextKey()

export function setTemplateEngine (tEngine) {
  if ((tEngine !== undefined) && !(tEngine instanceof templateEngine)) {
        // TODO: ko.templateEngine to appropriate name
    throw new Error('templateEngine must inherit from ko.templateEngine')
  }
  _templateEngine = tEngine
}

function invokeForEachNodeInContinuousRange (firstNode, lastNode, action) {
  let node
  let nextInQueue = firstNode
  let firstOutOfRangeNode = virtualElements.nextSibling(lastNode)
  while (nextInQueue && ((node = nextInQueue) !== firstOutOfRangeNode)) {
    nextInQueue = virtualElements.nextSibling(node)
    action(node, nextInQueue)
  }
}

function activateBindingsOnContinuousNodeArray (continuousNodeArray, bindingContext: BindingContext, afterBindingCallback) {
  // To be used on any nodes that have been rendered by a template and have been inserted into some parent element
  // Walks through continuousNodeArray (which *must* be continuous, i.e., an uninterrupted sequence of sibling nodes, because
  // the algorithm for walking them relies on this), and for each top-level item in the virtual-element sense,
  // (1) Does a regular "applyBindings" to associate bindingContext with this node and to activate any non-memoized bindings
  // (2) Unmemoizes any memos in the DOM subtree (e.g., to activate bindings that had been memoized during template rewriting)

  if (continuousNodeArray.length) {
    var firstNode = continuousNodeArray[0]
    var lastNode = continuousNodeArray[continuousNodeArray.length - 1]
    var parentNode = firstNode.parentNode
    var provider = koOptions.bindingProviderInstance
    var preprocessNode = provider.preprocessNode

    if (preprocessNode) {
      invokeForEachNodeInContinuousRange(firstNode, lastNode, function (node, nextNodeInRange) {
        var nodePreviousSibling = node.previousSibling
        var newNodes = preprocessNode.call(provider, node)
        if (newNodes) {
          if (node === firstNode) { firstNode = newNodes[0] || nextNodeInRange }
          if (node === lastNode) { lastNode = newNodes[newNodes.length - 1] || nodePreviousSibling }
        }
      })

      // Because preprocessNode can change the nodes, including the first and last nodes, update continuousNodeArray to match.
      // We need the full set, including inner nodes, because the unmemoize step might remove the first node (and so the real
      // first node needs to be in the array).
      continuousNodeArray.length = 0
      if (!firstNode) { // preprocessNode might have removed all the nodes, in which case there's nothing left to do
        return
      }
      if (firstNode === lastNode) {
        continuousNodeArray.push(firstNode)
      } else {
        continuousNodeArray.push(firstNode, lastNode)
        fixUpContinuousNodeArray(continuousNodeArray, parentNode)
      }
    }

    // Need to applyBindings *before* unmemoziation, because unmemoization might introduce extra nodes (that we don't want to re-bind)
    // whereas a regular applyBindings won't introduce new memoized nodes
    invokeForEachNodeInContinuousRange(firstNode, lastNode, function (node) {
      if (node.nodeType === 1 || node.nodeType === 8) { applyBindings(bindingContext, node).then(afterBindingCallback) }
    })
    invokeForEachNodeInContinuousRange(firstNode, lastNode, function (node) {
      if (node.nodeType === 1 || node.nodeType === 8) { memoization.unmemoizeDomNodeAndDescendants(node, [bindingContext]) }
    })

    // Make sure any changes done by applyBindings or unmemoize are reflected in the array
    fixUpContinuousNodeArray(continuousNodeArray, parentNode)
  }
}

function getFirstNodeFromPossibleArray (nodeOrNodeArray) {
  return nodeOrNodeArray.nodeType ? nodeOrNodeArray
                                    : nodeOrNodeArray.length > 0 ? nodeOrNodeArray[0]
                                    : null
}

function executeTemplate (targetNodeOrNodeArray, renderMode, template, bindingContext, options, afterBindingCallback) {
  options = options || {}
  var firstTargetNode = targetNodeOrNodeArray && getFirstNodeFromPossibleArray(targetNodeOrNodeArray)
  var templateDocument = (firstTargetNode || template || {}).ownerDocument
  var templateEngineToUse = (options.templateEngine || _templateEngine)
  var renderedNodesArray = templateEngineToUse.renderTemplate(template, bindingContext, options, templateDocument)

    // Loosely check result is an array of DOM nodes
  if ((typeof renderedNodesArray.length !== 'number') || (renderedNodesArray.length > 0 && typeof renderedNodesArray[0].nodeType !== 'number')) { throw new Error('Template engine must return an array of DOM nodes') }

  var haveAddedNodesToParent = false
  switch (renderMode) {
    case 'replaceChildren':
      virtualElements.setDomNodeChildren(targetNodeOrNodeArray, renderedNodesArray)
      haveAddedNodesToParent = true
      break
    case 'replaceNode':
      replaceDomNodes(targetNodeOrNodeArray, renderedNodesArray)
      haveAddedNodesToParent = true
      break
    case 'ignoreTargetNode': break
    default:
      throw new Error('Unknown renderMode: ' + renderMode)
  }

  if (haveAddedNodesToParent) {
    activateBindingsOnContinuousNodeArray(renderedNodesArray, bindingContext, afterBindingCallback)
    if (options.afterRender) { dependencyDetection.ignore(options.afterRender, null, [renderedNodesArray, bindingContext['$data']]) }
    if (renderMode === 'replaceChildren') {
      bindingEvent.notify(targetNodeOrNodeArray, bindingEvent.childrenComplete)
    }
  }

  return renderedNodesArray
}

function resolveTemplateName (template, data, context) {
    // The template can be specified as:
  if (isObservable(template)) {
    // 1. An observable, with string value
    return template()
  } else if (typeof template === 'function') {
    // 2. A function of (data, context) returning a string
    return template(data, context)
  } else {
    // 3. A string
    return template
  }
}

export function renderTemplate (template, dataOrBindingContext, options, targetNodeOrNodeArray, renderMode?, afterBindingCallback?) {
  options = options || {}
  if ((options.templateEngine || _templateEngine) === undefined) { throw new Error('Set a template engine before calling renderTemplate') }
  renderMode = renderMode || 'replaceChildren'

  if (targetNodeOrNodeArray) {
    var firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray)

    var whenToDispose = function () { return (!firstTargetNode) || !domNodeIsAttachedToDocument(firstTargetNode) } // Passive disposal (on next evaluation)
    var activelyDisposeWhenNodeIsRemoved = (firstTargetNode && renderMode === 'replaceNode') ? firstTargetNode.parentNode : firstTargetNode

    return computed( // So the DOM is automatically updated when any dependency changes
      function () {
        // Ensure we've got a proper binding context to work with
        var bindingContext = (dataOrBindingContext && (dataOrBindingContext instanceof BindingContextConstructor))
              ? dataOrBindingContext
              : new BindingContextConstructor(dataOrBindingContext, undefined, undefined, undefined, { 'exportDependencies': true })

        var templateName = resolveTemplateName(template, bindingContext.$data, bindingContext)
        const renderedNodesArray = executeTemplate(targetNodeOrNodeArray, renderMode, templateName, bindingContext, options, afterBindingCallback)

        if (renderMode === 'replaceNode') {
          targetNodeOrNodeArray = renderedNodesArray
          firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray)
        }
      },
      null,
      { disposeWhen: whenToDispose, disposeWhenNodeIsRemoved: activelyDisposeWhenNodeIsRemoved }
    )
  } else {
        // We don't yet have a DOM node to evaluate, so use a memo and render the template later when there is a DOM node
    return memoization.memoize(function (domNode) {
      renderTemplate(template, dataOrBindingContext, options, domNode, 'replaceNode')
    })
  }
}

export default function renderTemplateForEach (template, arrayOrObservableArray, options, targetNode, parentBindingContext, afterBindingCallback) {
    // Since setDomNodeChildrenFromArrayMapping always calls executeTemplateForArrayItem and then
    // activateBindingsCallback for added items, we can store the binding context in the former to use in the latter.
  var arrayItemContext

    // This will be called by setDomNodeChildrenFromArrayMapping to get the nodes to add to targetNode
  function executeTemplateForArrayItem (arrayValue, index) {
    // Support selecting template as a function of the data being rendered
    if (options.as) {
      if (koOptions.createChildContextWithAs) {
        arrayItemContext = parentBindingContext.createChildContext(
          arrayValue, options.as, context => { context.$index = index }
        )
      } else {
        arrayItemContext = parentBindingContext.extend({
          [options.as]: arrayValue,
          $index: index
        })
      }
    } else {
      arrayItemContext = parentBindingContext.createChildContext(arrayValue, options.as, context => { context.$index = index })
    }

    var templateName = resolveTemplateName(template, arrayValue, arrayItemContext)
    return executeTemplate(targetNode, 'ignoreTargetNode', templateName, arrayItemContext, options, afterBindingCallback)
  }

    // This will be called whenever setDomNodeChildrenFromArrayMapping has added nodes to targetNode
  var activateBindingsCallback = function (arrayValue, addedNodesArray /*, index */) {
    activateBindingsOnContinuousNodeArray(addedNodesArray, arrayItemContext, afterBindingCallback)
    if (options.afterRender) { options.afterRender(addedNodesArray, arrayValue) }

        // release the "cache" variable, so that it can be collected by
        // the GC when its value isn't used from within the bindings anymore.
    arrayItemContext = null
  }

  // Call setDomNodeChildrenFromArrayMapping, ignoring any observables unwrapped within (most likely from a callback function).
  // If the array items are observables, though, they will be unwrapped in executeTemplateForArrayItem and managed within setDomNodeChildrenFromArrayMapping.
  function localSetDomNodeChildrenFromArrayMapping (newArray, changeList?) {
    dependencyDetection.ignore(setDomNodeChildrenFromArrayMapping, null, [targetNode, newArray, executeTemplateForArrayItem, options, activateBindingsCallback, changeList])
    bindingEvent.notify(targetNode, bindingEvent.childrenComplete)
  }

  const shouldHideDestroyed = (options.includeDestroyed === false) || (koOptions.foreachHidesDestroyed && !options.includeDestroyed);
  if (!shouldHideDestroyed && !options.beforeRemove && isObservableArray(arrayOrObservableArray)) {
    localSetDomNodeChildrenFromArrayMapping(arrayOrObservableArray.peek())
    var subscription = arrayOrObservableArray.subscribe(function (changeList) {
      localSetDomNodeChildrenFromArrayMapping(arrayOrObservableArray(), changeList)
    }, null, 'arrayChange')
    subscription.disposeWhenNodeIsRemoved(targetNode)
    return subscription
  } else {
    return computed(function () {
      var unwrappedArray = unwrap(arrayOrObservableArray) || []
      const unwrappedIsIterable = Symbol.iterator in unwrappedArray
      if (!unwrappedIsIterable) { unwrappedArray = [unwrappedArray] }
      if (shouldHideDestroyed) {
        // Filter out any entries marked as destroyed
        unwrappedArray = arrayFilter(unwrappedArray, function (item) {
          return item === undefined || item === null || !unwrap(item._destroy);
        })
      }
      localSetDomNodeChildrenFromArrayMapping(unwrappedArray)
    }, null, { disposeWhenNodeIsRemoved: targetNode })
  }
}

let templateComputedDomDataKey = domData.nextKey()

export class TemplateBindingHandler extends AsyncBindingHandler {
  constructor (params) {
    super(params)
    const element = this.$element
    const bindingValue = unwrap(this.value)

    // Expose 'conditional' for `else` chaining.
    domData.set(element, 'conditional', {
      elseChainSatisfied: observable(true)
    })

    // Support anonymous templates
    if (typeof bindingValue === 'string' || bindingValue.name) {
      this.bindNamedTemplate()
    } else if ('nodes' in bindingValue) {
      this.bindNodeTemplate(bindingValue.nodes || [])
    } else {
      this.bindAnonymousTemplate()
    }
  }

  bindNamedTemplate () {
    // It's a named template - clear the element
    virtualElements.emptyNode(this.$element)
  }

  // We've been given an array of DOM nodes. Save them as the template source.
  // There is no known use case for the node array being an observable array (if the output
  // varies, put that behavior *into* your template - that's what templates are for), and
  // the implementation would be a mess, so assert that it's not observable.
  bindNodeTemplate (nodes) {
    if (isObservable(nodes)) {
      throw new Error('The "nodes" option must be a plain, non-observable array.')
    }

    // If the nodes are already attached to a KO-generated container, we reuse that container without moving the
    // elements to a new one (we check only the first node, as the nodes are always moved together)
    let container = nodes[0] && nodes[0].parentNode
    if (!container || !domData.get(container, cleanContainerDomDataKey)) {
      container = moveCleanedNodesToContainerElement(nodes)
      domData.set(container, cleanContainerDomDataKey, true)
    }

    new AnonymousTemplate(this.$element).nodes(container)
  }

  bindAnonymousTemplate () {
    // It's an anonymous template - store the element contents, then clear the element
    const templateNodes = virtualElements.childNodes(this.$element)
    if (templateNodes.length === 0) {
      throw new Error('Anonymous template defined, but no template content was provided.')
    }
    const container = moveCleanedNodesToContainerElement(templateNodes) // This also removes the nodes from their current parent
    new AnonymousTemplate(this.$element).nodes(container)
  }

  onValueChange () {
    const element = this.$element
    const bindingContext = this.$context
    var value = this.value
    var options = unwrap(value)
    var shouldDisplay = true
    let templateComputed: string | Computed<any> | null = null;
    var elseChainSatisfied = domData.get(element, 'conditional').elseChainSatisfied;
    var templateName;

    if (typeof options === 'string') {
      templateName = value;
      options = {};
    } else {
      templateName = options.name;

      // Support "if"/"ifnot" conditions
      if ('if' in options) {
        shouldDisplay = unwrap(options.if);
      }

      if (shouldDisplay && 'ifnot' in options) {
        shouldDisplay = !unwrap(options.ifnot);
      }
    }

    if ('foreach' in options) {
      // Render once for each data point (treating data set as empty if shouldDisplay==false)
      var dataArray = (shouldDisplay && options.foreach) || [];
      templateComputed = renderTemplateForEach(templateName || element, dataArray, options, element, bindingContext, this.completeBinding);

      elseChainSatisfied((unwrap(dataArray) || []).length !== 0);
    } else if (shouldDisplay) {
      // Render once for this single data point (or use the viewModel if no data was provided)
      var innerBindingContext = ('data' in options)
        ? bindingContext.createStaticChildContext(options.data, options.as)  // Given an explicit 'data' value, we create a child binding context for it
        : bindingContext;                                                        // Given no explicit 'data' value, we retain the same binding context
      templateComputed = renderTemplate(templateName || element, innerBindingContext, options, element, undefined, this.completeBinding);
      elseChainSatisfied(true);
    } else {
      virtualElements.emptyNode(element);
      elseChainSatisfied(false);
    }

    // It only makes sense to have a single template computed per element (otherwise which one should have its output displayed?)
    this.disposeOldComputedAndStoreNewOne(element, templateComputed);
  }

  disposeOldComputedAndStoreNewOne (element, newComputed) {
    let oldComputed = domData.get(element, templateComputedDomDataKey)
    if (oldComputed && (typeof oldComputed.dispose === 'function')) { oldComputed.dispose() }
    domData.set(element, templateComputedDomDataKey, (newComputed && (!newComputed.isActive || newComputed.isActive())) ? newComputed : undefined)
  }

  get controlsDescendants () { return true }
  static get allowVirtualElements () { return true }
}
