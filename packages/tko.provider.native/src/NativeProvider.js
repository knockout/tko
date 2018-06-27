
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
    return node[NATIVE_BINDINGS]
  }

  getBindingAccessors (node, context) {
    return node[NATIVE_BINDINGS]
  }
}
