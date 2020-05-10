
import {
  objectMap
} from '@tko/utils'

import {
  dependencyDetection
} from '@tko/observable'

import BindingHandlerObject from './BindingHandlerObject'

export default abstract class Provider {
  bindingHandlers: BindingHandlerObject
  globals: Record<string, any>

  constructor (params: any = {}) {
    if (this.constructor === Provider) {
      throw new Error('Provider is an abstract base class.')
    }
    if (!('FOR_NODE_TYPES' in this)) {
      // FOR_NODE_TYPES must return a list of integers corresponding to the
      // node.nodeType's that the provider handles.
      throw new Error('Providers must have FOR_NODE_TYPES property')
    }
    this.bindingHandlers = params.bindingHandlers || new BindingHandlerObject()
    this.globals = params.globals || {}
  }

  abstract get FOR_NODE_TYPES (): Array<number>

  setGlobals (g: Record<string, any>) { this.globals = g }
  get preemptive () { return false }
  nodeHasBindings (node: Node) {}
  getBindingAccessors (node: Node, context: KnockoutBindingContext) {}

  /**
   * Preprocess a given node.
   * @param {HTMLElement} node
   * @returns {[HTMLElement]|undefined}
   */
  preprocessNode (node: Node) {}
  postProcess (node: Node) {}

  /** For legacy binding provider assignments to
   *  ko.bindingProvider.instance = ... */
  private _overloadInstance?: any
  get instance () { return this._overloadInstance || this }
  set instance (provider) {
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
  makeAccessorsFromFunction (callback: () => any) {
    return objectMap(dependencyDetection.ignore(callback),
      (value: any, key: string) => () => callback()[key]
    )
  }

  // Returns the valueAccessor function for a binding value
  makeValueAccessor (value: any) {
    return () => value
  }

  // Given a bindings function or object, create and return a new object that contains
  // binding value-accessors functions. This is used by ko.applyBindingsToNode.
  makeBindingAccessors (
    bindings: any,
    context: KnockoutBindingContext,
    node: Node,
  ) {
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
  get FOR_NODE_TYPES () { return [1, 3, 8] }

  constructor (private providerObject: any, parentProvider: any) {
    super()
    this.bindingHandlers = providerObject.bindingHandlers || parentProvider.bindingHandlers
  }

  // This function is used if the binding provider doesn't include a getBindingAccessors function.
  // It must be called with 'this' set to the provider instance.
  getBindingsAndMakeAccessors (node: Node, context: KnockoutBindingContext) {
    const bindingsFn = this.providerObject.getBindings.bind(this.providerObject, node, context)
    return this.makeAccessorsFromFunction(bindingsFn)
  }

  getBindingAccessors (node: Node, context: KnockoutBindingContext) {
    return this.providerObject.getBindingAccessors
      ? this.providerObject.getBindingAccessors(node, context)
      : this.getBindingsAndMakeAccessors(node, context)
  }

  nodeHasBindings (node: Node) {
    return this.providerObject.nodeHasBindings(node)
  }

  preprocessNode (node: Node) {
    if (this.providerObject.preprocessNode) {
      return this.providerObject.preprocessNode(node)
    }
  }
}
