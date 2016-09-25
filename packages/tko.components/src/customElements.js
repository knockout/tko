
import { tagNameLower, objectMap } from 'tko.utils';
import { unwrap, isWriteableObservable } from 'tko.observable';
import { computed } from 'tko.computed';

import { isRegistered } from './defaultLoader';


// Overridable API for determining which component name applies to a given node. By overriding this,
// you can for example map specific tagNames to components that are not preregistered.
export function getComponentNameForNode(node) {
    if (node.nodeType !== node.ELEMENT_NODE) { return; }
    var _tagNameLower = tagNameLower(node);
    if (isRegistered(_tagNameLower)) {
        // Try to determine that this node can be considered a *custom* element; see https://github.com/knockout/knockout/issues/1603
        if (_tagNameLower.indexOf('-') != -1 || ('' + node) == "[object HTMLUnknownElement]") {
            return _tagNameLower;
        }
    }
}


// getBindingAccessors
// ---
// Return the binding accessors for custom elements i.e.
// `<cust-ele params='...'>` becomes
// `<cust-ele data-bind='component: {name: "cust-ele", params: ...}'>`
//
export function getBindingAccessors(node, context, parser, bindings) {
    return addBindingsForCustomElement(bindings, node, context, /* valueAccessors */ true, parser);
}


export function addBindingsForCustomElement(allBindings, node, bindingContext, valueAccessors, parser) {
    // Determine if it's really a custom element matching a component
    if (node.nodeType === 1) {
        var componentName = bindingProvider.getComponentNameForNode(node);
        if (componentName) {
            // It does represent a component, so add a component binding for it
            allBindings = allBindings || {};

            if (allBindings.component) {
                // Avoid silently overwriting some other 'component' binding that may already be on the element
                throw new Error('Cannot use the "component" binding on a custom element matching a component');
            }

            var componentBindingValue = {
                'name': componentName,
                'params': getComponentParamsFromCustomElement(node, bindingContext, parser)
            };

            allBindings.component = valueAccessors
                ? function() { return componentBindingValue; }
                : componentBindingValue;
        }
    }

    return allBindings;
}


export function getComponentParamsFromCustomElement(node, context, parser) {
    var accessors = parser.parse(node.getAttribute('params'));
    if (!accessors || Object.keys(accessors).length === 0) {
        return {
            $raw: {}
        };
    }

    var rawParamComputedValues = objectMap(accessors,
        function(paramValue /*, paramName */ ) {
            return computed(paramValue, null, {
                disposeWhenNodeIsRemoved: node
            });
        }
    );

    var params = objectMap(rawParamComputedValues,
        function(paramValueComputed /*, paramName */ ) {
            var paramValue = paramValueComputed.peek();
            // Does the evaluation of the parameter value unwrap any observables?
            if (!paramValueComputed.isActive()) {
                // No it doesn't, so there's no need for any computed wrapper. Just pass through the supplied value directly.
                // Example: "someVal: firstName, age: 123" (whether or not firstName is an observable/computed)
                return paramValue;
            } else {
                // Yes it does. Supply a computed property that unwraps both the outer (binding expression)
                // level of observability, and any inner (resulting model value) level of observability.
                // This means the component doesn't have to worry about multiple unwrapping. If the value is a
                // writable observable, the computed will also be writable and pass the value on to the observable.
                return computed({
                    read: function() {
                        return unwrap(paramValueComputed());
                    },
                    write: isWriteableObservable(paramValue) && function(value) {
                        paramValueComputed()(value);
                    },
                    disposeWhenNodeIsRemoved: node
                });
            }
        }
    );
    // For consistency, absence of a "params" attribute is treated the same as the presence of
    // any empty one. Otherwise component viewmodels need special code to check whether or not
    // 'params' or 'params.$raw' is null/undefined before reading subproperties, which is annoying.

    if (!params.hasOwnProperty('$raw')) {
        params.$raw = rawParamComputedValues;
    }
    return params;
}


export var bindingProvider = {
    nodeHasBindings: function (node) {
        return bindingProvider.getComponentNameForNode(node);
    },
    getBindingAccessors: getBindingAccessors,
    getComponentNameForNode: getComponentNameForNode
};
