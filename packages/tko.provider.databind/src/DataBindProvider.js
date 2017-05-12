
import {
   BindingStringProvider
 } from 'tko.provider.bindingString'

export default class DataBindProvider extends BindingStringProvider {
  static get FOR_NODE_TYPES () { return [document.ELEMENT_NODE] }

  get BIND_ATTRIBUTE () {
    return 'data-bind'
  }

  getBindingString (node) {
    if (node.nodeType === document.ELEMENT_NODE) {
      return node.getAttribute(this.BIND_ATTRIBUTE)
    }
  }

  nodeHasBindings (node) {
    if (node.nodeType === document.ELEMENT_NODE) {
      return node.hasAttribute(this.BIND_ATTRIBUTE)
    }
  }
}
