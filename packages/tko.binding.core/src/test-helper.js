
import {
    arrayFilter, arrayMap
} from 'tko.utils';

import {
    selectExtensions
} from './selectExtensions';

export var matchers = {
    toHaveSelectedValues: function (expectedValues) {
        var selectedNodes = arrayFilter(this.actual.childNodes, function (node) { return node.selected; }),
            selectedValues = arrayMap(selectedNodes, function (node) { return selectExtensions.readValue(node); });
        this.actual = selectedValues;   // Fix explanatory message
        return this.env.equals_(selectedValues, expectedValues);
    }
};
