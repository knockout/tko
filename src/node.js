
import {
  createSymbolOrString
} from 'tko.utils';

import {
  unwrap
} from 'tko.observable';


export default function Node(lhs, op, rhs) {
  this.lhs = lhs;
  this.op = op;
  this.rhs = rhs;
}


/* Just a placeholder */
function LAMBDA() {}

/**
 * @ operator - recursively call the identifier if it's a function
 * @param  {operand} a ignored
 * @param  {operand} b The variable to be called (if a function) and unwrapped
 * @return {value}   The result.
 */
function unwrapOrCall(a, b) {
  while (typeof b === 'function') { b = b(); }
  return b;
}


var operators = {
  // unary
  '@': unwrapOrCall,
  '=>': LAMBDA,
  '!': function not(a, b) { return !b; },
  '!!': function notnot(a, b) { return !!b; },
  '++': function preinc(a, b) { return ++b; },
  '--': function preinc(a, b) { return --b; },
  // mul/div
  '*': function mul(a, b) { return a * b; },
  '/': function div(a, b) { return a / b; },
  '%': function mod(a, b) { return a % b; },
  // sub/add
  '+': function add(a, b) { return a + b; },
  '-': function sub(a, b) { return (a || 0) - (b || 0); },
  // relational
  '<': function lt(a, b) { return a < b; },
  '<=': function le(a, b) { return a <= b; },
  '>': function gt(a, b) { return a > b; },
  '>=': function ge(a, b) { return a >= b; },
  //    TODO: 'in': function (a, b) { return a in b; },
  //    TODO: 'instanceof': function (a, b) { return a instanceof b; },
  // equality
  '==': function equal(a, b) { return a === b; },
  '!=': function ne(a, b) { return a !== b; },
  '===': function sequal(a, b) { return a === b; },
  '!==': function sne(a, b) { return a !== b; },
  // Fuzzy (bad) equality
  '~==': function equal(a, b) { return a == b; },
  '~!=': function ne(a, b) { return a != b; },
  // bitwise
  '&': function bit_and(a, b) { return a & b; },
  '^': function xor(a, b) { return a ^ b; },
  '|': function bit_or(a, b) { return a | b; },
  // logic
  '&&': function logic_and(a, b) { return a && b; },
  '||': function logic_or(a, b) { return a || b; },
  // Access
  '.': function member(a, b) { return a[b]; },
  '[': function member(a, b) { return a[b]; },
  // conditional/ternary
  '?': function ternary(a, b) { return Node.value_of(a ? b.yes : b.no); },

  // Function-Call
  'call': function (a, b) { return a.apply(null, b); },
};

/* Order of precedence from:
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence#Table
*/

  // Our operator - unwrap/call
operators['@'].precedence = 21;

  // lambda
operators['=>'].precedence = 20;

  // Member
operators['.'].precedence = 19;
operators['['].precedence = 19;

  // Logical not
operators['!'].precedence = 16;
operators['!!'].precedence = 16; // explicit double-negative

  // Prefix inc/dec
operators['++'].precedence = 16;
operators['--'].precedence = 16;

  // mul/div/remainder
operators['%'].precedence = 14;
operators['*'].precedence = 14;
operators['/'].precedence = 14;

  // add/sub
operators['+'].precedence = 13;
operators['-'].precedence = 13;

  // bitwise
operators['|'].precedence = 12;
operators['^'].precedence = 11;
operators['&'].precedence = 10;

  // comparison
operators['<'].precedence = 11;
operators['<='].precedence = 11;
operators['>'].precedence = 11;
operators['>='].precedence = 11;

  // operators['in'].precedence = 8;
  // operators['instanceof'].precedence = 8;
  // equality
operators['=='].precedence = 10;
operators['!='].precedence = 10;
operators['==='].precedence = 10;
operators['!=='].precedence = 10;

  // Fuzzy operators for backwards compat with the "evil twins"
  //    http://stackoverflow.com/questions/359494
operators['~=='].precedence = 10;
operators['~!='].precedence = 10;

  // logic
operators['&&'].precedence = 6;
operators['||'].precedence = 5;

  // Conditional/ternary
operators['?'].precedence = 4;

  // Call a function
operators['call'].precedence = 1;



Node.operators = operators;


Node.prototype.get_leaf_value = function (leaf, member_of) {
  if (typeof(leaf) === 'function') {
    // Expressions on observables are nonsensical, so we unwrap any
    // function values (e.g. identifiers).
    return unwrap(leaf());
  }

  // primitives
  if (typeof(leaf) !== 'object') {
    return member_of ? member_of[leaf] : leaf;
  }

  if (leaf === null) { return leaf; }

  // Identifiers and Expressions
  if (leaf[Node.isExpressionOrIdentifierSymbol]) {
    // lhs is passed in as the parent of the leaf. It will be defined in
    // cases like a.b.c as 'a' for 'b' then as 'b' for 'c'.
    return unwrap(leaf.get_value(member_of));
  }

  if (leaf instanceof Node) {
    return leaf.get_node_value(member_of);
  }

  // Plain object/class.
  return leaf;
  // throw new Error("Invalid type of leaf node: " + leaf);
};

/**
 * Return a function that calculates and returns an expression's value
 * when called.
 * @param  {array} ops  The operations to perform
 * @return {function}   The function that calculates the expression.
 *
 * Note that for a lambda, we do not evaluate the RHS expression until
 * the lambda is called.
 */
Node.prototype.get_node_value = function () {
  var node = this;

  if (node.op === LAMBDA) {
    return function () { return node.get_leaf_value(node.rhs); };
  }

  return node.op(node.get_leaf_value(node.lhs),
                 node.get_leaf_value(node.rhs));
};


//
// Class variables.
//
Node.isExpressionOrIdentifierSymbol = createSymbolOrString("isExpressionOrIdentifierSymbol");


Node.value_of = function value_of(item) {
  if (item && item[Node.isExpressionOrIdentifierSymbol]) {
    return item.get_value();
  }
  return item;
};


/**
*  Convert an array of nodes to an executable tree.
*  @return {object} An object with a `lhs`, `rhs` and `op` key, corresponding
*                      to the left hand side, right hand side, and
*                      operation function.
*/
Node.create_root = function create_root(nodes) {
  var root, leaf, op, value;

  // Prime the leaf = root node.
  leaf = root = new Node(nodes.shift(), nodes.shift(), nodes.shift());

  while (nodes) {
    op = nodes.shift();
    value = nodes.shift();
    if (!op) {
      break;
    }
    if (op.precedence < root.op.precedence) {
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
};