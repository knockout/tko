
import {
  isObservable
} from '@tko/observable'

import {
  Provider
} from '@tko/provider'

export const NATIVE_BINDINGS = Symbol('Knockout native bindings')

declare global {
  interface Node { [NATIVE_BINDINGS]: any }
}

type NativeBindingNodes = Comment | Text | Element

export function setNativeBindings (node: NativeBindingNodes, value: any) {
  node[NATIVE_BINDINGS] = value
  return node
}

export function getNativeBindings (node: NativeBindingNodes) {
  return node[NATIVE_BINDINGS]
}


/**
 * Retrieve the binding accessors that are already attached to
 * a node under the `NATIVE_BINDINGS` symbol.
 *
 * Used by the jsxToNode function.
 */
export default class NativeProvider extends Provider {
  get FOR_NODE_TYPES () { return [ 1, 3 ] }
  get preemptive () { return true }

  nodeHasBindings (node: Node) {
    if (!node[NATIVE_BINDINGS]) { return false }
    return Object.keys(node[NATIVE_BINDINGS] || {})
      .some(key => key.startsWith('ko-'))
  }

  /**
   * There can be only one preprocessor; when there are native bindings,
   * prevent re-entrance (and likely XSS) from the `{{ }}` provider.
   */
  preprocessNode (node: Node) {
    return node[NATIVE_BINDINGS] ? node : null
  }

  private onlyBindings ([name, value]: [string, any]) {
    return name.startsWith('ko-') && typeof value === 'function'
  }

  private valueAsAccessor (name: string, value: string) {
    const bindingName = name.replace(/^ko-/, '')
    const valueFn = isObservable(value) ? value : () => value
    return [bindingName, valueFn]
  }

  /**
   * Return as valueAccessor function all the entries matching `ko-*`
   * @param {HTMLElement} node
   */
  getBindingAccessors (node: Node) {
    const bindings = Object.entries(node[NATIVE_BINDINGS] || {})
      .filter(this.onlyBindings) as [string, any]
    if (!bindings.length) { return null }
    return Object.fromEntries(
      bindings.map(([n, v]) => this.valueAsAccessor(n, v)))
  }

  /**
   * Add a named-value to the given node.
   * @param {Element} node
   * @param {string} name
   * @param {any} value
   */
  static addValueToNode (
    node: Node,
    name: string,
    value: MaybeObservable<any>,
  ) {
    const obj = node[NATIVE_BINDINGS] || (node[NATIVE_BINDINGS] = {})
    obj[name] = value
  }

  /**
   *
   * @param {HTMLElement} node
   * @return {object} the stored values
   */
  static getNodeValues (node: Node) {
    return node[NATIVE_BINDINGS]
  }
}
