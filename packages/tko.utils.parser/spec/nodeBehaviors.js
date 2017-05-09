/* eslint semi: 0 */

import {
  observable
} from 'tko.observable';

import {
  Parser, Node, Arguments, Identifier
} from '../index.js';


var op = Node.operators
var operators = Node.operators
var nodes_to_tree


beforeEach(function() {
  nodes_to_tree = Node.create_root;
})


describe("Operators", function () {
  function test(nodes, val, name) {
    assert.equal(Node.create_root(nodes).get_node_value(), val, name);
  }

  it("does simple arithmetic", function () {
    test([1, op['+'], 1], 2);
    test([1, op['+'], 1, op['*'], 3], 4);
    test([2, op['*'], 1, op['+'], 3], 5);
    test([2, op['*'], 2, op['*'], 3], 12);
  });

  it("performs binary logic", function () {
    test([true, op['&&'], true], true);
    test([true, op['&&'], false], false);
    test([false, op['&&'], true], false);
    test([false, op['&&'], false], false);
    test([true, op['||'], true], true);
    test([true, op['||'], false], true);
    test([false, op['||'], true], true);
    test([false, op['||'], false], false);
  })

  it("mixes binary logic and simple arithemtic", function () {
    test([0, op['||'], 1, op['+'], 2], 3, 'a');
    test([0, op['&&'], 1, op['+'], 2], 0, 'b');
    test([0, op['&&'], 0, op['+'], 2], 0, 'c');
    test([1, op['&&'], 2, op['+'], 2], 4, 'd');

    test([0, op['+'], 1, op['||'], 2], 1, 'e');
    test([1, op['+'], 0, op['&&'], 2], 2, 'f');
    test([0, op['+'], 0, op['&&'], 2], 0, 'g');
    test([1, op['+'], 2, op['&&'], 2], 2, 'h');
  })

  it("mixes (in)equality and binary logic", function () {
    test([0, op['||'], 0, op['!=='], 2], true, 'a');
    test([1, op['||'], 0, op['!=='], 2], 1, 'b');
    test([0, op['&&'], 1, op['!=='], 2], false, 'c');
    test([0, op['&&'], 0, op['!=='], 2], 0, 'c2');

    test([0, op['!=='], 1, op['||'], 2], true, 'd');
    test([0, op['!=='], 1, op['||'], 0], true, 'e');
    test([0, op['!=='], 0, op['||'], 0], 0, 'f');
    test([0, op['!=='], 0, op['||'], 1], 1, 'g');
  })

});


describe("the create_root function", function() {

  it("converts a simple array to a tree", function() {
    var nodes = ['a', operators['*'], 'b'],
      tree = nodes_to_tree(nodes.slice(0));
    // we use nodes.slice(0) to make a copy.
    assert.equal(tree.lhs, 'a');
    assert.equal(tree.rhs, 'b');
    assert.equal(tree.op, operators['*']);
  })

  it("converts multiple * to a tree", function() {
    var nodes = ['a', operators['*'], 'b', operators['/'], 'c'],
      tree = nodes_to_tree(nodes.slice(0));
    assert.equal(tree.lhs, 'a');
    assert.equal(tree.op, operators['*']);
    assert.equal(tree.rhs.lhs, 'b');
    assert.equal(tree.rhs.op, operators['/']);
    assert.equal(tree.rhs.rhs, 'c');
  })

  it("converts a complex set as expected", function() {
    var nodes = [
        'a', operators['*'], 'b',
        operators['+'],
        'c', operators['*'], 'd', operators['*'], 'e',
        operators['>'],
        'f', operators['+'], 'g', operators['%'], 'h'
      ],
      root = nodes_to_tree(nodes.slice(0));
    assert.equal(root.op, operators['>'], '>')

    assert.equal(root.lhs.op, operators['+'], '+')
    assert.equal(root.lhs.lhs.op, operators['*'], '*')
    assert.equal(root.lhs.lhs.lhs, 'a')
    assert.equal(root.lhs.lhs.rhs, 'b')

    assert.equal(root.lhs.rhs.op, operators['*'], '*')
    assert.equal(root.lhs.rhs.lhs, 'c')
    assert.equal(root.lhs.rhs.rhs.lhs, 'd')
    assert.equal(root.lhs.rhs.rhs.rhs, 'e')

    assert.equal(root.rhs.op, operators['+'], 'rhs +')
    assert.equal(root.rhs.lhs, 'f')

    assert.equal(root.rhs.rhs.op, operators['%'])
    assert.equal(root.rhs.rhs.lhs, 'g')
    assert.equal(root.rhs.rhs.rhs, 'h')
  })
})




describe("Node", function() {

  it("traverses the tree 19 * -2 + 4", function() {
    var root = new Node();
    root.op = operators['+']
    root.lhs = new Node(19, operators['*'], -2)
    root.rhs = 4
    assert.equal(root.get_node_value(), 19 * -2 + 4)
  })

  it("looks up identifiers", function() {
    var root = new Node(),
      context = { x: 19 },
      parser = new Parser(null, context),
      ident = new Identifier(parser, 'x');
    root.op = operators['+']
    root.lhs = ident
    root.rhs = 23
    assert.equal(root.get_node_value(), 23 + 19)
  })


  it("converts function calls (a())", function() {
    var context = {
        x: observable(0x0F)
      },
      parser, nodes, root;
    parser = new Parser(null, context);
    var fake_args = new Arguments(null, [])
    nodes = [
      // the third argument is the same as _deref_call
      new Identifier(parser, 'x', [fake_args]),
      operators['|'],
      0x80
    ];
    root = nodes_to_tree(nodes.slice(0));

    assert.equal(root.get_node_value(), 0x8F)
  })
})
