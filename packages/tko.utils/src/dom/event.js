//
// DOM Events
//

import { objectForEach } from '../object.js';
import { jQueryInstance } from '../jquery.js';
import { ieVersion } from '../ie.js';
import { catchFunctionErrors } from '../error.js';

import { tagNameLower } from './info.js';
import { addDisposeCallback } from './disposal.js';
import options from '../options.js';


// Represent the known event types in a compact way, then at runtime transform it into a hash with event name as key (for fast lookup)
var knownEvents = {},
    knownEventTypesByEventName = {};

var keyEventTypeName = (navigator && /Firefox\/2/i.test(navigator.userAgent)) ? 'KeyboardEvent' : 'UIEvents';

knownEvents[keyEventTypeName] = ['keyup', 'keydown', 'keypress'];

knownEvents['MouseEvents'] = [
    'click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseover',
    'mouseout', 'mouseenter', 'mouseleave'];


objectForEach(knownEvents, function(eventType, knownEventsForType) {
    if (knownEventsForType.length) {
        for (var i = 0, j = knownEventsForType.length; i < j; i++)
            knownEventTypesByEventName[knownEventsForType[i]] = eventType;
    }
});


function isClickOnCheckableElement(element, eventType) {
    if ((tagNameLower(element) !== "input") || !element.type) return false;
    if (eventType.toLowerCase() != "click") return false;
    var inputType = element.type;
    return (inputType == "checkbox") || (inputType == "radio");
}


// Workaround for an IE9 issue - https://github.com/SteveSanderson/knockout/issues/406
var eventsThatMustBeRegisteredUsingAttachEvent = { 'propertychange': true };

export function registerEventHandler(element, eventType, handler) {
    var wrappedHandler = catchFunctionErrors(handler);

    var mustUseAttachEvent = ieVersion && eventsThatMustBeRegisteredUsingAttachEvent[eventType];
    if (!options.useOnlyNativeEvents && !mustUseAttachEvent && jQueryInstance) {
        jQueryInstance(element).bind(eventType, wrappedHandler);
    } else if (!mustUseAttachEvent && typeof element.addEventListener == "function")
        element.addEventListener(eventType, wrappedHandler, false);
    else if (typeof element.attachEvent !== "undefined") {
        var attachEventHandler = function (event) { wrappedHandler.call(element, event); },
            attachEventName = "on" + eventType;
        element.attachEvent(attachEventName, attachEventHandler);

        // IE does not dispose attachEvent handlers automatically (unlike with addEventListener)
        // so to avoid leaks, we have to remove them manually. See bug #856
        addDisposeCallback(element, function() {
            element.detachEvent(attachEventName, attachEventHandler);
        });
    } else
        throw new Error("Browser doesn't support addEventListener or attachEvent");
}

export function triggerEvent(element, eventType) {
    if (!(element && element.nodeType))
        throw new Error("element must be a DOM node when calling triggerEvent");

    // For click events on checkboxes and radio buttons, jQuery toggles the element checked state *after* the
    // event handler runs instead of *before*. (This was fixed in 1.9 for checkboxes but not for radio buttons.)
    // IE doesn't change the checked state when you trigger the click event using "fireEvent".
    // In both cases, we'll use the click method instead.
    var useClickWorkaround = isClickOnCheckableElement(element, eventType);

    if (!options.useOnlyNativeEvents && jQueryInstance && !useClickWorkaround) {
        jQueryInstance(element).trigger(eventType);
    } else if (typeof document.createEvent == "function") {
        if (typeof element.dispatchEvent == "function") {
            var eventCategory = knownEventTypesByEventName[eventType] || "HTMLEvents";
            var event = document.createEvent(eventCategory);
            event.initEvent(eventType, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, element);
            element.dispatchEvent(event);
        }
        else
            throw new Error("The supplied element doesn't support dispatchEvent");
    } else if (useClickWorkaround && element.click) {
        element.click();
    } else if (typeof element.fireEvent != "undefined") {
        element.fireEvent("on" + eventType);
    } else {
        throw new Error("Browser doesn't support triggering events");
    }
}
