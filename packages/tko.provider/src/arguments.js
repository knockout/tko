
import Node from './node';


export default function Arguments(parser, args) {
  this.parser = parser;
  this.args = args;
}


Arguments.prototype.get_value = function get_value(/* parent */) {
  var dereffed_args = [];
  for (var i = 0, j = this.args.length; i < j; ++i) {
    dereffed_args.push(Node.value_of(this.args[i]));
  }
  return dereffed_args;
};


Arguments.prototype[Node.isExpressionOrIdentifierSymbol] = true;
