import {
  virtualElements
} from 'tko.utils'

import {
  BindingStringProvider
} from 'tko.provider.bindingString'

export default class VirtualProvider extends BindingStringProvider {
  getBindingString (node) {
    if (node.nodeType === node.COMMENT_NODE) {
      return virtualElements.virtualNodeBindingValue(node)
    }
  }

  nodeHasBindings (node) {
    if (node.nodeType === node.COMMENT_NODE) {
      return virtualElements.isStartComment(node)
    }
  }
}
