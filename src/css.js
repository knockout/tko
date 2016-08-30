
import {
    createSymbolOrString, toggleDomNodeCssClass, objectForEach, stringTrim
} from 'tko.utils';

import {
    unwrap
} from 'tko.observable';



export var css = {
    aliases: ['class'],
    update: function (element, valueAccessor) {
        var value = unwrap(valueAccessor());
        if (value !== null && typeof value == "object") {
            objectForEach(value, function(className, shouldHaveClass) {
                shouldHaveClass = unwrap(shouldHaveClass);
                toggleDomNodeCssClass(element, className, shouldHaveClass);
            });
        } else {
            value = stringTrim(String(value || '')); // Make sure we don't try to store or set a non-string value
            toggleDomNodeCssClass(element, element[css.classesWrittenByBindingKey], false);
            element[css.classesWrittenByBindingKey] = value;
            toggleDomNodeCssClass(element, value, true);
        }
    },
    classesWrittenByBindingKey: createSymbolOrString('__ko__cssValue')
};
