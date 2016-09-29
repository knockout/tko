import {
    setHtml, parseHtmlFragment, virtualElements
} from 'tko.utils';

import {
    unwrap
} from 'tko.observable';

export var html = {
    init: function() {
        // Prevent binding on the dynamically-injected HTML (as developers are unlikely to expect that, and it has security implications)
        return {
            'controlsDescendantBindings': true
        };
    },
    //
    // Modify internal, per ko.punches and :
    //      http://stackoverflow.com/a/15348139
    update: function(element, valueAccessor) {
        if (element.nodeType === 8) {
            var html = unwrap(valueAccessor());
            if (html !== null) {
                var parsedNodes = parseHtmlFragment('' + html);
                virtualElements.setDomNodeChildren(element, parsedNodes);
            } else {
                virtualElements.emptyNode(element);
            }
        }

        // setHtml will unwrap the value if needed
        setHtml(element, valueAccessor());
    },
    allowVirtualElements: true
};
