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
  virtualElements,
  type KnockoutUtils,
  type ArrayAndObjectUtils
} from '@tko/utils'

import { parseObjectLiteral } from '@tko/utils.parser'

import { LifeCycle } from '@tko/lifecycle'

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
} from '@tko/observable'

import { computed, isComputed, isPureComputed, proxy, pureComputed, when } from '@tko/computed'

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
} from '@tko/bind'

import {
  anonymousTemplate,
  domElement,
  nativeTemplateEngine,
  renderTemplate,
  setTemplateEngine,
  templateEngine
  // templateSources
} from '@tko/binding.template'

import type { BindingHandlerObject } from '@tko/provider'

const domNodeDisposal = {
  addDisposeCallback,
  removeDisposeCallback,
  removeNode,
  addCleaner,
  removeCleaner,
  get cleanExternalData() {
    return options.cleanExternalData
  },
  set cleanExternalData(cleanerFn) {
    options.set('cleanExternalData', cleanerFn)
  }
}

export type Utils = ArrayAndObjectUtils & {
  cloneNodes: typeof cloneNodes
  compareArrays: typeof compareArrays
  createSymbolOrString: typeof createSymbolOrString
  domData: typeof domData
  domNodeDisposal: typeof domNodeDisposal
  filters: typeof options.filters
  parseHtmlFragment: typeof parseHtmlFragment
  parseJson: typeof parseJson
  parseObjectLiteral: typeof parseObjectLiteral
  peekObservable: typeof peek
  registerEventHandler: typeof registerEventHandler
  setDomNodeChildrenFromArrayMapping: typeof setDomNodeChildrenFromArrayMapping
  setHtml: typeof setHtml
  setTextContent: typeof setTextContent
  toggleDomNodeCssClass: typeof toggleDomNodeCssClass
  triggerEvent: typeof triggerEvent
  unwrapObservable: typeof unwrap
}

const utils: Utils = {
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
}

export type KnockoutInstance = KnockoutUtils & {
  // --- Utilities ---
  cleanNode: typeof cleanNode
  dependencyDetection: typeof dependencyDetection
  computedContext: typeof dependencyDetection
  filters: typeof options.filters
  ignoreDependencies: typeof dependencyDetection.ignore
  memoization: typeof memoization
  //Type merging from IKnockoutInstance options: typeof options
  removeNode: typeof removeNode
  selectExtensions: typeof selectExtensions
  tasks: typeof tasks
  utils: typeof utils
  LifeCycle: typeof LifeCycle

  // -- Observable ---
  isObservable: typeof isObservable
  isSubscribable: typeof isSubscribable
  isWriteableObservable: typeof isWriteableObservable
  isWritableObservable: typeof isWriteableObservable
  observable: typeof observable
  observableArray: typeof observableArray
  isObservableArray: typeof isObservableArray
  peek: typeof peek
  subscribable: typeof subscribable
  unwrap: typeof unwrap
  toJS: typeof toJS
  toJSON: typeof toJSON
  proxy: typeof proxy

  // ... Computed ...
  computed: typeof computed
  dependentObservable: typeof computed
  isComputed: typeof isComputed
  isPureComputed: typeof isPureComputed
  pureComputed: typeof pureComputed
  when: typeof when

  // --- Templates ---
  nativeTemplateEngine: typeof nativeTemplateEngine
  renderTemplate: typeof renderTemplate
  setTemplateEngine: typeof setTemplateEngine
  templateEngine: typeof templateEngine
  templateSources: { domElement: typeof domElement; anonymousTemplate: typeof anonymousTemplate }

  // --- Binding ---
  applyBindingAccessorsToNode: typeof applyBindingAccessorsToNode
  applyBindings: typeof applyBindings
  applyBindingsToDescendants: typeof applyBindingsToDescendants
  applyBindingsToNode: typeof applyBindingsToNode
  contextFor: typeof contextFor
  dataFor: typeof dataFor
  BindingHandler: typeof BindingHandler
  AsyncBindingHandler: typeof AsyncBindingHandler
  virtualElements: typeof virtualElements
  domNodeDisposal: typeof domNodeDisposal
  bindingEvent: typeof bindingEvent
}

const knockout: KnockoutInstance = {
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
  bindingEvent
}

export class Builder {
  providedProperties: { extenders: any; bindingHandlers: BindingHandlerObject; bindingProvider: any }

  constructor({ provider, bindings, extenders, filters, options }) {
    Object.assign(knockout.options, options, { filters, bindingProviderInstance: provider })

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
   * @return {KnockoutInstance} An instance of Knockout.
   */
  create(...additionalProperties): KnockoutInstance {
    const instance: KnockoutInstance = Object.assign(
      {
        get getBindingHandler() {
          return options.getBindingHandler
        },
        set getBindingHandler(fn) {
          options.set('getBindingHandler', fn)
        }
      },
      knockout, //never change the order of these
      this.providedProperties,
      ...additionalProperties
    )

    instance.options.knockoutInstance = instance

    return instance
  }
}
