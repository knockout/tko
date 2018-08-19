
import {
  domData, removeDisposeCallback, arrayRemoveItem, addDisposeCallback
} from '@tko/utils'

import {
  subscribable
} from '@tko/observable'

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
    }
  }
}

