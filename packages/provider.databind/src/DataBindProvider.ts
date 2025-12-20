import { BindingStringProvider } from '@tko/provider.bindingstring'

import type { BindingContext } from '@tko/bind'

export default class DataBindProvider extends BindingStringProvider {
  override get FOR_NODE_TYPES() {
    return [1]
  } // document.ELEMENT_NODE

  get BIND_ATTRIBUTE() {
    return 'data-bind'
  }

  override getBindingString(node: Node): string | null {
    if (node.nodeType === document.ELEMENT_NODE) {
      return (node as Element).getAttribute(this.BIND_ATTRIBUTE)
    }
    return null
  }

  override nodeHasBindings(node: HTMLElement, context?: BindingContext): boolean {
    if (node.nodeType === document.ELEMENT_NODE) {
      return node.hasAttribute(this.BIND_ATTRIBUTE)
    }
    return false
  }
}
