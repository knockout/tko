
import {
  isObservable
} from '@tko/observable'

import {
  Provider
} from '@tko/provider'

export const NATIVE_BINDINGS = Symbol('Knockout native bindings')

/**
 * Retrieve the binding accessors that are already attached to
 * a node under the `NATIVE_BINDINGS` symbol.
 *
 * Used by the jsxToNode function.
 */
export default class NativeProvider extends Provider {
  get FOR_NODE_TYPES () { return [ 1 ] } // document.ELEMENT_NODE

  nodeHasBindings (node) {
    return Object.keys(node[NATIVE_BINDINGS] || {})
      .some(key => key.startsWith('ko-'))
  }

  onlyBindings ([name]) {
    return name.startsWith('ko-')
  }

  valueAsAccessor ([name, value]) {
    const bindingName = name.replace(/^ko-/, '')
    const valueFn = isObservable(value) ? value : () => value
    return {[bindingName]: valueFn}
  }

  /**
   * Return as valueAccessor function all the entries matching `ko-*`
   * @param {HTMLElement} node
   */
  getBindingAccessors (node) {
    return Object.assign({},
      ...Object.entries(node[NATIVE_BINDINGS] || {})
        .filter(this.onlyBindings)
        .map(this.valueAsAccessor)
    )
  }

  /**
   * Add a named-value to the given node.
   * @param {HTMLElement} node
   * @param {string} name
   * @param {any} value
   */
  static addValueToNode (node, name, value) {
    const obj = node[NATIVE_BINDINGS] || (node[NATIVE_BINDINGS] = {})
    obj[name] = value
  }

  /**
   *
   * @param {HTMLElement} node
   * @return {object} the stored values
   */
  static getNodeValues (node) {
    return node[NATIVE_BINDINGS]
  }
}
