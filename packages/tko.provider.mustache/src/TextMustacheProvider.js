import {
  Provider
} from 'tko.provider'

import {
  parseInterpolation
} from './mustacheParser'

/**
 * Interpret {{ }}, {{{ }}}, {{# /}}, and {{# }} ... {{/ }} inside text nodes.
 *
 * This binding must come before the VirtualProvider.
 */
export default class TextMustacheProvider extends Provider {
  get FOR_NODE_TYPES () { return [ 3 ] } // document.TEXT_NODE

  * textToNodes (textNode) {
    const parent = textNode.parentNode
    const isTextarea = parent && parent.nodeName === 'TEXTAREA'
    const hasStash = textNode.nodeValue && textNode.nodeValue.includes('{{')

    if (!hasStash || isTextarea) { return }

    for (const part of parseInterpolation(textNode.nodeValue)) {
      yield * part.textNodeReplacement(textNode)
    }
  }

  textInterpolation (textNode) {
    const newNodes = Array.from(this.textToNodes(textNode))

    if (newNodes.length === 0) { return }

    if (textNode.parentNode) {
      const parent = textNode.parentNode
      const n = newNodes.length
      for (let i = 0; i < n; ++i) {
        parent.insertBefore(newNodes[i], textNode)
      }
      parent.removeChild(textNode)
    }

    return newNodes
  }

  /**
   * We convert as follows:
   *
   *   {{# ... }} into <!-- ko ... -->
   *   {{/ ... }} into <!-- /ko -->
   *   {{# ... /}} into <!-- ko ... --><!-- /ko -->
   *   {{ ... }} into <!-- ko text: ... --><!-- /ko -->
   *   {{{ ... }}} into <!-- ko html: ... --><!-- /ko -->
   *
   * VirtualProvider can then pick up and do the actual binding.
   */
  preprocessNode (node) {
    return this.textInterpolation(node)
  }
}
