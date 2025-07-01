
import { domData } from '@tko/utils'
import { subscribable } from '@tko/observable'
import type { Subscribable, SubscriptionCallback } from '@tko/observable'

export const contextAncestorBindingInfo = Symbol('_ancestorBindingInfo')
const boundElementDomDataKey = domData.nextKey()

export const bindingEvent = {
  childrenComplete: 'childrenComplete',
  descendantsComplete: 'descendantsComplete',

  subscribe(node: Node, event: string, callback: SubscriptionCallback, context: any) {
    const bindingInfo = domData.getOrSet(node, boundElementDomDataKey, {})
    if (!bindingInfo.eventSubscribable) {
      bindingInfo.eventSubscribable = new subscribable()
    }
    return (bindingInfo.eventSubscribable as Subscribable).subscribe(callback, context, event)
  },

  notify(node: Node, event: string) {
    const bindingInfo = domData.get(node, boundElementDomDataKey)
    if (bindingInfo) {
      if (bindingInfo.eventSubscribable) {
        (bindingInfo.eventSubscribable as Subscribable).notifySubscribers(node, event)
      }
    }
  }
}

