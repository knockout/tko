
import Node from './Node'

export default class Arguments {
  constructor (parser, args) {
    this.parser = parser
    this.args = args
  }

  get_value (parent, context, globals, node) {
    var deReffedArgs = []
    for (var i = 0, j = this.args.length; i < j; ++i) {
      deReffedArgs.push(Node.value_of(this.args[i], context, globals, node))
    }
    return deReffedArgs
  };

  get [Node.isExpressionOrIdentifierSymbol] () { return true }
}
