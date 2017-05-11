
import Node from './Node'

export default class Ternary {
  constructor (yes, no) {
    Object.assign(this, {yes, no})
  }

  get_value () { return this }

  get [Node.isExpressionOrIdentifierSymbol] () { return true }
}
