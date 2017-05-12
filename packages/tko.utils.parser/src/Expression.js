
import Node from './Node'

export default class Expression {
  constructor (nodes) {
    this.nodes = nodes
    this.root = Node.create_root(nodes)
  }

  /**
   * Return the value of `this` Expression instance.
   */
  get_value (parent, context, globals, node) {
    if (!this.root) {
      this.root = Node.create_root(this.nodes)
    }
    return this.root.get_value(parent, context, globals, node)
  }
}

Expression.prototype[Node.isExpressionOrIdentifierSymbol] = true
