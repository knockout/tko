//
// Binding Handler for Components
//
import {
    virtualElements, makeArray, cloneNodes, domNodeDisposal
} from 'tko.utils';
import computed from 'tko.computed';
import unwrap from 'tko.observable';
import applyBindingsToDescendants from 'tko.bind';

import components from './components';


var componentLoadingOperationUniqueId = 0;

// We are presuming here that the bindingHandler registration will
// be `component`; with the new-style binding handlers this can be
// an innate property (i.e. {..., allowVirtual: true}
virtualElements.allowedBindings.component = true;


function cloneTemplateIntoElement(componentName, componentDefinition, element) {
    var template = componentDefinition['template'];
    if (!template) {
        throw new Error('Component \'' + componentName + '\' has no template');
    }

    var clonedNodesArray = cloneNodes(template);
    virtualElements.setDomNodeChildren(element, clonedNodesArray);
}


function createViewModel(componentDefinition, element, originalChildNodes, componentParams) {
    var componentViewModelFactory = componentDefinition['createViewModel'];
    return componentViewModelFactory
        ? componentViewModelFactory.call(componentDefinition, componentParams, { 'element': element, 'templateNodes': originalChildNodes })
        : componentParams; // Template-only component
}


export default {
    init: function(element, valueAccessor, ignored1, ignored2, bindingContext) {
        var currentViewModel,
            currentLoadingOperationId,
            disposeAssociatedComponentViewModel = function () {
                var currentViewModelDispose = currentViewModel && currentViewModel['dispose'];
                if (typeof currentViewModelDispose === 'function') {
                    currentViewModelDispose.call(currentViewModel);
                }
                currentViewModel = null;
                // Any in-flight loading operation is no longer relevant, so make sure we ignore its completion
                currentLoadingOperationId = null;
            },
            originalChildNodes = makeArray(virtualElements.childNodes(element));

        domNodeDisposal.addDisposeCallback(element, disposeAssociatedComponentViewModel);

        computed(function () {
            var value = unwrap(valueAccessor()),
                componentName, componentParams;

            if (typeof value === 'string') {
                componentName = value;
            } else {
                componentName = unwrap(value['name']);
                componentParams = unwrap(value['params']);
            }

            if (!componentName) {
                throw new Error('No component name specified');
            }

            var loadingOperationId = currentLoadingOperationId = ++componentLoadingOperationUniqueId;
            components.get(componentName, function(componentDefinition) {
                // If this is not the current load operation for this element, ignore it.
                if (currentLoadingOperationId !== loadingOperationId) {
                    return;
                }

                // Clean up previous state
                disposeAssociatedComponentViewModel();

                // Instantiate and bind new component. Implicitly this cleans any old DOM nodes.
                if (!componentDefinition) {
                    throw new Error('Unknown component \'' + componentName + '\'');
                }
                cloneTemplateIntoElement(componentName, componentDefinition, element);
                var componentViewModel = createViewModel(componentDefinition, element, originalChildNodes, componentParams),
                    childBindingContext = bindingContext['createChildContext'](componentViewModel, /* dataItemAlias */ void 0, function(ctx) {
                        ctx['$component'] = componentViewModel;
                        ctx['$componentTemplateNodes'] = originalChildNodes;
                    });
                currentViewModel = componentViewModel;
                applyBindingsToDescendants(childBindingContext, element);
            });
        }, null, { disposeWhenNodeIsRemoved: element });

        return { 'controlsDescendantBindings': true };
    }
};
