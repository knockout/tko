
import {
  unwrap
} from '@tko/observable'

import {
  default as operators,
  LAMBDA
} from './operators'

const IS_EXPR_OR_IDENT = Symbol('Node - Is Expression Or Identifier')

export default class Node {
  lhs: any
  op: any
  rhs: any


  constructor (lhs, op, rhs) {
    this.lhs = lhs
    this.op = op
    this.rhs = rhs
  }

  static get operators () { return operators }

  get_leaf_value (leaf, context, globals, node) {
    if (typeof leaf === 'function') {
      // Expressions on observables are nonsensical, so we unwrap any
      // function values (e.g. identifiers).
      return unwrap(leaf())
    }

    // primitives
    if (typeof leaf !== 'object' || leaf === null) { return leaf }

    // Identifiers and Expressions
    if (leaf[Node.isExpressionOrIdentifierSymbol]) {
      // lhs is passed in as the parent of the leaf. It will be defined in
      // cases like a.b.c as 'a' for 'b' then as 'b' for 'c'.
      return unwrap(leaf.get_value(undefined, context, globals, node))
    }

    // Plain object/class.
    return leaf
  }

  /**
   * Return a function that calculates and returns an expression's value
   * when called.
   * @param  {array} ops  The operations to perform
   * @return {function}   The function that calculates the expression.
   *
   * Note that for a lambda, we do not evaluate the RHS expression until
   * the lambda is called.
   */
  get_value (notused, context, globals, node: Node ) {
    var node:Node = this ;

    if (node.op === LAMBDA) {
      return (...args) => {
        let lambdaContext = context
        if (node.lhs) {
          lambdaContext = node.lhs.extendContext(context, args)
        }
        return node.get_leaf_value(node.rhs, lambdaContext, globals, node)
      }
    }

    const lhv = node.get_leaf_value(node.lhs, context, globals, node)
    const earlyOut = node.op.earlyOut

    if (earlyOut && earlyOut(lhv)) { return lhv }
    const rhv = node.get_leaf_value(node.rhs, context, globals, node)

    return node.op(lhv, rhv, context, globals)
  }

  //
  // Class variables.
  //
  static get isExpressionOrIdentifierSymbol () { return IS_EXPR_OR_IDENT }
  get [IS_EXPR_OR_IDENT] () { return true }

  static value_of (item, context?, globals?, node? : Node) {
    if (item && item[Node.isExpressionOrIdentifierSymbol]) {
      return item.get_value(item, context, globals, node)
    }
    return item
  }

  /**
  *  Convert an array of nodes to an executable tree.
  *  @return {object} An object with a `lhs`, `rhs` and `op` key, corresponding
  *                      to the left hand side, right hand side, and
  *                      operation function.
  */
  static create_root (nodes, debug=false) {
    // shunting yard algorithm with output to an abstact syntax tree of Nodes
    const out = new Array()
    const ops = new Array()
    for (let i = 0; i < nodes.length; i += 2) {
      out.push(nodes[i]) // next value
      const op = nodes[i+1]

      // only left-associative operators are currently defined and handled here
      const prec = op?.precedence || 0 // no op for last value
      while (ops.length && prec <= ops[ops.length-1].precedence) {
        const rhs = out.pop()
        const lhs = out.pop()
        out.push(new Node(lhs, ops.pop(), rhs))
      }
      ops.push(op)
    }
    if (out.length !== 1) {
      throw new Error(`unexpected nodes remain in shunting yard output stack: ${out}`)
    }
    return out[0]
  }
}

/**
 * Because of cyclical dependencies on operators <-> Node <-> value_of,
 * we need to patch this in here.
 */
operators['?'] = function ternary (a, b, context, globals, node) {
  return Node.value_of(a ? b.yes : b.no, context, globals, node)
}
operators['?'].precedence = 4
