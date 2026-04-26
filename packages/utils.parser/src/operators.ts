import { unwrap } from '@tko/observable'
import { defineOption } from '@tko/utils'

export function LAMBDA() {}

/**
 * @ operator - recursively call the identifier if it's a function
 * @param  {operand} a ignored
 * @param  {operand} b The variable to be called (if a function) and unwrapped
 * @return {value}   The result.
 */
function unwrapOrCall(a, b) {
  while (typeof b === 'function') {
    b = b()
  }
  return b
}

export type OperatorFunction = (a: any, b: any, ...args: any[]) => any

export interface OperatorWithProperties extends OperatorFunction {
  earlyOut?: (a: any) => any
  precedence?: number
}

export interface Operators {
  [key: string]: OperatorWithProperties
}
function looseEqual(a, b) {
  return a == b
}
looseEqual.precedence = 8

function looseNotEqual(a, b) {
  return a != b
}
looseNotEqual.precedence = 8

function strictEqual(a, b) {
  return a === b
}
strictEqual.precedence = 8

function strictNotEqual(a, b) {
  return a !== b
}
strictNotEqual.precedence = 8

const operators: Operators = {
  // unary
  '@': unwrapOrCall,
  '#': (a, b) => () => unwrap(b), // Convert to read-only.
  '=>': LAMBDA,
  '!': function not(a, b) {
    return !b
  },
  '!!': function notnot(a, b) {
    return !!b
  },
  '++': function preinc(a, b) {
    return ++b
  },
  '--': function preinc(a, b) {
    return --b
  },
  // exponent
  '**': function exp(a, b) {
    return a ** b
  },
  // mul/div
  '*': function mul(a, b) {
    return a * b
  },
  '/': function div(a, b) {
    return a / b
  },
  '%': function mod(a, b) {
    return a % b
  },
  // sub/add
  '+': function add(a, b) {
    return a + b
  },
  '-': function sub(a, b) {
    return (a || 0) - (b || 0)
  },
  '&-': function neg(a, b) {
    return -1 * b
  }, // unary -
  // relational
  '<': function lt(a, b) {
    return a < b
  },
  '<=': function le(a, b) {
    return a <= b
  },
  '>': function gt(a, b) {
    return a > b
  },
  '>=': function ge(a, b) {
    return a >= b
  },
  //    TODO: 'in': function (a, b) { return a in b; },
  //    TODO: 'instanceof': function (a, b) { return a instanceof b; },
  //    TODO: 'typeof': function (a, b) { return typeof b; },
  // equality — default loose; set options.strictEquality = true for === behavior
  '==': looseEqual,
  '!=': looseNotEqual,
  '===': strictEqual,
  '!==': strictNotEqual,
  // bitwise
  '&': function bitAnd(a, b) {
    return a & b
  },
  '^': function xor(a, b) {
    return a ^ b
  },
  '|': function bitOr(a, b) {
    return a | b
  },
  // logic
  '&&': function logicAnd(a, b) {
    return a && b
  },
  '||': function logicOr(a, b) {
    return a || b
  },
  '??': function nullishCoalesce(a, b) {
    return a ?? b
  },
  // Access
  '.': function member(a, b) {
    return a?.[b]
  },
  '?.': function omember(a, b) {
    return a?.[b]
  },
  '[': function bmember(a, b) {
    return a?.[b]
  },
  ',': function comma(a, b) {
    return b
  },
  // conditional/ternary
  // '?': ternary See Node.js
  // Function-Call
  call: function callOp(a, b) {
    return a.apply(null, b)
  }
}

/* Order of precedence from:
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence#Table
*/

// Our operator - unwrap/call
operators['@'].precedence = 21
operators['#'].precedence = 21

// Member access and call
operators['.'].precedence = 17
operators['['].precedence = 17
operators['?.'].precedence = 17

// Prefix operators
operators['!'].precedence = 14
operators['!!'].precedence = 14 // explicit double-negative

// Prefix inc/dec
operators['++'].precedence = 14
operators['--'].precedence = 14
operators['&-'].precedence = 14

// Exponentiation
operators['**'].precedence = 13

// Multiplicative
operators['%'].precedence = 12
operators['*'].precedence = 12
operators['/'].precedence = 12

// Additive
operators['+'].precedence = 11
operators['-'].precedence = 11

// Relational
operators['<'].precedence = 9
operators['<='].precedence = 9
operators['>'].precedence = 9
operators['>='].precedence = 9

// operators['in'].precedence = 9;
// operators['instanceof'].precedence = 9;

// Equality
operators['=='].precedence = 8
operators['!='].precedence = 8
operators['==='].precedence = 8
operators['!=='].precedence = 8

// Bitwise AND
operators['&'].precedence = 7

// Bitwise XOR
operators['^'].precedence = 6

// Bitwise OR
operators['|'].precedence = 5

// Logical AND
operators['&&'].precedence = 4

// Logical OR / Nullish coalescing
operators['||'].precedence = 3
operators['??'].precedence = 3

operators['&&'].earlyOut = a => !a
operators['||'].earlyOut = a => a
operators['??'].earlyOut = a => a !== null && a !== undefined

// Assignment and miscellaneous (lamda)
operators['=>'].precedence = 2

// Comma, multiple values
operators[','].precedence = 1

// Call a function
operators['call'].precedence = 1

// Extend the Options type so ko.options.strictEquality is strongly typed
declare module '@tko/utils' {
  interface Options {
    strictEquality: boolean
  }
}

/** Register strictEquality as a configurable option on ko.options */
defineOption('strictEquality', {
  default: false,
  set(strict: boolean) {
    operators['=='] = strict ? strictEqual : looseEqual
    operators['!='] = strict ? strictNotEqual : looseNotEqual
  }
})

export { operators as default }
