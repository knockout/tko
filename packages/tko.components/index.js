//
// Export the Components
//
// ko.bindingHandlers.component
//

import { componentBinding } from './src/componentBinding';
import { registry } from './src/loaderRegistry';
import * as elements from './src/customElements';
import * as loader from './src/defaultLoader';


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

    // -- Binding handler --
    bindingHandler: componentBinding,

    // -- Extend the Binding Provider --
    // to recognize and bind <custom-element>'s.
    bindingProvider: elements.bindingProvider
};


// This is to ensure that "component.loaders = [a,b,c]" works as expected.
Object.defineProperty(components, 'loaders', {
    enumerable: true,
    get: function () { return registry.loaders; },
    set: function (loaders) { registry.loaders = loaders; }
});


export default components;
