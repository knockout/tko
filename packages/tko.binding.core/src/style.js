
import {
    objectForEach
} from 'tko.utils';

import {
    unwrap
} from 'tko.observable';

export var style = {
    update: function (element, valueAccessor) {
        var value = unwrap(valueAccessor() || {});
        objectForEach(value, function(styleName, styleValue) {
            styleValue = unwrap(styleValue);

            if (styleValue === null || styleValue === undefined || styleValue === false) {
                // Empty string removes the value, whereas null/undefined have no effect
                styleValue = "";
            }

            element.style[styleName] = styleValue;
        });
    }
};
