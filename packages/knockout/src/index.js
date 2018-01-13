/* eslint semi: 0 */
import * as utils from 'tko.utils'

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
    isObservableArray,
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
    pureComputed,
    when
} from 'tko.computed'

import { VirtualProvider } from 'tko.provider.virtual'
import { DataBindProvider } from 'tko.provider.databind'
import { ComponentProvider } from 'tko.provider.component'
import { AttributeProvider } from 'tko.provider.attr'
import { MultiProvider } from 'tko.provider.multi'
import {
  TextMustacheProvider, AttributeMustacheProvider
} from 'tko.provider.mustache'

import {
    applyBindingAccessorsToNode,
    applyBindings,
    applyBindingsToDescendants,
    applyBindingsToNode,
    contextFor,
    dataFor,
    getBindingHandler,
    BindingHandler,
    AsyncBindingHandler,
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
  filters as punchesFilters
} from 'tko.filter.punches';

import {
  bindings as componentBindings
} from 'tko.binding.component'

import components from 'tko.utils.component'

var coreUtils = {}

utils.arrayForEach([
  'extend',
  'setTimeout',
  'arrayForEach',
  'arrayFirst',
  'arrayFilter',
  'arrayGetDistinctValues',
  'arrayIndexOf',
  'arrayMap',
  'arrayPushAll',
  'arrayRemoveItem',
  'cloneNodes',
  'getFormFields',
  'peekObservable',
  'postJson',
  'parseJson',
  'registerEventHandler',
  'stringifyJson',
  'range',
  'toggleDomNodeCssClass',
  'triggerEvent',
  'unwrapObservable',
  'objectMap',
  'objectForEach',
  'addOrRemoveItem',
  'setTextContent',
  'domData',
  'parseHtmlFragment',
  'setHtml',
  'compareArrays',
  'createSymbolOrString',
  'setDomNodeChildrenFromArrayMapping'
], function (coreUtil) {
  coreUtils[coreUtil] = utils[coreUtil]
})

coreUtils.domNodeDisposal = {
  addDisposeCallback: utils.addDisposeCallback,
  otherNodeCleanerFunctions: utils.otherNodeCleanerFunctions,
  removeDisposeCallback: utils.removeDisposeCallback,
  removeNode: utils.removeNode
}

utils.extend(coreUtils, {
  setDomNodeChildrenFromArrayMapping: setDomNodeChildrenFromArrayMapping,
  unwrapObservable: unwrap,
  peekObservable: peek
})

// Create the binding provider and default bindings.
const provider = new MultiProvider({
  globals: utils.options.bindingGlobals,
  providers: [
    new AttributeMustacheProvider(),
    new TextMustacheProvider(),
    new ComponentProvider(),
    new DataBindProvider(),
    new VirtualProvider(),
    new AttributeProvider()
  ]
})

utils.options.bindingProviderInstance = provider

provider.bindingHandlers.set(coreBindings)
provider.bindingHandlers.set(templateBindings)
provider.bindingHandlers.set(ifBindings)
provider.bindingHandlers.set(foreachBindings)
provider.bindingHandlers.set({ each: foreachBindings.foreach })
provider.bindingHandlers.set(componentBindings)

Object.assign(utils.options.filters, punchesFilters);

// Expose the API.
export default {
    // --- Top-level ---
  version: '{{VERSION}}',
  options: utils.options,

  extenders: extenders,
  filters: utils.options.filters,
  Component: components.ComponentABC,

    // --- Utilities ---
  cleanNode: utils.cleanNode,
  memoization: utils.memoization,
  removeNode: utils.removeNode,
  tasks: utils.tasks,
  utils: coreUtils,
  dependencyDetection,
  ignoreDependencies: dependencyDetection.ignore,
  selectExtensions: utils.selectExtensions,

    // -- Observable ---
  isObservable,
  isSubscribable,
  isWriteableObservable,
  isWritableObservable: isWriteableObservable,
  observable,
  observableArray,
  isObservableArray,
  peek,
  subscribable,
  unwrap,
  toJS,
  toJSON,

    // ... Computed ...
  computed,
  dependentObservable: computed,
  isComputed,
  isPureComputed,
  pureComputed,
  when: when,

    // --- Templates ---
  nativeTemplateEngine,
  renderTemplate,
  setTemplateEngine,
  templateEngine,
  templateSources: { domElement, anonymousTemplate },

    // --- Binding ---
  applyBindingAccessorsToNode,
  applyBindings,
  applyBindingsToDescendants,
  applyBindingsToNode,
  bindingHandlers: provider.bindingHandlers,
  bindingProvider: provider,
  contextFor,
  dataFor,
  getBindingHandler,
  BindingHandler,
  AsyncBindingHandler,
  virtualElements: utils.virtualElements,
  domNodeDisposal: coreUtils.domNodeDisposal,

    // --- Components ---
  components
}
