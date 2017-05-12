import {
  virtualElements
} from 'tko.utils'

import {
  BindingStringProvider
} from 'tko.provider.bindingString'

export default class VirtualProvider extends BindingStringProvider {
  get FOR_NODE_TYPES () { return [document.COMMENT_NODE] }

  getBindingString (node) {
    if (node.nodeType === document.COMMENT_NODE) {
      return virtualElements.virtualNodeBindingValue(node)
    }
  }

  nodeHasBindings (node) {
    if (node.nodeType === document.COMMENT_NODE) {
      return virtualElements.isStartComment(node)
    }
  }
}
