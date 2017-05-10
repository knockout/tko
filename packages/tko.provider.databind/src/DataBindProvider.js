
import {
   BindingStringProvider
 } from 'tko.provider.bindingString'

export default class DataBindProvider extends BindingStringProvider {
  get BIND_ATTRIBUTE () {
    return 'data-bind'
  }

  getBindingString (node) {
    if (node.nodeType === node.ELEMENT_NODE) {
      return node.getAttribute(this.BIND_ATTRIBUTE)
    }
  }

  nodeHasBindings (node) {
    if (node.nodeType === node.ELEMENT_NODE) {
      return node.hasAttribute(this.BIND_ATTRIBUTE)
    }
  }
}
