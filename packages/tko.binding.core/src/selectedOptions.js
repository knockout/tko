
import {
    arrayForEach, setOptionNodeSelectionState, arrayIndexOf,
    registerEventHandler, tagNameLower
} from 'tko.utils';

import {
    unwrap
} from 'tko.observable';

import {
    selectExtensions
} from './selectExtensions';


export var selectedOptions = {
    after: ['options', 'foreach'],

    init: function (element, valueAccessor, allBindings) {
        registerEventHandler(element, "change", function () {
            var value = valueAccessor(), valueToWrite = [];
            arrayForEach(element.getElementsByTagName("option"), function(node) {
                if (node.selected)
                    valueToWrite.push(selectExtensions.readValue(node));
            });
            valueAccessor(valueToWrite);
        });
    },

    update: function (element, valueAccessor) {
        if (tagNameLower(element) != "select")
            throw new Error("values binding applies only to SELECT elements");

        var newValue = unwrap(valueAccessor()),
            previousScrollTop = element.scrollTop;

        if (newValue && typeof newValue.length == "number") {
            arrayForEach(element.getElementsByTagName("option"), function(node) {
                var isSelected = arrayIndexOf(newValue, selectExtensions.readValue(node)) >= 0;
                if (node.selected != isSelected) {      // This check prevents flashing of the select element in IE
                    setOptionNodeSelectionState(node, isSelected);
                }
            });
        }

        element.scrollTop = previousScrollTop;
    }
};
