/**
 * A class to create the global knockout instance (ko).
 */

import {
  addDisposeCallback,
  addOrRemoveItem,
  arrayFilter,
  arrayFirst,
  arrayForEach,
  arrayGetDistinctValues,
  arrayIndexOf,
  arrayMap,
  arrayPushAll,
  arrayRemoveItem,
  addCleaner,
  cleanNode,
  cloneNodes,
  compareArrays,
  createSymbolOrString,
  domData,
  extend,
  memoization,
  objectForEach,
  objectMap,
  options,
  parseHtmlFragment,
  parseJson,
  range,
  registerEventHandler,
  removeCleaner,
  removeDisposeCallback,
  removeNode,
  selectExtensions,
  setHtml,
  setTextContent,
  tasks,
  toggleDomNodeCssClass,
  triggerEvent,
  virtualElements
} from 'tko.utils'

import {
  parseObjectLiteral
} from 'tko.utils.parser'

import {
  LifeCycle
} from 'tko.LifeCycle'

import {
    // applyExtenders,
    // arrayChangeEventName,
    // deferUpdates,
    dependencyDetection,
    extenders as defaultExtenders,
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
    proxy,
    pureComputed,
    when
} from 'tko.computed'

import {
    applyBindingAccessorsToNode,
    applyBindings,
    applyBindingsToDescendants,
    applyBindingsToNode,
    contextFor,
    dataFor,
    bindingEvent,
    BindingHandler,
    AsyncBindingHandler,
    setDomNodeChildrenFromArrayMapping
} from 'tko.bind'

import {
    anonymousTemplate,
    domElement,
    nativeTemplateEngine,
    renderTemplate,
    setTemplateEngine,
    templateEngine
    // templateSources
} from 'tko.binding.template'

const domNodeDisposal = {
  addDisposeCallback,
  removeDisposeCallback,
  removeNode,
  addCleaner,
  removeCleaner,
  get cleanExternalData () {
    return options.cleanExternalData
  },
  set cleanExternalData (cleanerFn) {
    options.set('cleanExternalData', cleanerFn)
  }
}

const utils = Object.assign({
  addOrRemoveItem,
  arrayFilter,
  arrayFirst,
  arrayForEach,
  arrayGetDistinctValues,
  arrayIndexOf,
  arrayMap,
  arrayPushAll,
  arrayRemoveItem,
  cloneNodes,
  compareArrays,
  createSymbolOrString,
  domData,
  domNodeDisposal,
  extend,
  filters: options.filters,
  objectForEach,
  objectMap,
  parseHtmlFragment,
  parseJson,
  parseObjectLiteral,
  peekObservable: peek,
  range,
  registerEventHandler,
  setDomNodeChildrenFromArrayMapping,
  setHtml,
  setTextContent,
  toggleDomNodeCssClass,
  triggerEvent,
  unwrapObservable: unwrap
})

const knockout = {
  // --- Utilities ---
  cleanNode,
  dependencyDetection,
  computedContext: dependencyDetection,
  filters: options.filters,
  ignoreDependencies: dependencyDetection.ignore,
  memoization,
  options,
  removeNode,
  selectExtensions,
  tasks,
  utils,
  LifeCycle,

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
  proxy,

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
  contextFor,
  dataFor,
  BindingHandler,
  AsyncBindingHandler,
  virtualElements,
  domNodeDisposal,
  bindingEvent,
}

export class Builder {
  constructor ({ provider, bindings, extenders, filters, options }) {
    Object.assign(knockout.options, options, {
      filters,
      bindingProviderInstance: provider
    })

    provider.setGlobals(knockout.options.bindingGlobals)

    if (Array.isArray(bindings)) {
      for (const bindingsObject of bindings) {
        provider.bindingHandlers.set(bindingsObject)
      }
    } else {
      provider.bindingHandlers.set(bindings)
    }

    this.providedProperties = {
      extenders: Object.assign(defaultExtenders, extenders),
      bindingHandlers: provider.bindingHandlers,
      bindingProvider: provider
    }
  }

  /**
   * @return {Object} An instance of Knockout.
   */
  create (...additionalProperties) {
    const instance = Object.assign({
      get getBindingHandler () { return options.getBindingHandler },
      set getBindingHandler (fn) { options.set('getBindingHandler', fn) }
    },
    knockout,
    this.providedProperties,
    ...additionalProperties)
    instance.options.knockoutInstance = instance
    return instance
  }
}
