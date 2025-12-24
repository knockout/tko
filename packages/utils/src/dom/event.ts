//
// DOM Events
//

import { objectForEach } from '../object'
import { ieVersion } from '../ie'
import { catchFunctionErrors } from '../error'

import { tagNameLower } from './info'
import { addDisposeCallback } from './disposal'
import options from '../options'

// Represent the known event types in a compact way, then at runtime transform it into a hash with event name as key (for fast lookup)
const knownEvents = {},
  knownEventTypesByEventName = {}

const keyEventTypeName =
  options.global.navigator && /Firefox\/2/i.test(options.global.navigator.userAgent) ? 'KeyboardEvent' : 'UIEvents'

knownEvents[keyEventTypeName] = ['keyup', 'keydown', 'keypress']

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

// Workaround for an IE9 issue - https://github.com/SteveSanderson/knockout/issues/406
const eventsThatMustBeRegisteredUsingAttachEvent = { propertychange: true }
let jQueryEventAttachName

function hasIEAttachEvents(
  el: Element
): el is Element & { attachEvent: (event: string, handler: EventListener) => void } & {
  detachEvent: (event: string, handler: EventListener) => void
} {
  return typeof (el as any).attachEvent === 'function' && typeof (el as any).detachEvent === 'function'
}

export function registerEventHandler(
  element: Element,
  eventType: string,
  handler: EventListener,
  eventOptions = false
): void {
  const wrappedHandler = catchFunctionErrors(handler)
  const mustUseAttachEvent = ieVersion && eventsThatMustBeRegisteredUsingAttachEvent[eventType]
  const mustUseNative = Boolean(eventOptions)
  const jQuery = options.jQuery

  if (!options.useOnlyNativeEvents && !mustUseAttachEvent && !mustUseNative && jQuery) {
    jQuery(element).on(eventType, wrappedHandler)
  } else if (!mustUseAttachEvent && typeof element.addEventListener === 'function') {
    element.addEventListener(eventType, wrappedHandler, eventOptions)
  } else if (hasIEAttachEvents(element)) {
    const attachEventHandler = function (event) {
      wrappedHandler.call(element, event)
    }
    const attachEventName = 'on' + eventType
    element.attachEvent(attachEventName, attachEventHandler)

    // IE does not dispose attachEvent handlers automatically (unlike with addEventListener)
    // so to avoid leaks, we have to remove them manually. See bug #856
    addDisposeCallback(element, function () {
      element.detachEvent(attachEventName, attachEventHandler)
    })
  } else {
    throw new Error("Browser doesn't support addEventListener or attachEvent")
  }
}

function hasClick(element: Element): element is Element & { click(): void } {
  return typeof (element as any).click === 'function'
}

function hasFireEvent(element: Element): element is Element & { fireEvent(eventType: string): void } {
  return typeof (element as any).click === 'function'
}

export function triggerEvent(element: Element, eventType: string): void {
  if (!(element && element.nodeType)) {
    throw new Error('element must be a DOM node when calling triggerEvent')
  }

  // For click events on checkboxes and radio buttons, jQuery toggles the element checked state *after* the
  // event handler runs instead of *before*. (This was fixed in 1.9 for checkboxes but not for radio buttons.)
  // IE doesn't change the checked state when you trigger the click event using "fireEvent".
  // In both cases, we'll use the click method instead.
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
  } else if (hasFireEvent(element)) {
    element.fireEvent('on' + eventType)
  } else {
    throw new Error("Browser doesn't support triggering events")
  }
}
