
import {
  domData
} from 'tko.utils'

import {
  subscribable
} from 'tko.observable'

export const bindingEvent = {
  childrenComplete: 'childrenComplete',
  descendentsComplete: 'descendentsComplete'
}

const bindingEventsDomDataKey = domData.nextKey()

export function notifyBindingEvent (node, event) {
  const eventSubscribable = domData.get(node, bindingEventsDomDataKey)
  if (eventSubscribable) {
    eventSubscribable.notifySubscribers(node, event)
  }
}

export function subscribeToBindingEvent (node, event, callback) {
  var eventSubscribable = domData.get(node, bindingEventsDomDataKey)
  if (!eventSubscribable) {
    domData.set(node, bindingEventsDomDataKey, eventSubscribable = new subscribable())
  }
  return eventSubscribable.subscribe(callback, null, event)
}
