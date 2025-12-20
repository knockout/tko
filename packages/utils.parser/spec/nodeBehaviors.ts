/* eslint semi: 0 */

import {
  observable
} from '@tko/observable';

import {
  Parser, Node, Arguments, Identifier, Ternary
} from '../dist';

import {assert} from "chai"

let op = Node.operators
let operators = Node.operators
let nodes_to_tree

function ctxStub (ctx?) {
  return { lookup (v) { return ctx ? ctx[v] : null } }
}

beforeEach(function () {
  nodes_to_tree = Node.create_root;
})

describe('Operators', function () {
  function test (nodes, val, name?) {
    assert.strictEqual(Node.create_root(nodes).get_value(), val, name);
  }

  it('does simple arithmetic', function () {
    test([1, op['+'], 1], 2);
    test([1, op['+'], 1, op['*'], 3], 4);
    test([2, op['*'], 1, op['+'], 3], 5);
    test([2, op['*'], 2, op['*'], 3], 12);
  });

  it('performs binary logic', function () {
    test([true, op['&&'], true], true);
    test([true, op['&&'], false], false);
    test([false, op['&&'], true], false);
    test([false, op['&&'], false], false);
    test([true, op['||'], true], true);
    test([true, op['||'], false], true);
    test([false, op['||'], true], true);
    test([false, op['||'], false], false);
  })

  it('performs ?? nullish coalesce', () => {
    test([false, op['??'], true], false);
    test([true, op['??'], false], true);
    test([undefined, op['??'], true], true);
    test([null, op['??'], false], false);
  })

  it('performs ?. optional chaining', () => { 
    test([{}, op['?.'], 'a'], undefined);
    test([null, op['?.'], 'a'], undefined);
    test([{ a: 1 }, op['?.'], 'a'], 1);
    test([{ a: 'b' }, op['?.'], 'a'], 'b');
  })

  it('mixes binary logic and simple arithemtic', function () {
    test([0, op['||'], 1, op['+'], 2], 3, 'a');
    test([0, op['&&'], 1, op['+'], 2], 0, 'b');
    test([0, op['&&'], 0, op['+'], 2], 0, 'c');
    test([1, op['&&'], 2, op['+'], 2], 4, 'd');

    test([0, op['+'], 1, op['||'], 2], 1, 'e');
    test([1, op['+'], 0, op['&&'], 2], 2, 'f');
    test([0, op['+'], 0, op['&&'], 2], 0, 'g');
    test([1, op['+'], 2, op['&&'], 2], 2, 'h');
  })

  it('mixes (in)equality and binary logic', function () {
    test([0, op['||'], 0, op['!=='], 2], true, 'a');
    test([1, op['||'], 0, op['!=='], 2], 1, 'b');
    test([0, op['&&'], 1, op['!=='], 2], 0, 'c');
    test([0, op['&&'], 0, op['!=='], 2], 0, 'c2');

    test([0, op['!=='], 1, op['||'], 2], true, 'd');
    test([0, op['!=='], 1, op['||'], 0], true, 'e');
    test([0, op['!=='], 0, op['||'], 0], 0, 'f');
    test([0, op['!=='], 0, op['||'], 1], 1, 'g');
  })

  it('early outs from or- operator computations', function () {
    // It's common to e.g. have `if: $data && $data.thing`, but that'll error with
    // `cannot read property '$data' of undefined` unless we early-out.
    let fakeContext = { lookup: function () {} }
    let root = Node.create_root([123, op['||'], new Identifier(null, 'z', ['q'])])
    assert.equal(root.get_value(null, fakeContext), 123)
  })

  it('early outs from and- operator computations', function () {
    let fakeContext = { lookup: function () {} }
    let root = Node.create_root([false, op['&&'], new Identifier(null, 'z', ['q'])])
    assert.equal(root.get_value(null, fakeContext), false)
  })
});

