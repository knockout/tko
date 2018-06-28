
import {
  Provider
} from 'tko.provider'

export const NATIVE_BINDINGS = Symbol('Knockout native bindings')

/**
 * Retrieve the binding accessors that are already attached to
 * a node under the `NATIVE_BINDINGS` symbol.
 *
 * Used by the jsxToNode function.
 */
export default class JsxProvider extends Provider {
  get FOR_NODE_TYPES () { return [ 1 ] } // document.ELEMENT_NODE

  nodeHasBindings (node) {
    return Object.keys(node[NATIVE_BINDINGS])
      .some(key => key.startsWith('ko-'))
  }

  /**
   * Return as valueAccessor function all the entries matching `ko-*`
   * @param {HTMLElement} node
   */
  getBindingAccessors (node) {
    return Object.assign({},
      ...Object.entries(node[NATIVE_BINDINGS])
        .filter(([name, value]) => name.startsWith('ko-'))
        .map(([name, value]) => ({[name.replace(/^ko-/, '')]: () => value}))
    )
  }
}
