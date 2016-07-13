
import {
    setHtml
} from 'tko.utils';

export var html = {
    init: function() {
        // Prevent binding on the dynamically-injected HTML (as developers are unlikely to expect that, and it has security implications)
        return { 'controlsDescendantBindings': true };
    },
    update: function (element, valueAccessor) {
        // setHtml will unwrap the value if needed
        setHtml(element, valueAccessor());
    }
};
