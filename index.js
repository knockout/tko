
import * as utils from 'tko.utils'

import {
    applyExtenders,
    arrayChangeEventName,
    deferUpdates,
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
    trackArrayChanges,
    unwrap,
} from 'tko.observable'

import {
    computed,
    isComputed,
    isPureComputed,
    pureComputed,
} from 'tko.computed'

import {
    Provider
} from 'tko.provider';

import {
    applyBindingAccessorsToNode,
    applyBindings,
    applyBindingsToDescendants,
    applyBindingsToNode,
    dataFor,
    getBindingHandler,
    setDomNodeChildrenFromArrayMapping,
    textFor,
} from 'tko.bind';

import {
    bindings as coreBindings
} from 'tko.binding.core';

import {
    bindings as templateBindings,
    nativeTemplateEngine,
    setTemplateEngine,
    templateEngine,
    templateSources,
} from 'tko.binding.template';


// --- TODO ---
// Component
// Other extenders
// Other bindings

var coreUtils = {}

arrayForEach([
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
    "domNodeDisposal",
    "parseHtmlFragment",
    "setHtml",
    "compareArrays",
    "setDomNodeChildrenFromArrayMapping",
], function (coreUtil) {
    coreUtils[coreUtil] = utils[coreUtil]
})


export default ko = {
    // --- Top-level ---
    version: '4.0.0-alpha0',
    options: utils.options,


    // --- Utilities ---
    cleanNode: utils.cleanNode,
    memoization: utils.memoization,
    removeNode: utils.removeNode,
    tasks: utils.tasks,
    utils: coreUtils,


    // -- Observable ---
    isObservable: isObservable,
    isWriteableObservable: isWriteableObservable,
    isWritableObservable: isWritableObservable,
    observable: observable,
    observableArray: observableArray,
    peek: peek,
    subscribable: subscribable,
    unwrap: unwrap,
    toJS: utils.toJS,
    toJSON: utils.toJSON,

    // ... Computed ...
    computed: computed,
    isComputed: isComputed,
    isPureComputed: isPureComputed,
    pureComputed: pureComputed,

    // Extenders
    extenders: extenders,


    // --- Templates ---
    nativeTemplateEngine: nativeTemplateEngine,
    renderTemplate: renderTemplate,
    setTemplateEngine: setTemplateEngine,
    templateEngine: templateEngine,
    templateSources: templateSources,


    // --- Binding ---
    applyBindingAccessorsToNode: applyBindingAccessorsToNode,
    applyBindings: applyBindings,
    applyBindingsToDescendants: applyBindingsToDescendants,
    applyBindingsToNode: applyBindingsToNode,
    bindingProvider: Provider,
    contextFor: contextFor,
    dataFor: dataFor,
    getBindingHandler: getBindingHandler,
    virtualElements: utils.virtualElements,
}


// Configure the default setup.
var provider = new Provider();
options.bindingProviderInstance = provider;
provider.bindingHandlers.set(coreBindings);
provider.bindingHandlers.set(templateBindings);
