/* eslint semi: 0 */

import {
  options
} from 'tko.utils';

import {
  observable
} from 'tko.observable';

import {
  Provider
} from '../index.js';

var instance, Parser;
beforeEach(function () {
  instance = new Provider();
  Parser = instance.Parser;
})

describe("filters", function () {
  options.filters.uppercase = function (v) {
    return v.toUpperCase();
  }

  options.filters.tail = function (v, str, str2) {
    return v + (str || "tail") + (str2 || '');
  }

  function trial(context, binding, expect) {
    var p = new Parser(null, context).parse("b: " + binding)
    assert.equal(p.b(), expect)
  }

  it("converts basic input", function () {
    trial({v: "t"}, "v | uppercase", "T")
  })

  it("chains input with whitespace", function () {
    trial({v: "t"}, "v | uppercase | tail", "Ttail")
  })

  it("chains flush input", function () {
    trial({v: "t"}, "v|uppercase|tail", "Ttail")
  })

  it("passes an argument", function () {
    trial({ v: "t" }, "v|tail:'XOO'", "tXOO")
  })

  it("passes multiple arguments", function () {
    trial({ v: "t" }, "v|tail:'X':'y'", "tXy")
  })

  it("passes a looked value", function () {
    trial({ v: "t" }, "v|tail:v", "tt")
  })

  it("passes an expression", function () {
    trial({ v: "t" }, "v|tail: 1 + 5", "t6")
  })

  it("passes an unwrapped observable", function () {
    trial({ v: observable("te") }, "v|tail:v()", "tete")
    trial({ v: observable("tg") }, "v|tail:@v", "tgtg")
  })

  it("passes a called function", function () {
    trial({ v: function () { return "tf" } }, "@v|tail:@v", "tftf")
  })

  it("modifies expressions", function () {
    trial({ r: 123 }, "`a${r}b` | uppercase", "A123B")
  })

  it("modifies observables", function () {
    trial({r: observable("ee")}, "r | uppercase", "EE")
  })

  it("Does not intefere with expressions", function () {
    trial({}, "(4 | 1)", "5")
  })

  it("multiple variables with filters", function () {
    var p = new Parser(null, {v: "tt"})
      .parse("b: v|tail:'e':'y', c: v|tail:'e':'z'")
    assert.equal(p.b(), "ttey")
    assert.equal(p.c(), "ttez")
  })
})