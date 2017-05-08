
import Node from './node';

export default function Ternary(yes, no) {
  this.yes = yes;
  this.no = no;
}

Ternary.prototype[Node.isExpressionOrIdentifierSymbol] = true;
Ternary.prototype.get_value = function () { return this; };
