import {
    extend, options, anyDomNodeIsAttachedToDocument, addDisposeCallback,
    arrayRemoveItem, domData
} from 'tko.utils'

import {
    computed
} from 'tko.computed'

import {
    unwrap, isObservable
} from 'tko.observable'

export const boundElementDomDataKey = domData.nextKey()

export const contextSubscribeSymbol = Symbol('Knockout Context Subscription')

// Unique stub to indicate inheritance.
const inheritParentIndicator = Symbol('Knockout Parent Indicator')

// The bindingContext constructor is only called directly to create the root context. For child
// contexts, use bindingContext.createChildContext or bindingContext.extend.
export function bindingContext (dataItemOrAccessor, parentContext, dataItemAlias, extendCallback, settings) {
  const self = this
  const shouldInheritData = dataItemOrAccessor === inheritParentIndicator
  const realDataItemOrAccessor = shouldInheritData ? undefined : dataItemOrAccessor
  const isFunc = typeof realDataItemOrAccessor === 'function' && !isObservable(realDataItemOrAccessor)

  let nodes
  let subscribable

    // The binding context object includes static properties for the current, parent, and root view models.
    // If a view model is actually stored in an observable, the corresponding binding context object, and
    // any child contexts, must be updated when the view model is changed.
  function updateContext () {
        // Most of the time, the context will directly get a view model object, but if a function is given,
        // we call the function to retrieve the view model. If the function accesses any observables or returns
        // an observable, the dependency is tracked, and those observables can later cause the binding
        // context to be updated.
    const dataItemOrObservable = isFunc ? realDataItemOrAccessor() : realDataItemOrAccessor
    let dataItem = unwrap(dataItemOrObservable)

    if (parentContext) {
            // When a "parent" context is given, register a dependency on the parent context. Thus whenever the
            // parent context is updated, this context will also be updated.
      if (parentContext[contextSubscribeSymbol]) {
        parentContext[contextSubscribeSymbol]()
      }

            // Copy $root and any custom properties from the parent context
      extend(self, parentContext)

            // Because the above copy overwrites our own properties, we need to reset them.
      self[contextSubscribeSymbol] = subscribable
    } else {
      self.$parents = []
      self.$root = dataItem

      // Export 'ko' in the binding context so it will be available in bindings and templates
      // even if 'ko' isn't exported as a global, such as when using an AMD loader.
      // See https://github.com/SteveSanderson/knockout/issues/490
      self.ko = options.knockoutInstance
    }

    if (shouldInheritData) {
      dataItem = self.$data
    } else {
      self.$rawData = dataItemOrObservable
      self.$data = dataItem
    }

    if (dataItemAlias) { self[dataItemAlias] = dataItem }

        // The extendCallback function is provided when creating a child context or extending a context.
        // It handles the specific actions needed to finish setting up the binding context. Actions in this
        // function could also add dependencies to this binding context.
    if (extendCallback) { extendCallback(self, parentContext, dataItem) }

    return self.$data
  }

  function disposeWhen () {
    return nodes && !anyDomNodeIsAttachedToDocument(nodes)
  }

  if (settings && settings.exportDependencies) {
        // The "exportDependencies" option means that the calling code will track any dependencies and re-create
        // the binding context when they change.
    updateContext()
    return
  }

  subscribable = computed(updateContext, null, { disposeWhen: disposeWhen, disposeWhenNodeIsRemoved: true })

    // At this point, the binding context has been initialized, and the "subscribable" computed observable is
    // subscribed to any observables that were accessed in the process. If there is nothing to track, the
    // computed will be inactive, and we can safely throw it away. If it's active, the computed is stored in
    // the context object.
  if (subscribable.isActive()) {
    self[contextSubscribeSymbol] = subscribable

        // Always notify because even if the model ($data) hasn't changed, other context properties might have changed
    subscribable.equalityComparer = null

        // We need to be able to dispose of this computed observable when it's no longer needed. This would be
        // easy if we had a single node to watch, but binding contexts can be used by many different nodes, and
        // we cannot assume that those nodes have any relation to each other. So instead we track any node that
        // the context is attached to, and dispose the computed when all of those nodes have been cleaned.

        // Add properties to *subscribable* instead of *self* because any properties added to *self* may be overwritten on updates
    nodes = []
    subscribable._addNode = function (node) {
      nodes.push(node)
      addDisposeCallback(node, function (node) {
        arrayRemoveItem(nodes, node)
        if (!nodes.length) {
          subscribable.dispose()
          self[contextSubscribeSymbol] = subscribable = undefined
        }
      })
    }
  }
}

Object.assign(bindingContext.prototype, {

  lookup (token, globals, node) {
    // short circuits
    switch (token) {
      case '$element': return node
      case '$context': return this
      case 'this': case '$data': return this.$data
    }
    const $data = this.$data
    // instanceof Object covers 1. {}, 2. [], 3. function() {}, 4. new *;  it excludes undefined, null, primitives.
    if ($data instanceof Object && token in $data) { return $data[token] }
    if (token in this) { return this[token] }
    if (token in globals) { return globals[token] }

    throw new Error(`The variable "${token}" was not found on $data, $context, or globals.`)
  },

  // Extend the binding context hierarchy with a new view model object. If the parent context is watching
  // any observables, the new child context will automatically get a dependency on the parent context.
  // But this does not mean that the $data value of the child context will also get updated. If the child
  // view model also depends on the parent view model, you must provide a function that returns the correct
  // view model on each update.
  createChildContext (dataItemOrAccessor, dataItemAlias, extendCallback, settings) {
    return new bindingContext(dataItemOrAccessor, this, dataItemAlias, function (self, parentContext) {
          // Extend the context hierarchy by setting the appropriate pointers
      self.$parentContext = parentContext
      self.$parent = parentContext.$data
      self.$parents = (parentContext.$parents || []).slice(0)
      self.$parents.unshift(self.$parent)
      if (extendCallback) { extendCallback(self) }
    }, settings)
  },

  // Extend the binding context with new custom properties. This doesn't change the context hierarchy.
  // Similarly to "child" contexts, provide a function here to make sure that the correct values are set
  // when an observable view model is updated.
  extend (properties) {
    // If the parent context references an observable view model, "_subscribable" will always be the
    // latest view model object. If not, "_subscribable" isn't set, and we can use the static "$data" value.
    return new bindingContext(inheritParentIndicator, this, null, function (self, parentContext) {
      extend(self, typeof properties === 'function' ? properties() : properties)
    })
  },

  createStaticChildContext (dataItemOrAccessor, dataItemAlias) {
    return this.createChildContext(dataItemOrAccessor, dataItemAlias, null, { 'exportDependencies': true })
  }
})

export function storedBindingContextForNode (node) {
  const bindingInfo = domData.get(node, boundElementDomDataKey)
  return bindingInfo && bindingInfo.context
}

// Retrieving binding context from arbitrary nodes
export function contextFor (node) {
  // We can only do something meaningful for elements and comment nodes (in particular, not text nodes, as IE can't store domdata for them)
  if (node && (node.nodeType === 1 || node.nodeType === 8)) {
    return storedBindingContextForNode(node)
  }
}

export function dataFor (node) {
  var context = contextFor(node)
  return context ? context.$data : undefined
}
