import {
    setTextContent
} from 'tko.utils';

export var text = {
    init: function() {
        // Prevent binding on the dynamically-injected text node (as developers are unlikely to expect that, and it has security implications).
        // It should also make things faster, as we no longer have to consider whether the text node might be bindable.
        return { controlsDescendantBindings: true };
    },
    update: function (element, valueAccessor) {
        setTextContent(element, valueAccessor());
    },
    allowVirtualElements: true
};
