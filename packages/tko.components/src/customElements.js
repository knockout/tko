
import { tagNameLower, objectMap } from 'tko.utils';
import { bindingProvider } from 'tko.bind';
import { unwrap, isWriteableObservable } from 'tko.observable';
import computed from 'tko.computed';

import isRegistered from './defaultLoader';


// Overridable API for determining which component name applies to a given node. By overriding this,
// you can for example map specific tagNames to components that are not preregistered.
export function getComponentNameForNode(node) {
    var _tagNameLower = tagNameLower(node);
    if (isRegistered(_tagNameLower)) {
        // Try to determine that this node can be considered a *custom* element; see https://github.com/knockout/knockout/issues/1603
        if (_tagNameLower.indexOf('-') != -1 || ('' + node) == "[object HTMLUnknownElement]") {
            return _tagNameLower;
        }
    }
}

export function addBindingsForCustomElement(allBindings, node, bindingContext, valueAccessors) {
    // Determine if it's really a custom element matching a component
    if (node.nodeType === 1) {
        var componentName = getComponentNameForNode(node);
        if (componentName) {
            // It does represent a component, so add a component binding for it
            allBindings = allBindings || {};

            if (allBindings.component) {
                // Avoid silently overwriting some other 'component' binding that may already be on the element
                throw new Error('Cannot use the "component" binding on a custom element matching a component');
            }

            var componentBindingValue = { 'name': componentName, 'params': getComponentParamsFromCustomElement(node, bindingContext) };

            allBindings.component = valueAccessors
                ? function() { return componentBindingValue; }
                : componentBindingValue;
        }
    }

    return allBindings;
}

// Extend the default binding provider

bindingProvider.prototype.nodeHasBindings = function(node) {
    switch (node.nodeType) {
    case 1: // Element
    return node.getAttribute(defaultBindingAttributeName) != null
            || ko.components.getComponentNameForNode(node);
    case 8: // Comment node
        return virtualElements.hasBindingValue(node);
    default: return false;
}

var nativeGetBindings = bindingProvider.prototype.getBindings
bindingProvider.prototype.getBindings = function getBindings(node, bindingContext) {
    return addBindingsForCustomElement(
        nativeGetBindings(node, bindingContext),
        node, bindingContext, /* valueAccessors */ false);
}

var nativeGetBindingAccessors = bindingProvider.prototype.nativeGetBindingAccessors;
bindingProvider.prototype.getBindingAccessors = function getBindingAccessors(node, bindingContext) {
    return addBindingsForCustomElement(
        nativeGetBindingAccessors(node, bindingContext),
        node, bindingContext, /* valueAccessors */ true);
}



var nativeBindingProviderInstance = new bindingProvider();

function getComponentParamsFromCustomElement(elem, bindingContext) {
    var paramsAttribute = elem.getAttribute('params');

    if (paramsAttribute) {
        var params = nativeBindingProviderInstance.parseBindingsString(paramsAttribute, bindingContext, elem, { 'valueAccessors': true, 'bindingParams': true }),
            rawParamComputedValues = objectMap(params, function(paramValue /*, paramName */) {
                return computed(paramValue, null, { disposeWhenNodeIsRemoved: elem });
            }),
            result = objectMap(rawParamComputedValues, function(paramValueComputed /*, paramName */) {
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
                        'read': function() {
                            return unwrap(paramValueComputed());
                        },
                        'write': isWriteableObservable(paramValue) && function(value) {
                            paramValueComputed()(value);
                        },
                        disposeWhenNodeIsRemoved: elem
                    });
                }
            });

        // Give access to the raw computeds, as long as that wouldn't overwrite any custom param also called '$raw'
        // This is in case the developer wants to react to outer (binding) observability separately from inner
        // (model value) observability, or in case the model value observable has subobservables.
        if (!result.hasOwnProperty('$raw')) {
            result['$raw'] = rawParamComputedValues;
        }

        return result;
    } else {
        // For consistency, absence of a "params" attribute is treated the same as the presence of
        // any empty one. Otherwise component viewmodels need special code to check whether or not
        // 'params' or 'params.$raw' is null/undefined before reading subproperties, which is annoying.
        return { '$raw': {} };
    }
}
