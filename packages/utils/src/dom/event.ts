//
// DOM Events
//

import { objectForEach } from '../object'
import { catchFunctionErrors } from '../error'
import { tagNameLower } from './info'

import options from '../options'

// Represent the known event types in a compact way, then at runtime transform it into a hash with event name as key (for fast lookup)
const knownEvents = {},
  knownEventTypesByEventName = {}

knownEvents['UIEvents'] = ['keyup', 'keydown', 'keypress']

knownEvents['MouseEvents'] = [
  'click',
  'dblclick',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseover',
  'mouseout',
  'mouseenter',
  'mouseleave'
]

objectForEach(knownEvents, function (eventType, knownEventsForType) {
  if (knownEventsForType.length) {
    for (let i = 0, j = knownEventsForType.length; i < j; i++) {
      knownEventTypesByEventName[knownEventsForType[i]] = eventType
    }
  }
})

function isClickOnCheckableElement(element: Element, eventType: string) {
  if (tagNameLower(element) !== 'input' || !(element as HTMLInputElement).type) return false
  if (eventType.toLowerCase() != 'click') return false
  const inputType = (element as HTMLInputElement).type
  return inputType == 'checkbox' || inputType == 'radio'
}

export function registerEventHandler(
  element: Element,
  eventType: string,
  handler: EventListener,
  eventOptions = false
): void {
  const wrappedHandler = catchFunctionErrors(handler)
  const mustUseNative = Boolean(eventOptions)
  const jQuery = options.jQuery

  if (!options.useOnlyNativeEvents && !mustUseNative && jQuery) {
    jQuery(element).on(eventType, wrappedHandler)
  } else if (typeof element.addEventListener === 'function') {
    element.addEventListener(eventType, wrappedHandler, eventOptions)
  } else {
    throw new Error("Browser doesn't support addEventListener")
  }
}

function hasClick(element: Element): element is Element & { click(): void } {
  return typeof (element as any).click === 'function'
}

export function triggerEvent(element: Element, eventType: string): void {
  if (!(element && element.nodeType)) {
    throw new Error('element must be a DOM node when calling triggerEvent')
  }

  // For click events on checkboxes and radio buttons, jQuery toggles the element checked state *after* the
  // event handler runs instead of *before*. (This was fixed in 1.9 for checkboxes but not for radio buttons.)
  const useClickWorkaround = isClickOnCheckableElement(element, eventType)

  if (!options.useOnlyNativeEvents && options.jQuery && !useClickWorkaround) {
    options.jQuery(element).trigger(eventType)
  } else if (typeof document.createEvent === 'function') {
    if (typeof element.dispatchEvent === 'function') {
      const eventCategory = knownEventTypesByEventName[eventType] || 'HTMLEvents'
      const event = document.createEvent(eventCategory)
      ;(event as any).initEvent(
        eventType,
        true,
        true,
        options.global,
        0,
        0,
        0,
        0,
        0,
        false,
        false,
        false,
        false,
        0,
        element
      )
      element.dispatchEvent(event)
    } else {
      throw new Error("The supplied element doesn't support dispatchEvent")
    }
  } else if (useClickWorkaround && hasClick(element)) {
    element.click()
  } else {
    throw new Error("Browser doesn't support triggering events")
  }
}
