import { isObservable } from '@tko/observable'

import { Provider } from '@tko/provider'

import type { BindingContext } from '@tko/bind'

export const NATIVE_BINDINGS = Symbol('Knockout native bindings')

/**
 * Retrieve the binding accessors that are already attached to
 * a node under the `NATIVE_BINDINGS` symbol.
 *
 * Used by the jsxToNode function.
 */
export default class NativeProvider extends Provider {
  override get FOR_NODE_TYPES() {
    return [Node.ELEMENT_NODE, Node.TEXT_NODE]
  }
  override get preemptive() {
    return true
  }

  override nodeHasBindings(node: Element, context?: BindingContext): boolean | undefined {
    if (!node[NATIVE_BINDINGS]) {
      return false
    }
    return Object.keys(node[NATIVE_BINDINGS] || {}).some(key => key.startsWith('ko-'))
  }

  /**
   * There can be only one preprocessor; when there are native bindings,
   * prevent re-entrance (and likely XSS) from the `{{ }}` provider.
   */
  override preprocessNode(node: Element) {
    return node[NATIVE_BINDINGS] ? node : null
  }

  onlyBindings([name]) {
    return name.startsWith('ko-')
  }

  valueAsAccessor([name, value]) {
    const bindingName = name.replace(/^ko-/, '')
    const valueFn = isObservable(value) ? value : () => value
    return { [bindingName]: valueFn }
  }

  /**
   * Return as valueAccessor function all the entries matching `ko-*`
   * @param {Element} node
   */
  override getBindingAccessors(node: Element, context?: BindingContext) {
    const bindings = (Object.entries(node[NATIVE_BINDINGS] || {}) as any).filter(this.onlyBindings)
    if (!bindings.length) {
      return null
    }
    return Object.assign({}, ...bindings.map(this.valueAsAccessor))
  }

  /**
   * Add a named-value to the given node.
   * @param {Element} node
   * @param {string} name
   * @param {any} value
   */
  static addValueToNode(node: Element, name: string, value: any) {
    const obj = node[NATIVE_BINDINGS] || (node[NATIVE_BINDINGS] = {})
    obj[name] = value
  }

  /**
   *
   * @param {Element} node
   * @return {object} the stored values
   */
  static getNodeValues(node: Element): any {
    return node[NATIVE_BINDINGS]
  }
}
