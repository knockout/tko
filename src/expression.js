
var Node = (function () {
  function Node(lhs, op, rhs) {
    this.lhs = lhs;
    this.op = op;
    this.rhs = rhs;
  }

  var operators =  {
    // members
    '.': function member_dot(a, b) { return a[b]; },
    '[]': function member_bkt(a, b) { return a[b]; },
    // function call
    '()': function fn_call(a, b) { return a(); },
    // unary
    '!': function not(a, b) { return !b; },
    '!!': function notnot(a, b) { return !!b; },
    // mul/div
    '*': function mul(a, b) { return a * b; },
    '/': function div(a, b) { return a / b; },
    '%': function mod(a, b) { return a % b; },
    // sub/add
    '+': function add(a, b) { return a + b; },
    '-': function sub(a, b) { return a - b; },
    // relational
    '<': function lt(a, b) { return a < b; },
    '<=': function le(a, b) { return a <= b; },
    '>': function gt(a, b) { return a > b; },
    '>=': function ge(a, b) { return a >= b; },
    // 'in': function (a, b) { return a in b; },
    // 'instanceof': function (a, b) { return a instanceof b; },
    // equality
    '==': function equal(a, b) { return a == b; },
    '!=': function ne(a, b) { return a != b; },
    '===': function sequal(a, b) { return a === b; },
    '!==': function sne(a, b) { return a !== b; },
    // logic
    '&&': function logic_and(a, b) { return a && b; },
    '||': function logic_or(a, b) { return a || b; },
  };

  /* In order of precedence, see:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence#Table
  */
    // member lookup
  operators['.'].precedence = 1;
  operators['[]'].precedence = 1;
    // function call
    // usually 2, but a().b() is a() . b() not a.b()()
  operators['()'].precedence = 0;
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


  Node.prototype.get_leaf_value = function (leaf, member_of) {
    if (typeof(leaf) === 'function') {
      // Expressions on observables are nonsensical, so we unwrap any
      // function values (e.g. identifiers).
      return ko.unwrap(leaf());
    }

    // primitives
    if (typeof(leaf) !== 'object') {
      return member_of ? member_of[leaf] : leaf;
    }

    // Identifiers and Expressions
    if (leaf instanceof Identifier || leaf instanceof Expression) {
      // lhs is passed in as the parent of the leaf. It will be defined in
      // cases like a.b.c as 'a' for 'b' then as 'b' for 'c'.
      return ko.unwrap(leaf.get_value(member_of));
    }

    if (leaf instanceof Node) {
      return leaf.get_node_value(member_of);
    }

    throw new Error("Invalid type of leaf node: " + leaf);
  };

  /**
   * Return a function that calculates and returns an expression's value
   * when called.
   * @param  {array} ops  The operations to perform
   * @return {function}   The function that calculates the expression.
   *
   * Exported for testing.
   */
  Node.prototype.get_node_value = function (member_of) {
    var lhs, rhs, member_op;

    member_op = this.op === operators['.'] || this.op === operators['[]'];

    lhs = this.get_leaf_value(this.lhs, member_of);
    rhs = this.get_leaf_value(this.rhs, member_op ? lhs : undefined);

    // It is already computed in this case right-to-left.
    if (member_op) {
      return rhs;
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

  Expression.prototype.get_value = function () {
    return this.root.get_node_value();
  };

  return Expression;
})();

