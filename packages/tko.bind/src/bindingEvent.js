
import {
  domData
} from 'tko.utils'

import {
  subscribable
} from 'tko.observable'

export const contextAncestorBindingInfo = Symbol('_ancestorBindingInfo')
const boundElementDomDataKey = domData.nextKey()

export const bindingEvent = {
  childrenComplete: 'childrenComplete',
  descendantsComplete: 'descendantsComplete',

  subscribe: function (node, event, callback, context) {
    const bindingInfo = domData.getOrSet(node, boundElementDomDataKey, {})
    if (!bindingInfo.eventSubscribable) {
      bindingInfo.eventSubscribable = new subscribable()
    }
    return bindingInfo.eventSubscribable.subscribe(callback, context, event)
  },

  notify: function (node, event) {
    const bindingInfo = domData.get(node, boundElementDomDataKey)
    if (bindingInfo) {
      if (bindingInfo.eventSubscribable) {
        bindingInfo.eventSubscribable['notifySubscribers'](node, event)
      }
      if (event === bindingEvent.childrenComplete) {
        if (bindingInfo.asyncContext) {
          bindingInfo.asyncContext.completeChildren()
        } else if (bindingInfo.eventSubscribable && bindingInfo.eventSubscribable.hasSubscriptionsForEvent(bindingEvent.descendantsComplete)) {
          throw new Error('descendantsComplete event not supported for bindings on this node')
        }
      }
    }
  }
}
