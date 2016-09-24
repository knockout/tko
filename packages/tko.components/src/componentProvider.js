//
// Binding Provider that accounts for custom components
//



import {
    getComponentNameForNode, getComponentParamsFromCustomElement
} from './customElements';


// getBindingAccessors
// ---
// Return the binding accessors for custom elements i.e.
// `<cust-ele params='...'>` becomes
// `<cust-ele data-bind='component: {name: "cust-ele", params: ...}'>`
//
export function getBindingAccessors(node, _, parser) {
    if (node.nodeType !== node.ELEMENT_NODE) { return; }

    var component_name = getComponentNameForNode(node);
    if (!component_name) { return; }

    var componentBindingValue = {
        'name': component_name,
        'params': getComponentParamsFromCustomElement(node, parser)
    };

    return {
        component: function() { return componentBindingValue; }
    };
}
