//
// DOM Events
//

import { objectForEach } from '../object';
import { jQueryInstance } from '../jquery';
import { ieVersion } from '../ie';
import { catchFunctionErrors } from '../error';

import { tagNameLower } from './info';
import { addDisposeCallback } from './disposal';
import options from '../options';

// Represent the known event types in a compact way, then at runtime transform it into a hash with event name as key (for fast lookup)
const knownEvents: {[evType: string]: string[]} = {},
  knownEventTypesByEventName: {[evType: string]: string} = {};

const keyEventTypeName = (options.global.navigator && /Firefox\/2/i.test(options.global.navigator.userAgent)) ? 'KeyboardEvent' : 'UIEvents';

knownEvents[keyEventTypeName] = ['keyup', 'keydown', 'keypress'];

knownEvents.MouseEvents = [
  'click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseover',
  'mouseout', 'mouseenter', 'mouseleave'];

objectForEach(knownEvents, (eventType, knownEventsForType) => {
  if (knownEventsForType.length) {
    for (let i = 0, j = knownEventsForType.length; i < j; i++) { knownEventTypesByEventName[knownEventsForType[i]] = eventType; }
  }
});

function isClickOnCheckableElement(element: HTMLElement, eventType: string) {
  if ((tagNameLower(element) !== 'input') || !(element as HTMLInputElement).type) {
    return false;
  }

  if (eventType.toLowerCase() !== 'click') {
    return false;
  }

  const inputType = (element as HTMLInputElement).type;
  return (inputType === 'checkbox') || (inputType === 'radio');
}

// Workaround for an IE9 issue - https://github.com/SteveSanderson/knockout/issues/406
const eventsThatMustBeRegisteredUsingAttachEvent: {[type: string]: boolean} = { propertychange: true };
let jQueryEventAttachName: any;

export function registerEventHandler(element: HTMLElement, eventType: string, handler: EventListener, eventOptions = false) {
  const wrappedHandler = catchFunctionErrors(handler);
  const mustUseAttachEvent = ieVersion && eventsThatMustBeRegisteredUsingAttachEvent[eventType];
  const mustUseNative = Boolean(eventOptions);

  if (!options.useOnlyNativeEvents && !mustUseAttachEvent && !mustUseNative && jQueryInstance) {
    if (!jQueryEventAttachName) {
      jQueryEventAttachName = (typeof jQueryInstance(element).on === 'function') ? 'on' : 'bind';
    }
    (jQueryInstance(element) as any)[jQueryEventAttachName](eventType, wrappedHandler);
  } else if (!mustUseAttachEvent && typeof element.addEventListener === 'function') {
    element.addEventListener(eventType, wrappedHandler, eventOptions);
  } else if (typeof (element as any).attachEvent !== 'undefined') {
    const attachEventHandler = (event: any) => wrappedHandler.call(element, event);
    const attachEventName = 'on' + eventType;
    (element as any).attachEvent(attachEventName, attachEventHandler);

    // IE does not dispose attachEvent handlers automatically (unlike with addEventListener)
    // so to avoid leaks, we have to remove them manually. See bug #856
    addDisposeCallback(element, () => {
      (element as any).detachEvent(attachEventName, attachEventHandler);
    });
  } else {
    throw new Error("Browser doesn't support addEventListener or attachEvent");
  }
}

export function triggerEvent(element: HTMLElement, eventType: string) {
  if (!(element && element.nodeType)) { throw new Error('element must be a DOM node when calling triggerEvent'); }

    // For click events on checkboxes and radio buttons, jQuery toggles the element checked state *after* the
    // event handler runs instead of *before*. (This was fixed in 1.9 for checkboxes but not for radio buttons.)
    // IE doesn't change the checked state when you trigger the click event using "fireEvent".
    // In both cases, we'll use the click method instead.
  const useClickWorkaround = isClickOnCheckableElement(element, eventType);

  if (!options.useOnlyNativeEvents && jQueryInstance && !useClickWorkaround) {
    jQueryInstance(element).trigger(eventType);
  } else if (typeof document.createEvent === 'function') {
    if (typeof element.dispatchEvent === 'function') {
      const eventCategory = knownEventTypesByEventName[eventType] || 'HTMLEvents';
      const event = document.createEvent(eventCategory);
      (event as any).initEvent(eventType, true, true, options.global, 0, 0, 0, 0, 0, false, false, false, false, 0, element);
      element.dispatchEvent(event);
    } else { throw new Error("The supplied element doesn't support dispatchEvent"); }
  } else if (useClickWorkaround && element.click) {
    element.click();
  } else if (typeof (element as any).fireEvent !== 'undefined') {
    (element as any).fireEvent('on' + eventType);
  } else {
    throw new Error("Browser doesn't support triggering events");
  }
}
