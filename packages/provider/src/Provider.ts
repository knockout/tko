import { objectMap } from '@tko/utils'

import { dependencyDetection } from '@tko/observable'

import BindingHandlerObject from './BindingHandlerObject'

import type { BindingContext } from '@tko/bind'

export interface ProviderParamsInput {
  bindingHandlers?: BindingHandlerObject
  globals?: any
  attributesToSkip?: any
  attributesBindingMap?: any
  providers?: any[]
}

export default class Provider {
  constructor(params?: ProviderParamsInput | null) {
    if (this.constructor === Provider) {
      throw new Error('Provider is an abstract base class.')
    }
    if (!('FOR_NODE_TYPES' in this)) {
      // FOR_NODE_TYPES must return a list of integers corresponding to the
      // node.nodeType's that the provider handles.
      throw new Error('Providers must have FOR_NODE_TYPES property')
    }
    this.bindingHandlers = params?.bindingHandlers || new BindingHandlerObject()
    this.globals = params?.globals || {}
  }

  get FOR_NODE_TYPES(): number[] {
    throw new Error('Providers must override FOR_NODE_TYPES property')
  }

  setGlobals(globals) {
    this.globals = globals
  }
  get preemptive() {
    return false
  }
  nodeHasBindings(node: Element, context?: BindingContext): boolean | undefined {
    return undefined
  }
  getBindingAccessors(node: Element, context?: BindingContext) {}

  /**
   * Preprocess a given node.
   * @param {Element} Element
   * @returns {[HTMLElement]|undefined}
   */
  preprocessNode(node: Element) {}
  postProcess(/* node */) {}

  bindingHandlers: BindingHandlerObject
  globals: any | undefined
  _overloadInstance: any | undefined

  /** For legacy binding provider assignments to
   *  ko.bindingProvider.instance = ... */
  get instance() {
    return this._overloadInstance || this
  }
  set instance(provider) {
    if (!provider || provider === this) {
      this._overloadInstance = undefined
    } else {
      this._overloadInstance = new LegacyProvider(provider, this)
    }
  }

  // Given a function that returns bindings, create and return a new object that contains
  // binding value-accessors functions. Each accessor function calls the original function
  // so that it always gets the latest value and all dependencies are captured. This is used
  // by ko.applyBindingsToNode and getBindingsAndMakeAccessors.
  makeAccessorsFromFunction(callback) {
    return objectMap(dependencyDetection.ignore(callback), (value, key) => () => callback()[key])
  }

  // Returns the valueAccessor function for a binding value
  makeValueAccessor(value) {
    return () => value
  }

  // Given a bindings function or object, create and return a new object that contains
  // binding value-accessors functions. This is used by ko.applyBindingsToNode.
  makeBindingAccessors(bindings, context, node) {
    if (typeof bindings === 'function') {
      return this.makeAccessorsFromFunction(bindings.bind(null, context, node))
    } else {
      return objectMap(bindings, this.makeValueAccessor)
    }
  }
}

/**
 * LegacyProvider class is created when ko.bindingProvider.instance assigned to
 * an object that were once used for binding pre-4.0 binding providers e.g.
 * {  getBindings: function () { ... },
 *    nodeHasBindings: function () { ... }
 *    preprocessNode: function () { ... }
 * }
 */
class LegacyProvider extends Provider {
  override get FOR_NODE_TYPES() {
    return [1, 3, 8]
  }

  providerObject: any

  constructor(providerObject, parentProvider) {
    super()
    Object.assign(this, { providerObject })
    this.bindingHandlers = providerObject.bindingHandlers || parentProvider.bindingHandlers
  }

  // This function is used if the binding provider doesn't include a getBindingAccessors function.
  // It must be called with 'this' set to the provider instance.
  getBindingsAndMakeAccessors(node, context) {
    const bindingsFn = this.providerObject.getBindings.bind(this.providerObject, node, context)
    return this.makeAccessorsFromFunction(bindingsFn)
  }

  override getBindingAccessors(node, context) {
    return this.providerObject.getBindingAccessors
      ? this.providerObject.getBindingAccessors(node, context)
      : this.getBindingsAndMakeAccessors(node, context)
  }

  override nodeHasBindings(node: Element): boolean {
    return this.providerObject.nodeHasBindings(node)
  }

  override preprocessNode(node) {
    if (this.providerObject.preprocessNode) {
      return this.providerObject.preprocessNode(node)
    }
  }
}
