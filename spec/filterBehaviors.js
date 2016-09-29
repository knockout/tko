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


describe("filters", function () {
  var instance, Parser

  beforeEach(function () {
    instance = new Provider();
    Parser = instance.Parser;
  })

  options.filters.uppercase = function (v) {
    return v.toUpperCase();
  }

  options.filters.tail = function (v, str) {
    return v + (str || "tail");
  }

  function trial(context, binding, expect) {
    var p = new Parser(null, context).parse("b: " + binding)
    assert.equal(p.b(), expect)
  }

  it("converts basic input", function () {
    trial({v: "t"}, "v | uppercase", "T")
  })

  it("chains input", function () {
    trial({v: "t"}, "v | uppercase | tail", "Ttail")
  })

  it("passes arguments", function () {
    trial({ v: "t" }, "v|tail:'XOO'", "tXOO")
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
})
