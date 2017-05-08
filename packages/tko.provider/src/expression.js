
import Node from './node';

export default function Expression(nodes) {
  this.nodes = nodes;
  this.root = Node.create_root(nodes);
}

// Exports for testing.
Expression.operators = Node.operators;
Expression.Node = Node;


/**
 * Return the value of `this` Expression instance.
 *
 */
Expression.prototype.get_value = function () {
  if (!this.root) {
    this.root = Node.create_root(this.nodes);
  }
  return this.root.get_node_value();
};


Expression.prototype[Node.isExpressionOrIdentifierSymbol] = true;