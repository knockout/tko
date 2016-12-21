/* eslint semi: 0 */
import * as utils from 'tko.utils'
import { options } from 'tko.utils'

import {
    // applyExtenders,
    // arrayChangeEventName,
    // deferUpdates,
    dependencyDetection,
    extenders,
    isObservable,
    isSubscribable,
    isWriteableObservable,
    observable,
    observableArray,
    peek,
    subscribable,
    toJS,
    toJSON,
    unwrap
} from 'tko.observable'

import {
    computed,
    isComputed,
    isPureComputed,
    pureComputed
} from 'tko.computed'

import {
    Provider
} from 'tko.provider';

import {
    applyBindingAccessorsToNode,
    applyBindings,
    applyBindingsToDescendants,
    applyBindingsToNode,
    contextFor,
    dataFor,
    getBindingHandler,
    setDomNodeChildrenFromArrayMapping
} from 'tko.bind';

import {
    bindings as coreBindings
} from 'tko.binding.core';

import {
    anonymousTemplate,
    bindings as templateBindings,
    domElement,
    nativeTemplateEngine,
    renderTemplate,
    setTemplateEngine,
    templateEngine
    // templateSources
} from 'tko.binding.template';

import {
    bindings as ifBindings
} from 'tko.binding.if';

import {
    bindings as foreachBindings
} from 'tko.binding.foreach';

import {
    preprocessors as textInterpolation
} from 'tko.preprocessor.textInterpolation';

import {
    filters as punchesFilters
} from 'tko.filter.punches';

import components from 'tko.components'

// --- TODO ---
// Component
// Other extenders
// Other bindings

var coreUtils = {}

utils.arrayForEach([
    "extend",
    "setTimeout",
    "arrayForEach",
    "arrayFirst",
    "arrayFilter",
    "arrayGetDistinctValues",
    "arrayIndexOf",
    "arrayMap",
    "arrayPushAll",
    "arrayRemoveItem",
    "getFormFields",
    "peekObservable",
    "postJson",
    "parseJson",
    "registerEventHandler",
    "stringifyJson",
    "range",
    "toggleDomNodeCssClass",
    "triggerEvent",
    "unwrapObservable",
    "objectForEach",
    "addOrRemoveItem",
    "setTextContent",
    "domData",
    "parseHtmlFragment",
    "setHtml",
    "compareArrays",
    "setDomNodeChildrenFromArrayMapping"
], function (coreUtil) {
    coreUtils[coreUtil] = utils[coreUtil]
})

coreUtils.domNodeDisposal = {
    addDisposeCallback: utils.addDisposeCallback,
    otherNodeCleanerFunctions: utils.otherNodeCleanerFunctions,
    removeDisposeCallback: utils.removeDisposeCallback,
    removeNode: utils.removeNode,
}


utils.extend(coreUtils, {
    setDomNodeChildrenFromArrayMapping:  setDomNodeChildrenFromArrayMapping,
    unwrapObservable: unwrap,
    peekObservable: peek
})


// Create the binding provider and default bindings.
var provider = new Provider();
options.bindingProviderInstance = provider;
provider.bindingHandlers.set(coreBindings);
provider.bindingHandlers.set(templateBindings);
provider.bindingHandlers.set(ifBindings);
provider.bindingHandlers.set(foreachBindings);
provider.bindingHandlers.set({ each: foreachBindings.foreach });
provider.addNodePreprocessor(textInterpolation[0].nodePreProcessor);
provider.addNodePreprocessor(textInterpolation[1].nodePreProcessor);
provider.bindingHandlers.set({ component: components.bindingHandler });
provider.addProvider(components.bindingProvider);


utils.extend(options.filters, punchesFilters);


// Expose the API.
export default {
    // --- Top-level ---
    version: '4.0.0-alpha1',
    options: options,

    extenders: extenders,
    filters: options.filters,


    // --- Utilities ---
    cleanNode: utils.cleanNode,
    memoization: utils.memoization,
    removeNode: utils.removeNode,
    tasks: utils.tasks,
    utils: coreUtils,
    dependencyDetection: dependencyDetection,
    ignoreDependencies: dependencyDetection.ignore,


    // -- Observable ---
    isObservable: isObservable,
    isSubscribable: isSubscribable,
    isWriteableObservable: isWriteableObservable,
    isWritableObservable: isWriteableObservable,
    observable: observable,
    observableArray: observableArray,
    peek: peek,
    subscribable: subscribable,
    unwrap: unwrap,
    toJS: toJS,
    toJSON: toJSON,

    // ... Computed ...
    computed: computed,
    isComputed: isComputed,
    isPureComputed: isPureComputed,
    pureComputed: pureComputed,


    // --- Templates ---
    nativeTemplateEngine: nativeTemplateEngine,
    renderTemplate: renderTemplate,
    setTemplateEngine: setTemplateEngine,
    templateEngine: templateEngine,
    templateSources: {
        domElement: domElement,
        anonymousTemplate: anonymousTemplate
    },

    // --- Binding ---
    applyBindingAccessorsToNode: applyBindingAccessorsToNode,
    applyBindings: applyBindings,
    applyBindingsToDescendants: applyBindingsToDescendants,
    applyBindingsToNode: applyBindingsToNode,
    bindingHandlers: provider.bindingHandlers,
    bindingProvider: Provider,
    contextFor: contextFor,
    dataFor: dataFor,
    getBindingHandler: getBindingHandler,
    virtualElements: utils.virtualElements,
    domNodeDisposal: coreUtils.domNodeDisposal,

    // --- Components ---
    components: components
}
