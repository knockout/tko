
import {
  options, virtualElements
} from 'tko.utils'

import {
  Parser, parseObjectLiteral
} from 'tko.utils.parser'

import {
   Provider
 } from 'tko.provider'

export default class DataBindProvider extends Provider {
  getBindingString (node) {
    switch (node.nodeType) {
      case node.ELEMENT_NODE:
        return node.getAttribute(options.defaultBindingAttribute)
      case node.COMMENT_NODE:
        return virtualElements.virtualNodeBindingValue(node)
      default:
        return null
    }
  }

  /** Call bindingHandler.preprocess on each respective binding string.
   *
   * The `preprocess` property of bindingHandler must be a static
   * function (i.e. on the object or constructor).
   */
  processBinding (key, value) {
    // Get the "on" binding from "on.click"
    const [on, name] = key.split('.')
    const handler = this.bindingHandlers.get(name || on)
    if (handler && handler.preprocess) {
      value = handler.preprocess(value, key, this.processBinding.bind(this))
    }
    return `${name || on}:${value}`
  }

  preProcessBindings (bindingString) {
    return parseObjectLiteral(bindingString)
      .map((keyValueItem) => this.processBinding(
          keyValueItem.key || keyValueItem.unknown,
          keyValueItem.value
        ))
      .join(',')
  }

  nodeHasBindings (node) {
    if (node.nodeType === node.ELEMENT_NODE) {
      return Boolean(node.getAttribute(options.defaultBindingAttribute))
    }
    if (node.nodeType === node.COMMENT_NODE) {
      return virtualElements.isStartComment(node)
    }
  }

  getBindingAccessors (node, context) {
    const bindingString = this.getBindingString(node)
    if (!bindingString) { return }
    const parser = new Parser(node, context, options.bindingGlobals)
    return parser.parse(bindingString)
  }
}
