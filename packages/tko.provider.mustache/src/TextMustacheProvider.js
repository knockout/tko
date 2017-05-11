import {
  Provider
} from 'tko.provider'

import {
  parseInterpolation
} from './mustacheParser'

/**
 *  Interpret {{ }}, {{{ }}}, {{# /}}, and {{# }} ... {{/ }} inside text nodes
 */
export default class TextMustacheProvider extends Provider {
  static get FOR_NODE_TYPES () { return [document.TEXT_NODE] }

  * wrapExpression (text, textNode) {
    text = (text || '').trim()
    const ownerDocument = textNode ? textNode.ownerDocument : document
    const firstChar = text[0]
    const lastChar = text[text.length - 1]
    var closeComment = true
    var binding

    if (firstChar === '#') {
      if (lastChar === '/') {
        binding = text.slice(1, -1)
      } else {
        binding = text.slice(1)
        closeComment = false
      }
      const matches = binding.match(/^([^,"'{}()/:[\]\s]+)\s+([^\s:].*)/)
      if (matches) {
        binding = matches[1] + ':' + matches[2]
      }
    } else if (firstChar === '/') {
      // replace only with a closing comment
    } else if (firstChar === '{' && lastChar === '}') {
      binding = 'html:' + text.slice(1, -1).trim()
    } else {
      binding = 'text:' + text.trim()
    }

    if (binding) {
      yield ownerDocument.createComment('ko ' + binding)
    }
    if (closeComment) {
      yield ownerDocument.createComment('/ko')
    }
  }

  * textToNodes (textNode) {
    const parent = textNode.parentNode
    const isTextarea = parent && parent.nodeName === 'TEXTAREA'
    const hasStash = textNode.nodeValue && textNode.nodeValue.includes('{{')

    if (!hasStash || isTextarea) { return }

    for (const [type, value] of parseInterpolation(textNode.nodeValue)) {
      if (type === 'text') {
        yield document.createTextNode(value)
      } else {
        yield * this.wrapExpression(value, textNode)
      }
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
   * We need to convert any {{# ... }} into <!-- ko : ... -->, so that the
   * VirtualProvider can pick it up.
   */
  preprocessNode (node) {
    return this.textInterpolation(node)
  }
}
