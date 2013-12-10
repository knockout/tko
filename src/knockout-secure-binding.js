;(function(factory) {
    //AMD
    if (typeof define === "function" && define.amd) {
        define(["knockout", "exports"], factory);
        //normal script tag
    } else {
        factory(ko);
    }
}(function(ko, exports, undefined) {
    var parser = require('./parser')
        globals = {};


    function secureBindingsProvider(options) {
        var existingProvider = new ko.bindingProvider();
        options = options || {};

        // override the attribute
        this.attribute = options.attribute || "data-sbind";

        // set globals
        globals = options.globals || {};

        // override the virtual attribute
        this.virtualAttribute = options.virtualAttribute || "ksb ";

        // the binding classes -- defaults to ko bindingsHandlers
        this.bindings = options.bindings || ko.bindingHandlers;
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

        return result;
    }


    // Return the name/valueAccessor pairs.
    // (undocumented replacement for getBindings)
    // see https://github.com/knockout/knockout/pull/742
    function getBindingAccessors(node, context) {
        var bindings = {},
        sbind_string;

        if (node.nodeType === node.ELEMENT_NODE) {
            sbind_string = node.getAttribute(this.attribute);
        }

        if (sbind_string) {
            bindings = parser.parse(sbind_string, node, context);
        }

        return bindings;
    }

    ko.utils.extend(secureBindingsProvider.prototype, {
        registerBindings: registerBindings,
        nodeHasBindings: nodeHasBindings,
        getBindingAccessors: getBindingAccessors,
        parse: parser.parse,
        make_accessor: parser.make_accessor,
    })

    if (!exports) {
        ko.secureBindingsProvider = secureBindingsProvider;
    }

    return secureBindingsProvider;
}));
