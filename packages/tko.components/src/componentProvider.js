//
// Binding Provider that accounts for custom components
//



import { addBindingsForCustomElement } from './customElements';


// getBindingAccessors
// ---
// Return the binding accessors for custom elements i.e.
// `<cust-ele params='...'>` becomes
// `<cust-ele data-bind='component: {name: "cust-ele", params: ...}'>`
//
export function getBindingAccessors(node, context, parser, bindings) {
    return addBindingsForCustomElement(bindings, node, context, /* valueAccessors */ true, parser);
}
