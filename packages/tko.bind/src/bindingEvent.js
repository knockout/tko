
import {
  domData, removeDisposeCallback, arrayRemoveItem, addDisposeCallback
} from 'tko.utils'

import {
  subscribable
} from 'tko.observable'

export const contextAncestorBindingInfo = Symbol('_ancestorBindingInfo')
const boundElementDomDataKey = domData.nextKey()

export const bindingEvent = {
  childrenComplete: 'childrenComplete',
  descendantsComplete: 'descendantsComplete',

  subscribe (node, event, callback, context) {
    const bindingInfo = domData.getOrSet(node, boundElementDomDataKey, {})
    if (!bindingInfo.eventSubscribable) {
      bindingInfo.eventSubscribable = new subscribable()
    }
    return bindingInfo.eventSubscribable.subscribe(callback, context, event)
  },

  notify (node, event) {
    const bindingInfo = domData.get(node, boundElementDomDataKey)
    if (bindingInfo) {
      if (bindingInfo.eventSubscribable) {
        bindingInfo.eventSubscribable.notifySubscribers(node, event)
      }
      if (event === bindingEvent.childrenComplete) {
        if (bindingInfo.asyncContext) {
          bindingInfo.asyncContext.completeChildren()
        } else if (bindingInfo.eventSubscribable && bindingInfo.eventSubscribable.hasSubscriptionsForEvent(bindingEvent.descendantsComplete)) {
          throw new Error('descendantsComplete event not supported for bindings on this node')
        }
      }
    }
  },

  startPossiblyAsyncContentBinding (node, bindingContext) {
    const bindingInfo = domData.getOrSet(node, boundElementDomDataKey, {})

    // Create (or get the existing) async context object for this node, and return a new binding context with a pointer to this node
    if (!bindingInfo.asyncContext) {
      bindingInfo.asyncContext = new AsyncCompleteContext(node, bindingInfo, bindingContext[contextAncestorBindingInfo])
    }

    // If the context was already extended with this node's binding info, just return the extended context
    if (bindingContext[contextAncestorBindingInfo] === bindingInfo) {
      return bindingContext
    }

    return bindingContext.extend(function () {
      this[contextAncestorBindingInfo] = bindingInfo
    })
  }
}

function asyncContextDispose (node) {
  const bindingInfo = domData.get(node, boundElementDomDataKey)
  const asyncContext = bindingInfo && bindingInfo.asyncContext
  if (asyncContext) {
    bindingInfo.asyncContext = undefined
    asyncContext.notifyAncestor()
  }
}

class AsyncCompleteContext {
  constructor (node, bindingInfo, ancestorBindingInfo) {
    this.node = node
    this.bindingInfo = bindingInfo
    this.asyncDescendants = []
    this.childrenComplete = false

    if (!bindingInfo.asyncContext) {
      addDisposeCallback(node, asyncContextDispose)
    }

    if (ancestorBindingInfo && ancestorBindingInfo.asyncContext) {
      ancestorBindingInfo.asyncContext.asyncDescendants.push(node)
      this.ancestorBindingInfo = ancestorBindingInfo
    }
  }

  notifyAncestor () {
    if (this.ancestorBindingInfo && this.ancestorBindingInfo.asyncContext) {
      this.ancestorBindingInfo.asyncContext.descendantComplete(this.node)
    }
  }

  descendantComplete (node) {
    arrayRemoveItem(this.asyncDescendants, node)
    if (!this.asyncDescendants.length && this.childrenComplete) {
      this.completeChildren()
    }
  }

  completeChildren () {
    this.childrenComplete = true
    if (this.bindingInfo.asyncContext && !this.asyncDescendants.length) {
      this.bindingInfo.asyncContext = undefined
      removeDisposeCallback(this.node, asyncContextDispose)
      bindingEvent.notify(this.node, bindingEvent.descendantsComplete)
      this.notifyAncestor()
    }
  }
}
