//
// Export the Components
//
// ko.bindingHandlers.component
//

import { componentBinding } from './src/componentBinding';
import { registry } from './src/loaderRegistry';
import * as elements from './src/customElements';
import * as loader from './src/defaultLoader';
import { getBindingAccessors } from './src/componentProvider';


var components = {
    // -- Registry --
    get: registry.get,
    clearCachedDefinition: registry.clearCachedDefinition,

    // -- Loader --
    register: loader.register,
    isRegistered: loader.isRegistered,
    unregister: loader.unregister,
    defaultLoader: loader.defaultLoader,
    // "Privately" expose the underlying config registry for use in old-IE shim
    _allRegisteredComponents: loader.defaultConfigRegistry,

    // -- Custom elements --
    addBindingsForCustomElement: elements.addBindingsForCustomElement,
    getComponentNameForNode: elements.getComponentNameForNode,

    // -- Binding handler --
    bindingHandler: componentBinding,

    // -- Extend the Binding Provider --
    bindingProvider: {
        nodeHasBindings: elements.getComponentNameForNode,
        getBindingAccessors: getBindingAccessors
    }
};


// This is to ensure that "component.loaders = [a,b,c]" works as expected.
Object.defineProperty(components, 'loaders', {
    enumerable: true,
    get: function () { return registry.loaders; },
    set: function (loaders) { registry.loaders = loaders; }
});


export default components;
