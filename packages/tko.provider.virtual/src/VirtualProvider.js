import {
  virtualElements
} from 'tko.utils'

import {
  BindingStringProvider
} from 'tko.provider.bindingstring'

export default class VirtualProvider extends BindingStringProvider {
  get FOR_NODE_TYPES () { return [ 8 ] } // document.COMMENT_NODE

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
