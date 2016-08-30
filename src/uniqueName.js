
import {
    setElementName
} from 'tko.utils';

export var uniqueName = {
    init: function (element, valueAccessor) {
        if (valueAccessor()) {
            var name = "ko_unique_" + (++uniqueName.currentIndex);
            setElementName(element, name);
        }
    },
    currentIndex: 0
};
