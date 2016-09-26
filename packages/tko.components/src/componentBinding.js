//
// Binding Handler for Components
//
import {
    virtualElements, makeArray, cloneNodes, options, extend
} from 'tko.utils';

// import {
//     computed
// } from 'tko.computed';

import {
    unwrap, observable
} from 'tko.observable';

import {
    applyBindingsToDescendants
} from 'tko.bind';

import {
    registry
} from './loaderRegistry';


var componentLoadingOperationUniqueId = 0;


function cloneTemplateIntoElement(componentName, componentDefinition, element) {
    var template = componentDefinition['template'];
    if (!template) {
        throw new Error('Component \'' + componentName + '\' has no template');
    }

    var clonedNodesArray = cloneNodes(template);
    virtualElements.setDomNodeChildren(element, clonedNodesArray);
}


function createViewModel(componentDefinition, element, originalChildNodes, componentParams) {
    var componentViewModelFactory = componentDefinition.createViewModel;
    return componentViewModelFactory
        ? componentViewModelFactory.call(componentDefinition, componentParams, { 'element': element, 'templateNodes': originalChildNodes })
        : componentParams; // Template-only component
}


export function componentBinding(params) {
    this.element = params.element;
    this.bindingContext = params.$context;
    this.currentViewModel;

    this.originalChildNodes = makeArray(virtualElements.childNodes(this.element));

    // The componentDefinition comes (asynchronously) from the component
    // registry.
    this.componentDefinition = observable();

    // When the args are updated, we update (async) the registry.
    this.componentArgs = this.computed(this.getComponentArgs);

    // Prime the first definition.
    this.getComponentDefinition(this.componentArgs());

    // Rebuild definition on changes to the params/name.
    this.subscribe(this.componentArgs, this.getComponentDefinition.bind(this));

    // We defer this so that when the bindingContext is updated, the rebuild
    // will still be async. (So multiple binding context updates will be
    // merged into one, but also successive updates will have consistently
    // async behaviour)
    this.childBindingContext = this.computed(this.makeChildBindingContext);

    this.subscribe(this.childBindingContext, this.rebuildComponent.bind(this));

    if (this.childBindingContext()) {
        // The binding context will only be created at this point if the
        // component has synchronous: true, meaning we want to build it
        // immediately.
        this.rebuildComponent(this.childBindingContext());
    } else {
        // If it's an asynchronous component, for consistency we want
        // updates to the binding context to be reflected asynchronously too.
        this.childBindingContext.extend({ deferred: true });
    }
}


extend(componentBinding.prototype, {
    allowVirtualElements: true,
    controlsDescendantBindings: true,

    getComponentArgs: function () {
        var value = this.value(),
            componentName, componentParams;
        if (typeof value === 'string') {
            componentName = value;
        } else {
            componentName = unwrap(value.name);
            componentParams = unwrap(value.params);
        }

        if (!componentName) {
            options.onError(new Error('No component name specified'));
            return null;
        }

        return { name: componentName, params: componentParams };
    },

    // Asynchronously acquire the definition for the given component.
    getComponentDefinition: function (componentArgs) {
        if (!componentArgs) { return; }
        registry.get(componentArgs.name, this.componentDefinition);
    },

    makeChildBindingContext: function () {
        var componentArgs = this.componentArgs(),
            componentDefinition = this.componentDefinition();

        if (!componentArgs || componentDefinition === undefined) { return; }

        if (componentDefinition === null) {
            options.onError(
                new Error('Unknown component \'' + componentArgs.name + '\'')
            );
        }

        var componentName = componentArgs.name,
            componentParams = componentArgs.params,
            originalChildNodes = this.originalChildNodes;

        // Clean up previous state
        this.disposeAssociatedComponentViewModel();

        // Instantiate and bind new component. Implicitly this cleans any old DOM nodes.
        if (!componentDefinition) {
            throw new Error('Unknown component \'' + componentName + '\'');
        }
        cloneTemplateIntoElement(componentName, componentDefinition, this.element);

        var componentViewModel = createViewModel(componentDefinition, this.element, this.originalChildNodes, componentParams),
            childBindingContext = this.bindingContext.createChildContext(componentViewModel, /* dataItemAlias */ void 0, function(ctx) {
                ctx.$component = componentViewModel;
                ctx.$componentTemplateNodes = originalChildNodes;
            });
        this.currentViewModel = componentViewModel;
        return childBindingContext;
    },

    rebuildComponent: function (childBindingContext) {
        applyBindingsToDescendants(childBindingContext, this.element);
    },

    dispose: function () {
        this.disposeAssociatedComponentViewModel();
    },

    disposeAssociatedComponentViewModel: function() {
        var currentViewModelDispose = this.currentViewModel && this.currentViewModel.dispose;
        if (typeof currentViewModelDispose === 'function') {
            currentViewModelDispose.call(this.currentViewModel);
        }
        this.currentViewModel = null;
        // Any in-flight loading operation is no longer relevant, so make sure we ignore its completion
        this.currentLoadingOperationId = null;
    }
});



// var currentViewModel,
//     currentLoadingOperationId,
//     originalChildNodes = makeArray(virtualElements.childNodes(element));
//
// addDisposeCallback(element, disposeAssociatedComponentViewModel);
//
// function rebuild(componentName, componentParams, componentDefinition) {
//     if (!componentDefinition) { return; }
//     // if (lastComponentDefinition === componentDefinition) { return; }
//     // lastComponentDefinition = componentDefinition;
//
//     // var loadingOperationId = currentLoadingOperationId = ++componentLoadingOperationUniqueId;
//
//     // Clean up previous state
//     disposeAssociatedComponentViewModel();
//
//     // Instantiate and bind new component. Implicitly this cleans any old DOM nodes.
//     if (!componentDefinition) {
//         throw new Error('Unknown component \'' + componentName + '\'');
//     }
//     cloneTemplateIntoElement(componentName, componentDefinition, element);
//     var componentViewModel = createViewModel(componentDefinition, element, originalChildNodes, componentParams),
//         childBindingContext = bindingContext['createChildContext'](componentViewModel, /* dataItemAlias */ void 0, function(ctx) {
//             ctx['$component'] = componentViewModel;
//             ctx['$componentTemplateNodes'] = originalChildNodes;
//         });
//     currentViewModel = componentViewModel;
//     applyBindingsToDescendants(childBindingContext, element);
// }
//
//
// computed(function () {
//     var value = unwrap(valueAccessor()),
//         componentName, componentParams;
//
//     if (typeof value === 'string') {
//         componentName = value;
//     } else {
//         componentName = unwrap(value['name']);
//         componentParams = unwrap(value['params']);
//     }
//
//     if (!componentName) {
//         options.onError('No component name specified');
//     }
//
//     // Registry.get is async.
//     registry.get(componentName, currentComponentDefinition);
//
//     rebuild(componentName, componentParams, currentComponentDefinition());
    //  function(componentDefinition) {
    //     // If this is not the current load operation for this element, ignore it.
    //     if (currentLoadingOperationId !== loadingOperationId) {
    //         return;
    //     }
    //
    // });
// }, null, { disposeWhenNodeIsRemoved: element });
