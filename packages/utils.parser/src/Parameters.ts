import operators from './operators'
import Node from './Node'
import Expression from './Expression'
import Identifier from './Identifier'

export default class Parameters {
  constructor (parser, node) {
    const origNode = node
    // converts a node of comma-separated Identifiers to Parameters
    this.names = []
    if (node instanceof Expression) {
      node = node.root
    }
    while (node instanceof Node) {
      if (node.op === operators[','] && node.lhs instanceof Identifier && node.lhs.token) {
        this.names.push(node.lhs.token)
      } else {
        parser.error(`only simple identifiers allowed in lambda parameter list but found ${JSON.stringify(node, null, 2)}`)
      }
      node = node.rhs
    }
    if (node instanceof Identifier && node.token) {
      this.names.push(node.token)
    }
    console.log(`Parameters constructed from node ${JSON.stringify(origNode, null, 2)}: ${JSON.stringify(this.names)}`)
  }

  extendContext (context, args) {
    console.log(`lambda lhs: ${JSON.stringify(this, null, 2)} context: ${context}`)
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
