
import Node from './node';

export default function Expression(nodes) {
  this.nodes = nodes;
  this.root = this.build_tree(nodes);
}

// Exports for testing.
Expression.operators = Node.operators;
Expression.Node = Node;

/**
*  Convert an array of nodes to an executable tree.
*  @return {object} An object with a `lhs`, `rhs` and `op` key, corresponding
*                      to the left hand side, right hand side, and
*                      operation function.
*/
Expression.prototype.build_tree = function (nodes) {
  var root, leaf, op, value;

  // console.log("build_tree", nodes.slice(0))

  // primer
  leaf = root = new Node(nodes.shift(), nodes.shift(), nodes.shift());

  while (nodes) {
    op = nodes.shift();
    value = nodes.shift();
    if (!op) {
      break;
    }
    if (op.precedence > root.op.precedence) {
      // rebase
      root = new Node(root, op, value);
      leaf = root;
    } else {
      leaf.rhs = new Node(leaf.rhs, op, value);
      leaf = leaf.rhs;
    }
  }
  // console.log("tree", root)
  return root;
}; // build_tree


/**
 * Return the value of `this` Expression instance.
 *
 */
Expression.prototype.get_value = function () {
  if (!this.root) {
    this.root = this.build_tree(this.nodes);
  }
  return this.root.get_node_value();
};


Expression.prototype[Node.isExpressionOrIdentifierSymbol] = true;
