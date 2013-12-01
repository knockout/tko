;(function(factory) {
    //AMD
    if (typeof define === "function" && define.amd) {
        define(["knockout", "exports"], factory);
        //normal script tag
    } else {
        factory(ko);
    }
}(function(ko, exports, undefined) {
    function secureBindingsProvider(bindings, options) {
        var existingProvider = new ko.bindingProvider();
        options = options || {};

        // override the attribute
        this.attribute = options.attribute || "data-sbind";

        // override the virtual attribute
        this.virtualAttribute = options.virtualAttribute || "ksb ";

        // fallback to the existing binding provider
        // if bindings are not found
        this.fallback = options.fallback;

        // the binding classes
        this.bindings = bindings || {};
    }

    function registerBindings(newBindings) {
        ko.utils.extend(this.bindings, newBindings);
    }

    function nodeHasBindings(node) {
        var result, value;

        if (node.nodeType === node.ELEMENT_NODE) {
            result = node.getAttribute(this.attribute);
        } else if (node.nodeType === node.COMMENT_NODE) {
            value = "" + node.nodeValue || node.text;
            result = value.indexOf(this.virtualAttribute) > -1;
        }

        if (!result && this.fallback) {
            result = existingProvider.nodeHasBindings(node);
        }

        return result;
    }

    function getBindings(node, context) {

    }

    ko.utils.extend(secureBindingsProvider.prototype, {
        registerBindings: registerBindings,
        nodeHasBindings: nodeHasBindings,
        getBindings: getBindings
    })

    if (!exports) {
        ko.secureBindingsProvider = secureBindingsProvider;
    }

    return secureBindingsProvider;
}));
