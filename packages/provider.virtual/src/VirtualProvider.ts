import {
  virtualElements
} from '@tko/utils'

import {
  BindingStringProvider
} from '@tko/provider.bindingstring'

export default class VirtualProvider extends BindingStringProvider {
  get FOR_NODE_TYPES () { return [ 1, 8 ] }

  /**
   * Convert <ko binding='...'> into <!-- ko binding: ... -->
   * @param {HTMLElement} node
   */
  preprocessNode (node: Element) {
    if (node.tagName === 'KO') {
      const parent = node.parentNode
      const childNodes = [...node.childNodes]
      const virtualBindingString = [...this.genElementBindingStrings(node)].join(',')
      const openNode = document.createComment('ko ' + virtualBindingString)
      const closeNode = document.createComment('/ko')
      parent?.insertBefore(openNode, node)
      for (const child of childNodes) {
        parent?.insertBefore(child, node)
      }
      parent?.insertBefore(closeNode, node)
      node.remove()
      return [openNode, ...childNodes, closeNode]
    }
  }

  * genElementBindingStrings (node: Element) {
    for (const {name, value} of node.attributes) {
      yield `${name.replace(/^ko-/, '')}: ${value}`
    }
  }

  getBindingString (node: Element) {
    if (node.nodeType === document.COMMENT_NODE) {
      return virtualElements.virtualNodeBindingValue(node)
    }
  }

  nodeHasBindings (node: Element, context?: BindingContext) : boolean | undefined {
    if (node.nodeType === document.COMMENT_NODE) {
      return virtualElements.isStartComment(node)
    }
  }
}
