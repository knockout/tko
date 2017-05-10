import {
  Parser, parseObjectLiteral
} from 'tko.utils.parser'

import {
   Provider
 } from 'tko.provider'

/**
 * BindingStringProvider is an abstract base class parses a binding string.
 *
 * Children must implement `nodeHasBindings` and `getBindingString`.
 */
export default class BindingStringProvider extends Provider {
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
    yield `${handlerName}:${name ? '=>' : ''}${value}`
  }

  * generateBindingString (bindingString) {
    for (const {key, unknown, value} of parseObjectLiteral(bindingString)) {
      yield * this.processBinding(key || unknown, value)
    }
  }

  preProcessBindings (bindingString) {
    return Array.from(this.generateBindingString(bindingString)).join(',')
  }

  makeParser (node, context) {
    return new Parser(node, context, this.globals)
  }

  getBindingAccessors (node, context) {
    const bindingString = node && this.getBindingString(node)
    if (!bindingString) { return }
    return this.makeParser(node, context)
      .parse(this.preProcessBindings(bindingString))
  }

  getBindingString () { throw new Error('Overload getBindingString.') }
}
