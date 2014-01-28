
var Node = (function () {
  function Node(lhs, op, rhs) {
    this.lhs = lhs;
    this.op = op;
    this.rhs = rhs;
  }

  var operators =  {
    // members
    '.': function (a, b) { return a[b] },
    '[]': function (a, b) { return a[b] },
    // function call
    '()': function (a, b) { return a() },
    // unary
    '!': function (a, b) { return !b },
    '!!': function (a, b) { return !!b },
    // mul/div
    '*': function (a, b) { return a * b; },
    '/': function (a, b) { return a / b; },
    '%': function (a, b) { return a % b; },
    // sub/add
    '+': function (a, b) { return a + b; },
    '-': function (a, b) { return a - b; },
    // relational
    '<': function (a, b) { return a < b; },
    '<=': function (a, b) { return a <= b; },
    '>': function (a, b) { return a > b; },
    '>=': function (a, b) { return a >= b; },
    // 'in': function (a, b) { return a in b; },
    // 'instanceof': function (a, b) { return a instanceof b; },
    // equality
    '==': function (a, b) { return a == b; },
    '!=': function (a, b) { return a != b; },
    '===': function (a, b) { return a === b; },
    '!==': function (a, b) { return a !== b; },
    // logic
    '&&': function (a, b) { return a && b; },
    '||': function (a, b) { return a || b; },
  };

  /* In order of precedence, see:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence#Table
  */
    // member lookup
  operators['.'].precedence = 1;
  operators['[]'].precedence = 1;
    // function call
  operators['()'].precedence = 2;
    // logical not
  operators['!'].precedence = 4;
  operators['!!'].precedence = 4; // explicit double-negative
    // multiply/divide/mod
  operators['*'].precedence = 5;
  operators['/'].precedence = 5;
  operators['%'].precedence = 5;
    // add/sub
  operators['+'].precedence = 6;
  operators['-'].precedence = 6;
    // relational
  operators['<'].precedence = 8;
  operators['<='].precedence = 8;
  operators['>'].precedence = 8;
  operators['>='].precedence = 8;
  // operators['in'].precedence = 8;
  // operators['instanceof'].precedence = 8;
    // equality
  operators['=='].precedence = 9;
  operators['!='].precedence = 9;
  operators['==='].precedence = 9;
  operators['!=='].precedence = 9;
    // logic
  operators['&&'].precedence = 13;
  operators['||'].precedence = 14;

  Node.operators = operators;

  /**
   * Return the parameters for the '.' binding.
   *
   * @param  {node} node  A node with a '.' (member) operation
   * @return {mixed}     The value of the node if the LHS otherwise the
   */
  Node.prototype.identifier_value = function () {
    var value = this.lhs.get_value(),
        node = this.rhs;

    while (node) {
      if (node.token) {
        return value[node.token];
      }

      if (node.op != operators['.']) {
        return node.get_node_value()
      }

      value = value[node.lhs.token];
      node = node.rhs;
    }

    return value;
  };

  Node.prototype.get_leaf_value = function (leaf) {
    if (typeof(leaf) === 'function') {
      // Expressions on observables are nonsensical, so we unwrap any
      // function values (e.g. identifiers).
      return ko.unwrap(leaf());
    }

    // primitives
    if (typeof(leaf) !== 'object') {
      return leaf;
    }

    // Identifiers and Expressions
    if (leaf instanceof Identifier || leaf instanceof Expression) {
      return ko.unwrap(leaf.get_value());
    }

    if (leaf instanceof Node) {
      return leaf.get_node_value();
    }

    throw new Error("Invalid type of leaf node" + leaf);
  }

  /**
   * Return a function that calculates and returns an expression's value
   * when called.
   * @param  {array} ops  The operations to perform
   * @return {function}   The function that calculates the expression.
   *
   * Exported for testing.
   */
  Node.prototype.get_node_value = function () {
    var lhs, rhs;

    if (this.op === operators['.']) {
      return this.identifier_value();
    }
    if (this.op.operator === operators['[]']) {
      lhs = this.identifier_value();
    } else {
      lhs = this.get_leaf_value(this.lhs);
      rhs = this.get_leaf_value(this.rhs);
    }

    return this.op(lhs, rhs);
  };

  return Node;
})();

var Expression = (function () {
  function Expression(nodes) {
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
    var root,
        leaf,
        op,
        value;

    console.log("build_tree", nodes)

    // primer
    leaf = root = new Node(nodes.shift(), nodes.shift(), nodes.shift());

    while (nodes) {
      op = nodes.shift();
      value = nodes.shift();
      if (!op) {
        return root;
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
  } // build_tree

  Expression.prototype.get_value = function () {
    return this.root.get_node_value();
  };

  return Expression;
})();

