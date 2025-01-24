
import {
   BindingStringProvider
 } from '@tko/provider.bindingstring'

export default class DataBindProvider extends BindingStringProvider {
  get FOR_NODE_TYPES () { return [ 1 ] } // document.ELEMENT_NODE

  get BIND_ATTRIBUTE () {
    return 'data-bind'
  }

  getBindingString(node: Node): string | null | undefined {
    if (node.nodeType === document.ELEMENT_NODE) {
      return (node as Element).getAttribute(this.BIND_ATTRIBUTE)
    }
  }

  nodeHasBindings(node: HTMLElement): boolean | undefined {
    if (node.nodeType === document.ELEMENT_NODE) {
      return node.hasAttribute(this.BIND_ATTRIBUTE)
    }
  }
}
