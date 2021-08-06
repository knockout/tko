import operators from './operators'
import Node from './Node'
import Expression from './Expression'
import Identifier from './Identifier'

export default class Parameters {
  constructor (parser, node) {
    const origNode = node

    // convert a node of comma-separated Identifiers to Parameters
    const names = []
    if (node instanceof Expression) {
      node = node.root
    }
    // left-associative series of commas produces a tree with children only on the lhs, so we can extract the leaves with a simplified depth-first traversal
    while (node) {
      if (node instanceof Identifier) {
        names.push(node.token)
        node = null
      } else if ((node instanceof Node) && node.op === operators[','] && (node.rhs instanceof Identifier)) {
        names.push(node.rhs.token)
        node = node.lhs
      } else {
        parser.error(`only simple identifiers allowed in lambda parameter list but found ${JSON.stringify(node, null, 2)}`)
      }
    }
    names.reverse()
    this.names = names
    // console.log(`Parameters constructed from node ${JSON.stringify(origNode, null, 2)}: ${JSON.stringify(this.names)}`)
  }

  extendContext (context, args) {
    // console.log(`lambda lhs: ${JSON.stringify(this, null, 2)} context: ${context}`)
    if (!this.names) return context
    else {
      const newValues = {}
      this.names.forEach((name, index) => {
        newValues[name] = args[index]
      })
      return context.extend(newValues)
    }
  }

  get [Node.isExpressionOrIdentifierSymbol] () { return true }
}
