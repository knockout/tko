import operators from './operators'
import Node from './Node'
import Expression from './Expression'
import Identifier from './Identifier'

export default class Parameters {
  constructor (parser, node) {
    // convert a node of comma-separated Identifiers to Parameters
    if (node instanceof Expression) {
      node = node.root
    }
    try {
      this.names = Parameters.nodeTreeToNames(node)
    } catch (e) {
      parser.error(e)
    }
  }

  extendContext (context, args) {
    if (!this.names) {
      return context
    } else {
      const newValues = {}
      this.names.forEach((name, index) => {
        newValues[name] = args[index]
      })
      return context.extend(newValues)
    }
  }

  get [Node.isExpressionOrIdentifierSymbol] () { return true }

  static nodeTreeToNames (node) {
    // left-associative series of commas produces a tree with children only on the lhs, so we can extract the leaves with a simplified depth-first traversal
    const names = []
    while (node) {
      if (node instanceof Identifier) {
        names.push(node.token)
        node = null
      } else if (this.isCommaNode(node)) {
        names.push(node.rhs.token)
        node = node.lhs
      } else {
        throw new Error(`only simple identifiers allowed in lambda parameter list but found ${JSON.stringify(node, null, 2)}`)
      }
    }
    names.reverse()
    return names
  }

  static isCommaNode (node) {
    return (
      (node instanceof Node) &&
      node.op === operators[','] &&
      (node.rhs instanceof Identifier)
    )
  }
}
