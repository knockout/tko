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
    const [handlerName, property] = key.split('.')
    const handler = this.bindingHandlers.get(handlerName)

    if (handler && handler.preprocess) {
      const bindingsAddedByHandler = []
      const chainFn = (...args) => bindingsAddedByHandler.push(args)
      value = handler.preprocess(value, key, chainFn)
      for (const [key, value] of bindingsAddedByHandler) {
        yield * this.processBinding(key, value)
      }
    } else if (property) {
      value = `{${property}:${value}}`
    }

    yield `'${handlerName}':${value}`
  }

  * generateBindingString (bindingStringOrObjects) {
    const bindingObjectsArray = typeof bindingStringOrObjects === 'string'
      ? parseObjectLiteral(bindingStringOrObjects) : bindingStringOrObjects
    for (const {key, unknown, value} of bindingObjectsArray) {
      yield * this.processBinding(key || unknown, value)
    }
  }

  preProcessBindings (bindingStringOrObjects) {
    return Array.from(this.generateBindingString(bindingStringOrObjects))
      .join(',')
  }

  getBindingAccessors (node, context) {
    const bindingString = node && this.getBindingString(node)
    if (!bindingString) { return }
    const processed = this.preProcessBindings(bindingString)
    return new Parser().parse(processed, context, this.globals, node)
  }

  getBindingString () { throw new Error('Overload getBindingString.') }
}
