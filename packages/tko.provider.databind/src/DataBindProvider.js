
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
  * processBinding (key, value) {
    // Get the "on" binding from "on.click"
    const [on, name] = key.split('.')
    const handlerName = name || on
    const handler = this.bindingHandlers.get(handlerName)

    if (handler && handler.preprocess) {
      const bindingsAddedByHandler = []
      const chainFn = (...args) => bindingsAddedByHandler.push(args)
      value = handler.preprocess(value, key, chainFn)
      for (const [key, value] of bindingsAddedByHandler) {
        yield * this.processBinding(key, value)
      }
    }
    yield `${handlerName}:${value}`
  }

  * generateBindingString (bindingString) {
    for (const {key, unknown, value} of parseObjectLiteral(bindingString)) {
      yield * this.processBinding(key || unknown, value)
    }
  }

  preProcessBindings (bindingString) {
    return Array.from(this.generateBindingString(bindingString)).join(',')
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
