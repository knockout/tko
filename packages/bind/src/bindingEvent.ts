import { domData } from '@tko/utils'
import { subscribable } from '@tko/observable'
import type { Subscribable, SubscriptionCallback } from '@tko/observable'
import type Subscription from '@tko/observable/src/Subscription'

export const contextAncestorBindingInfo = Symbol('_ancestorBindingInfo')
const boundElementDomDataKey = domData.nextKey()

export const bindingEvent = {
  //TODO better: String-Enum "BindingEventEnum"
  childrenComplete: 'childrenComplete',
  descendantsComplete: 'descendantsComplete',

  subscribe(
    node: Node,
    event: string | 'childrenComplete' | 'descendantsComplete',
    callback: (node: Node) => void,
    callbackContext?: any
  ): Subscription {
    const bindingInfo = domData.getOrSet(node, boundElementDomDataKey, {})
    if (!bindingInfo.eventSubscribable) {
      bindingInfo.eventSubscribable = new subscribable()
    }
    return (bindingInfo.eventSubscribable as Subscribable).subscribe(callback, callbackContext, event)
  },

  notify(node: Node, event: string) {
    const bindingInfo = domData.get(node, boundElementDomDataKey)
    if (bindingInfo) {
      if (bindingInfo.eventSubscribable) {
        ;(bindingInfo.eventSubscribable as Subscribable).notifySubscribers(node, event)
      }
    }
  }
}
