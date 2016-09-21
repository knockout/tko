
import {
    createSymbolOrString, triggerEvent, registerEventHandler
} from 'tko.utils';

import {
    unwrap, dependencyDetection
} from 'tko.observable';

var hasfocusUpdatingProperty = createSymbolOrString('__ko_hasfocusUpdating');
var hasfocusLastValue = createSymbolOrString('__ko_hasfocusLastValue');

export var hasfocus = {
    init: function(element, valueAccessor /*, allBindings */) {
        var handleElementFocusChange = function(isFocused) {
            // Where possible, ignore which event was raised and determine focus state using activeElement,
            // as this avoids phantom focus/blur events raised when changing tabs in modern browsers.
            // However, not all KO-targeted browsers (Firefox 2) support activeElement. For those browsers,
            // prevent a loss of focus when changing tabs/windows by setting a flag that prevents hasfocus
            // from calling 'blur()' on the element when it loses focus.
            // Discussion at https://github.com/SteveSanderson/knockout/pull/352
            element[hasfocusUpdatingProperty] = true;
            var ownerDoc = element.ownerDocument;
            if ("activeElement" in ownerDoc) {
                var active;
                try {
                    active = ownerDoc.activeElement;
                } catch(e) {
                    // IE9 throws if you access activeElement during page load (see issue #703)
                    active = ownerDoc.body;
                }
                isFocused = (active === element);
            }
            // var modelValue = valueAccessor();
            valueAccessor(isFocused, {onlyIfChanged: true});

            //cache the latest value, so we can avoid unnecessarily calling focus/blur in the update function
            element[hasfocusLastValue] = isFocused;
            element[hasfocusUpdatingProperty] = false;
        };
        var handleElementFocusIn = handleElementFocusChange.bind(null, true);
        var handleElementFocusOut = handleElementFocusChange.bind(null, false);

        registerEventHandler(element, "focus", handleElementFocusIn);
        registerEventHandler(element, "focusin", handleElementFocusIn); // For IE
        registerEventHandler(element, "blur",  handleElementFocusOut);
        registerEventHandler(element, "focusout",  handleElementFocusOut); // For IE
    },
    update: function(element, valueAccessor) {
        var value = !!unwrap(valueAccessor());

        if (!element[hasfocusUpdatingProperty] && element[hasfocusLastValue] !== value) {
            value ? element.focus() : element.blur();

            // In IE, the blur method doesn't always cause the element to lose focus (for example, if the window is not in focus).
            // Setting focus to the body element does seem to be reliable in IE, but should only be used if we know that the current
            // element was focused already.
            if (!value && element[hasfocusLastValue]) {
                element.ownerDocument.body.focus();
            }

            // For IE, which doesn't reliably fire "focus" or "blur" events synchronously
            dependencyDetection.ignore(triggerEvent, null, [element, value ? "focusin" : "focusout"]);
        }
    }
};
