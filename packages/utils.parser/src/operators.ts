import {
  unwrap
} from '@tko/observable'

export function LAMBDA () {}

/**
 * @ operator - recursively call the identifier if it's a function
 * @param  {operand} a ignored
 * @param  {operand} b The variable to be called (if a function) and unwrapped
 * @return {value}   The result.
 */
function unwrapOrCall (a, b) {
  while (typeof b === 'function') { b = b() }
  return b
}

const operators = {
  // unary
  '@': unwrapOrCall,
  '#': (a, b) => () => unwrap(b), // Convert to read-only.
  '=>': LAMBDA,
  '!': function not (a, b) { return !b },
  '!!': function notnot (a, b) { return !!b },
  '++': function preinc (a, b) { return ++b },
  '--': function preinc (a, b) { return --b },
  // mul/div
  '*': function mul (a, b) { return a * b },
  '/': function div (a, b) { return a / b },
  '%': function mod (a, b) { return a % b },
  // sub/add
  '+': function add (a, b) { return a + b },
  '-': function sub (a, b) { return (a || 0) - (b || 0) },
  '&-': function neg (a, b) { return -1 * b },
  // relational
  '<': function lt (a, b) { return a < b },
  '<=': function le (a, b) { return a <= b },
  '>': function gt (a, b) { return a > b },
  '>=': function ge (a, b) { return a >= b },
  //    TODO: 'in': function (a, b) { return a in b; },
  //    TODO: 'instanceof': function (a, b) { return a instanceof b; },
  // equality
  '==': function equal (a, b) { return a === b },
  '!=': function ne (a, b) { return a !== b },
  '===': function sequal (a, b) { return a === b },
  '!==': function sne (a, b) { return a !== b },
  // bitwise
  '&': function bitAnd (a, b) { return a & b },
  '^': function xor (a, b) { return a ^ b },
  '|': function bitOr (a, b) { return a | b },
  // logic
  '&&': function logicAnd (a, b) { return a && b },
  '||': function logicOr (a, b) { return a || b },
  // Access
  '.': function member (a, b) { return a[b] },
  '[': function member (a, b) { return a[b] },
  ',': function comma (a, b) { return b },
  // conditional/ternary
  // '?': ternary See Node.js
  // Function-Call
  'call': function callOp (a, b) { return a.apply(null, b) }
}

/* Order of precedence from:
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence#Table
*/

  // Our operator - unwrap/call
operators['@'].precedence = 21
operators['#'].precedence = 21

  // lambda
operators['=>'].precedence = 20

  // Member
operators['.'].precedence = 19
operators['['].precedence = 19

  // Logical not
operators['!'].precedence = 16
operators['!!'].precedence = 16 // explicit double-negative

  // Prefix inc/dec
operators['++'].precedence = 16
operators['--'].precedence = 16
operators['&-'].precedence = 16

  // mul/div/remainder
operators['%'].precedence = 14
operators['*'].precedence = 14
operators['/'].precedence = 14

  // add/sub
operators['+'].precedence = 13
operators['-'].precedence = 13

  // bitwise
operators['|'].precedence = 12
operators['^'].precedence = 11
operators['&'].precedence = 10

  // comparison
operators['<'].precedence = 11
operators['<='].precedence = 11
operators['>'].precedence = 11
operators['>='].precedence = 11

  // operators['in'].precedence = 8;
  // operators['instanceof'].precedence = 8;
  // equality
operators['=='].precedence = 10
operators['!='].precedence = 10
operators['==='].precedence = 10
operators['!=='].precedence = 10

  // logic
operators['&&'].precedence = 6
operators['||'].precedence = 5

operators['&&'].earlyOut = (a) => !a
operators['||'].earlyOut = (a) => a

  // multiple values
operators[','].precedence = 1

  // Call a function
operators['call'].precedence = 1

export { operators as default }
