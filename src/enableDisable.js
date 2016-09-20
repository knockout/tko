
import {
    unwrap
} from 'tko.observable';

export var enable = {
    update: function (element, valueAccessor) {
        var value = unwrap(valueAccessor());
        if (value && element.disabled) {
            element.removeAttribute("disabled");
        } else if ((!value) && (!element.disabled)) {
            element.disabled = true;
        }
    }
};

export var disable = {
    update: function (element, valueAccessor) {
        enable.update(element, function() { return !unwrap(valueAccessor()); });
    }
};
