
// See knockout/src/binding/bindingProvider.js

function secureBindingsProvider(options) {
    var existingProvider = new ko.bindingProvider();
    options = options || {};

    // override the attribute
    this.attribute = options.attribute || "data-sbind";

    // do we bind to the ko: virtual elements
    this.noVirtualElements = options.noVirtualElements || false;

    // set globals
    this.globals = options.globals || {};

    // the binding classes -- defaults to ko bindingsHandlers
    this.bindings = options.bindings || ko.bindingHandlers;
}

function registerBindings(newBindings) {
    ko.utils.extend(this.bindings, newBindings);
}

function nodeHasBindings(node) {
    var value;
    if (node.nodeType === node.ELEMENT_NODE) {
        return node.getAttribute(this.attribute)
            || ko.components.getComponentNameForNode(node);
    } else if (node.nodeType === node.COMMENT_NODE) {
        if (this.noVirtualElements) {
            return false;
        }
        value = ("" + node.nodeValue || node.text).trim();
        // See also: knockout/src/virtualElements.js
        return value.indexOf("ko ") === 0;
    }
}

// Return the name/valueAccessor pairs.
// (undocumented replacement for getBindings)
// see https://github.com/knockout/knockout/pull/742
function getBindingAccessors(node, context) {
    var bindings = {},
    sbind_string;

    if (node.nodeType === node.ELEMENT_NODE) {
        sbind_string = node.getAttribute(this.attribute);
    } else if (node.nodeType === node.COMMENT_NODE) {
        sbind_string = node.nodeValue.replace("ko ", "");
    }

    if (sbind_string) {
        bindings = new Parser(node, context,this.globals)
                             .parse(sbind_string);
    }

    // emulate ko.components.addBindingsForCustomElement(bindings, node,
    //     context, true);
    if (node.nodeType === node.ELEMENT_NODE) {
        // see https://github.com/knockout/knockout/blob/master/src/components/customElements.js
    }

    return bindings;

}

ko.utils.extend(secureBindingsProvider.prototype, {
    registerBindings: registerBindings,
    nodeHasBindings: nodeHasBindings,
    getBindingAccessors: getBindingAccessors,
    Parser: Parser
});