describe('the create_root function', function () {
  it('converts a simple array to a tree', function () {
    let nodes = ['a', operators['*'], 'b'],
      tree = nodes_to_tree(nodes.slice(0));
    // we use nodes.slice(0) to make a copy.
    assert.equal(tree.lhs, 'a');
    assert.equal(tree.rhs, 'b');
    assert.equal(tree.op, operators['*']);
  })

  it('converts multiple * to a tree', function () {
    // expr: a * b / c
    // sexp: (/ (* a b) c)
    let nodes = ['a', operators['*'], 'b', operators['/'], 'c'],
      tree = nodes_to_tree(nodes.slice(0));
    assert.equal(tree.lhs.lhs, 'a');
    assert.equal(tree.lhs.op, operators['*']);
    assert.equal(tree.lhs.rhs, 'b');
    assert.equal(tree.op, operators['/']);
    assert.equal(tree.rhs, 'c');
  })

  it('converts a complex set as expected', function () {
    // expr: a * b + c * d * e > f + g % h
    // prec:   4   3   4   4   1   3   4   
    // sexp: (> (+ (* a b) (* (* c d) e))
    //          (+ f (% g h)))
    let nodes = [
        'a', operators['*'], 'b',
        operators['+'],
        'c', operators['*'], 'd', operators['*'], 'e',
        operators['>'],
        'f', operators['+'], 'g', operators['%'], 'h'
      ],
      root = nodes_to_tree(nodes.slice(0), true);
    // console.log(JSON.stringify(root, null, 2))
    assert.equal(root.op, operators['>'], '>')

    assert.equal(root.lhs.op, operators['+'], '+')
    assert.equal(root.lhs.lhs.op, operators['*'], '*')
    assert.equal(root.lhs.lhs.lhs, 'a')
    assert.equal(root.lhs.lhs.rhs, 'b')

    assert.equal(root.lhs.rhs.op, operators['*'], '* 2')
    assert.equal(root.lhs.rhs.lhs.op, operators['*'], '* 3')
    assert.equal(root.lhs.rhs.lhs.lhs, 'c')
    assert.equal(root.lhs.rhs.lhs.rhs, 'd')
    assert.equal(root.lhs.rhs.rhs, 'e')

    assert.equal(root.rhs.op, operators['+'], 'rhs +')
    assert.equal(root.rhs.lhs, 'f')

    assert.equal(root.rhs.rhs.op, operators['%'])
    assert.equal(root.rhs.rhs.lhs, 'g')
    assert.equal(root.rhs.rhs.rhs, 'h')
  })

  it('converts a lambda with ternary operator', function () {
    const root = nodes_to_tree([
      undefined, op['=>'],
      -1, op['>'], 0,
      op['?'],
      new Ternary('positive', 'negative')
    ])
    // console.log(JSON.stringify(root, null, 2))
    assert.equal(root.op, op['=>'])
    assert.equal(root.rhs.op, op['?'])
    assert.equal(root.rhs.lhs.op, op['>'])
    assert.equal(root.rhs.rhs.yes, 'positive')
    assert.equal(root.rhs.rhs.no, 'negative')
    assert.equal(root.get_value()(), 'negative')
  })
})

describe('Node', function () {
  it('traverses the tree 19 * -2 + 4', function () {
    let root = new Node();
    root.op = operators['+']
    root.lhs = new Node(19, operators['*'], -2)
    root.rhs = 4
    assert.equal(root.get_value(null, ctxStub()), 19 * -2 + 4)
  })

  it('looks up identifiers', function () {
    let root = new Node(),
      context = ctxStub({ x: 19 }),
      parser = new Parser(),
      ident = new Identifier(parser, 'x');
    root.op = operators['+']
    root.lhs = ident
    root.rhs = 23
    assert.equal(root.get_value(null, context), 23 + 19)
  })

  it('converts function calls (a())', function () {
    let context = ctxStub({ x: observable(0x0F) }),
      parser, nodes, root;
    parser = new Parser(null);
    let fake_args = new Arguments(null, [])
    nodes = [
      // the third argument is the same as _deref_call
      new Identifier(parser, 'x', [fake_args]),
      operators['|'],
      0x80
    ];
    root = nodes_to_tree(nodes.slice(0));

    assert.equal(root.get_value(undefined, context), 0x8F)
  })
})
