import { virtualElements } from '@tko/utils'

import { BindingStringProvider } from '@tko/provider.bindingstring'

import type { BindingContext } from '@tko/bind'

export default class VirtualProvider extends BindingStringProvider {
  override get FOR_NODE_TYPES() {
    return [Node.ELEMENT_NODE, Node.COMMENT_NODE]
  }

  /**
   * Convert <ko binding='...'> into <!-- ko binding: ... -->
   * @param {Node} node
   */
  override preprocessNode(node: Node): Node[] | null {
    if (node instanceof Element && node.tagName === 'KO') {
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
    return null
  }

  *genElementBindingStrings(node: Element) {
    for (const { name, value } of node.attributes) {
      yield `${name.replace(/^ko-/, '')}: ${value}`
    }
  }

  override getBindingString(node: Node): string | null {
    if (node.nodeType === Node.COMMENT_NODE) {
      return virtualElements.virtualNodeBindingValue(node)
    }
    return null
  }

  override nodeHasBindings(node: Node, context?: BindingContext): boolean {
    if (node.nodeType === Node.COMMENT_NODE) {
      return virtualElements.isStartComment(node)
    }
    return false
  }
}
