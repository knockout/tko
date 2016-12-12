/* eslint semi: 0 */

import {
  options
} from 'tko.utils';

import {
  observable,
  unwrap,
  isObservable
} from 'tko.observable';

import {
  applyBindings
} from 'tko.bind';

import {
  Provider
} from '../index.js';

import {
  bindings as coreBindings
} from 'tko.binding.core';


var instance, Parser;


beforeEach(function () {
  instance = new Provider();
  Parser = instance.Parser;
})


describe("the bindings parser", function() {
  it("parses bindings with JSON values", function() {
    var binding_string = 'a: "A", b: 1, c: 2.1, d: ["X", "Y"], e: {"R": "V"}, t: true, f: false, n: null',
      value = new Parser(null, {}).parse(binding_string);
    assert.equal(value.a(), "A", "string");
    assert.equal(value.b(), 1, "int");
    assert.equal(value.c(), 2.1, "float");
    assert.deepEqual(value.d(), ["X", "Y"], "array");
    assert.deepEqual(value.e(), {
      "R": "V"
    }, "object");
    assert.equal(value.t(), true, "true");
    assert.equal(value.f(), false, "false");
    assert.equal(value.n(), null, "null");
  })

  it("parses an array of JSON values", function() {
    var binding = "x: [1, 2.1, true, false, null, undefined]",
      bindings = new Parser(null, {}).parse(
        binding);
    assert.deepEqual(bindings.x(), [1, 2.1, true, false, null, undefined])
  })

  it("undefined keyword works", function() {
    var value = new Parser(null, {}).parse(
      "y: undefined");
    assert.equal(value.y(), void 0);
  })

  it("parses single-quote strings", function() {
    var binding = "text: 'st\\'r'",
      bindings = new Parser(null, {}).parse(binding);
    assert.equal(bindings.text(), "st'r")
  })

  it("parses bare `text` as `text: null`", function() {
    var binding = "text",
      bindings = new Parser(null, {}).parse(binding);
    assert.deepEqual(bindings.text(), null)
  })

  it('parses `text: "alpha"`', function() {
    var binding = 'text: "alpha"',
      bindings = new Parser(null, {}).parse(binding);
    assert.deepEqual(bindings.text(), 'alpha')
  })

  it("parses `a: 'a', b, c: 'c'` => ..., b: null, ...", function() {
    var binding = "a: 'a', b, c: 'c'",
      bindings = new Parser(null, {}).parse(binding);
    assert.deepEqual(bindings.a(), 'a')
    assert.deepEqual(bindings.b(), null)
    assert.deepEqual(bindings.c(), 'c')
  })

  it("parses text: {object: 'string'}", function() {
    var binding = "text: {object: 'string'}",
      bindings = new Parser(null, {}).parse(binding);
    assert.deepEqual(bindings.text(), {
      object: "string"
    })
  })

  it("parses object: attr: {name: value}", function() {
    var binding = "attr: { klass: kValue }",
      context = {
        kValue: 'Sam'
      },
      bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.attr().klass, 'Sam')
  })

  it("parses object: attr: {name: observable(value)}", function() {
    var binding = "attr : { klass: kValue }",
      context = {
        kValue: observable('Gollum')
      },
      bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.attr().klass(), 'Gollum')
  })

  it("parses object: attr: {n1: v1, n2: v2}", function() {
    var binding = "attr : { a: x, b: y }",
      context = {
        x: 'Real',
        y: 'Imaginary'
      },
      bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.attr().a, 'Real')
    assert.equal(bindings.attr().b, 'Imaginary')
  })

  it("parses compound operator d()[0]()", function() {
    var binding = "attr: d()[0]()",
      d = function() {
        return [function() {
          return 'z'
        }]
      },
      context = {
        d: d
      },
      bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.attr(), 'z')
  })

  it("parses string+var+string", function() {
    // re issue #27
    var binding = "text: 'prefix'+name+'postfix'",
      context = {
        name: observable('mike')
      },
      bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.text(), 'prefixmikepostfix')
  })

  it('parses object literals with C++ style comments', function() {
    // From https://github.com/knockout/knockout/issues/1524
    var binding = "model: v, //wiring the router\n" +
      "afterCompose: 'ac', //wiring the router\n" +
      "//transition:'entrance', //use the 'entrance' transition when switching views\n" +
      "skipTransitionOnSameViewId: true,//Transition entrance is disabled for better perfomance\n" +
      "cacheViews:true //telling composition to keep views in the dom, and reuse them (only a good idea with singleton view models)\n",
      context = { v: observable('rx') },
      bindings = new Parser(null, context).parse(binding);

    assert.equal(unwrap(bindings.model()), 'rx')
    assert.equal(bindings.afterCompose(), 'ac')
    assert.equal(bindings.transition, undefined)
    assert.equal(bindings.skipTransitionOnSameViewId(), true)
    assert.equal(bindings.cacheViews(), true)
  });

  it('parses object literals with C style comments', function() {
    var binding = "a: xxx, /* First comment */\n" +
      "b: 'yyy', /* Comment that comments-out the next whole next line\n" +
      "x: 'nothing', //this is also skipped */\n" +
      "c: 'zzz', /***Comment with extra * at various parts****/\n" +
      "d: /**/'empty comment'",
      context = { xxx: observable('rex') },
      bindings = new Parser(null, context).parse(binding);

    assert.equal(unwrap(bindings.a()), 'rex')
    assert.equal(bindings.b(), 'yyy')
    assert.equal(bindings.x, undefined)
    assert.equal(bindings.c(), 'zzz')
    assert.equal(bindings.d(), 'empty comment')
  });

})

describe("the parsing of expressions", function() {
  it("works with explicit braces ( )", function() {
    var binding = "attr : (x)",
      context = {
        x: 'spot'
      },
      bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.attr(), 'spot')
  })

  it("computes a + b", function() {
    var binding = "text: a + b",
      context = {
        a: 1,
        b: 2
      },
      bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.text(), 3);
  })

  it("computes obs(a) + obs(b)", function() {
    var binding = "text: a + b",
      context = {
        a: observable(1),
        b: observable(2)
      },
      bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.text(), 3);
  })

  it("computes a + b * c", function() {
    var binding = "text: a + b * c",
      context = {
        a: 1,
        b: 2,
        c: 4
      },
      bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.text(), 1 + 2 * 4);
  })

  it("compares a + 3 > b * obs(c)", function() {
    var binding = "text: a + 3 > b * c",
      context = {
        a: 1,
        b: 2,
        c: observable(4)
      },
      bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.text(), 1 + 3 > 2 * 4);
  })

  it("respects brackets () precedence", function() {
    var binding = "text: 2 * (3 + 4)",
      bindings = new Parser(null, {}).parse(binding);
    assert.equal(bindings.text(), 2 * (3 + 4))

  })

  it("computes complex arithematic as expected", function() {
    var binding = "text: 1 * 4 % 3 + 11 * 99 / (8 - 14)",
      bindings = new Parser(null, {}).parse(binding);
    assert.equal(bindings.text(), 1 * 4 % 3 + 11 * 99 / (8 - 14));
    // == -180.5
  })

  it("recalculates observables", function() {
    var binding = "text: a - b",
      context = {
        a: observable(1),
        b: observable(2)
      },
      bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.text(), -1);
    context.a(2)
    assert.equal(bindings.text(), 0);
  })

  it("sets properties of objects", function() {
    var binding = "text: { x: 3 < 1, y: a < b }",
      context = {
        a: observable(1),
        b: observable(2)
      },
      bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.text().x, false);
    assert.equal(bindings.text().y, true);
    context.a(3)
    assert.equal(bindings.text().y, false);
  })

  it("has working logic operations", function() {
    var binding = "text: a || b",
      context = {
        a: observable(false),
        b: observable(false)
      },
      bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.text(), false);
    context.a(true)
    assert.equal(bindings.text(), true);
    context.a(false)
    assert.equal(bindings.text(), false);
    context.b(true)
    assert.equal(bindings.text(), true);
  })

  it("does not unwrap a single observable argument", function() {
    var binding = "text: a",
      context = {
        a: observable()
      },
      bindings = new Parser(null, context).parse(binding);
    assert.ok(isObservable(bindings.text()))
  })

  it("parses a string of functions a().b()", function() {
    var binding = "ref: a().b()",
      b = function() {
        return 'Cee'
      },
      a = function() {
        return {
          b: b
        }
      },
      context = {
        a: a
      },
      bindings = new Parser(null, context).parse(binding);
    assert.ok(bindings.ref(), 'Cee')
  })
})

describe("unary operations", function() {
  it("include the negation operator", function() {
    var binding = "neg: !a",
      context = {
        a: observable(false)
      },
      bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.neg(), true)
    context.a(true);
    assert.equal(bindings.neg(), false)
  });

  it("does the double negative", function() {
    var binding = "neg: !!a",
      context = {
        a: observable(false)
      },
      bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.neg(), false)
    context.a(true);
    assert.equal(bindings.neg(), true)
  });

  it("works in an object", function() {
    var binding = "neg: { x: !a, y: !!a }",
      context = {
        a: observable(false)
      },
      bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.neg().x, true)
    assert.equal(bindings.neg().y, false)
    context.a(true);
    assert.equal(bindings.neg().x, false)
    assert.equal(bindings.neg().y, true)
  })

  it("prefix increments observable on lookup", function () {
    var binding = "neg: ++a",
      context = {
        a: observable(4)
      },
      bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.neg(), 5)
    context.a(3);
    assert.equal(bindings.neg(), 4)
  })

  it("prefix increments object property on lookup", function () {
    var binding = "neg: ++a",
      context = {
        a: 5
      },
      bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.neg(), 6)
    context.a = 2;
    assert.equal(bindings.neg(), 3)
  })

  it.skip("negates an expression eg !(a || b)"
    /*, function () {
            var binding = 'ne: !(a || b)',
                context = { a: observable(true), b: observable(false) },
                bindings = new Parser(null, context).parse(binding);
            assert.equal(bindings.ne(), false)
            context.a(false)
            assert.equal(bindings.ne(), true)
        }*/
  )

  describe("lambdas (=>)", function () {
    it("evaluates the expression when called", function() {
      var binding = "x: => y(true)",
        context = { y: observable() },
        bindings = new Parser(null, context).parse(binding);
      assert.equal(context.y(), undefined)
      bindings.x()()
      assert.equal(context.y(), true)
    })

    it.skip("evaluates the lambda in canonical '() =>' form", function() {
      // FIXME
      var binding = "x: () => y(true)",
        context = { y: observable() },
        bindings = new Parser(null, context).parse(binding);
      assert.equal(context.y(), undefined)
      bindings.x()()
      assert.equal(context.y(), true)
    })

    it("calls a function with arguments", function() {
      var binding = "x: => yfn(146)",
        obs = observable(),
        context = { yfn: function(n) { obs(n) } },
        bindings = new Parser(null, context).parse(binding);
      assert.equal(obs(), undefined)
      bindings.x() // does not evaluate on lookup
      assert.equal(obs(), undefined)
      bindings.x()()
      assert.equal(obs(), 146)
    })
  })

  describe("@ lookup/unwrap", function () {
    it("unwraps an observable", function () {
      var binding = 'x: @obs',
        context = { obs: observable(129) },
        bindings = new Parser(null, context).parse(binding);
      assert.equal(bindings.x(), 129)
    })

    it("calls a function", function () {
      var binding = 'x: @fn',
        context = { fn: function () { return 122 } },
        bindings = new Parser(null, context).parse(binding);
      assert.equal(bindings.x(), 122)
    })

    it("returns a static item", function () {
      var binding = 'x: @"123", y: @1245, z: @null, q: @undefined, p:@`rz${1}x`',
        bindings = new Parser(null, {}).parse(binding);
      assert.equal(bindings.x(), "123")
      assert.equal(bindings.y(), 1245)
      assert.equal(bindings.z(), null)
      assert.equal(bindings.q(), undefined)
      assert.equal(bindings.p(), "rz1x")
    })

    it("parses the textInterpolation attribute markup", function() {
      var binding = '\'attr.title\':""+"hello "+@"name"+"!"',
        bindings = new Parser(null, {}).parse(binding);
      assert.equal(bindings['attr']().title, "hello name!")
    })

    it("unwraps after a function is called", function () {
      var binding = 'x: "a" + @ fn() + "b"',
        context = { fn: function () { return observable('14x') } },
        bindings = new Parser(null, context).parse(binding);
      assert.equal(bindings.x(), 'a14xb')
    })
  })

  describe("Ternary prop ? then : else", function () {
    it("computes a ? b : c", function () {
      var binding = "x: a ? 6 : 42",
        obs = observable(false),
        context = { a: obs },
        bindings = new Parser(null, context).parse(binding);
      assert.equal(bindings.x(), 42)
      obs(true)
      assert.equal(bindings.x(), 6)
      obs(false)
      assert.equal(bindings.x(), 42)
    })

    it("computes nested a ? b ? c : d : e", function () {
      var binding = "x: a ? b ? 'c' : 'd' : 'e'",
        a = observable(false),
        b = observable(false),
        context = { a: a, b: b },
        bindings = new Parser(null, context).parse(binding);
      assert.equal(bindings.x(), a() ? b() ? 'c' : 'd' : 'e', '-')
      a(true)
      assert.equal(bindings.x(), a() ? b() ? 'c' : 'd' : 'e', 'a')
      b(true)
      assert.equal(bindings.x(), a() ? b() ? 'c' : 'd' : 'e', 'ab')
      a(false)
      assert.equal(bindings.x(), a() ? b() ? 'c' : 'd' : 'e', 'b')
    })

    it("computes nested a ? b : c ? d : e", function () {
      var binding = "x: a ? 'b' : c ? 'd' : 'e'",
        a = observable(false),
        c = observable(false),
        context = { a: a, c: c },
        bindings = new Parser(null, context).parse(binding);
      assert.equal(bindings.x(), a() ? 'b' : c() ? 'd' : 'e', '-')
      a(true)
      assert.equal(bindings.x(), a() ? 'b' : c() ? 'd' : 'e', 'a')
      c(true)
      assert.equal(bindings.x(), a() ? 'b' : c() ? 'd' : 'e', 'ac')
      a(false)
      assert.equal(bindings.x(), a() ? 'b' : c() ? 'd' : 'e', 'c')
    })

    it("computes a ? 1 + 1 : 2 + 2", function () {
      var binding = "x: a ? 1+1 : 2+2",
        context = { a: observable(false) },
        bindings = new Parser(null, context).parse(binding);
      assert.equal(bindings.x(), 4);
      context.a(true);
      assert.equal(bindings.x(), 2);
    })

    it("computes unwrapped elements first", function () {
      var binding = "x: 'string' + @(a() ? 'a' : '!a')",
        obs = observable(true),
        context = { a: function () { return obs() } },
        bindings = new Parser(null, context).parse(binding);
      assert.equal(bindings.x(), 'stringa');
      obs(false);
      assert.equal(bindings.x(), 'string!a');
    })
  })
})

describe("array accessors - []", function() {
  it("works for [ int ]", function() {
    var binding = "ref: a[ 4 ]",
      context = {
        a: {
          4: "square"
        }
      },
      bindings = new Parser(null, context).parse(binding)
    assert.equal(bindings.ref(), "square")
  })

  it("works for [ string ]", function() {
    var binding = "neg: a [ 'hello' ]",
      context = {
        a: {
          hello: 128
        }
      },
      bindings = new Parser(null, context).parse(binding)
    assert.equal(bindings.neg(), 128)
  })

  it("works for [ observable ]", function() {
    // make sure observables can be keys to objects.
    var binding = "neg: a[ x ]",
      x = observable(0),
      context = {
        a: {},
        x: x
      },
      bindings;
    context.a[x] = 12;
    bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.neg(), 12)
  })

  it("works for [ observable() ]", function() {
    var binding = "neg: a[ x() ]",
      context = {
        a: [123, 456],
        x: observable(1)
      },
      bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.neg(), 456)
    context.x(0)
    assert.equal(bindings.neg(), 123)
  })

  it("works off a function e.g. f()[1]", function() {
    var binding = "neg: f()[3]",
      f = function() {
        return [3, 4, 5, 6]
      },
      context = {
        f: f
      },
      bindings = new Parser(null, context).parse(binding);
    assert.equal(bindings.neg(), 6)
  })

  it("unwraps Identifier/Expression contents"
    /*, function () {
            var binding = "arr: [a, a && b]",
                context = { a: observable(true), b: observable(false) },
                bindings = new Parser(null, context).parse(binding);
            assert.equal(bindings.arr()[0], true)
            assert.equal(bindings.arr()[1], false)
            context.b(true)
            assert.equal(bindings.arr()[1], true)
        }*/
  )
})

describe("Virtual elements", function() {
  beforeEach(function() {
    options.bindingProviderInstance = new Provider();
  })

  it("binds to a raw comment", function() {
    var cmt = document.createComment("ko test: obs");
    assert.ok(instance.nodeHasBindings(cmt))
  })

  it("ignores non ko: comments", function() {
    var cmt = document.createComment("hello world");
    assert.notOk(instance.nodeHasBindings(cmt))
  })

  it("binds text in virtual element", function() {
    var cmt = document.createComment("ko text: obs"),
      context = {
        obs: observable("a towel")
      },
      bindings;
    bindings = instance.getBindingAccessors(cmt, context)
    assert.isObject(bindings)
    assert.isFunction(bindings.text)
    assert.equal(unwrap(bindings.text()), context.obs())
  })

  it("binds a sub-element comment", function() {
    var div = document.createElement("div"),
      context = {
        obs: observable("a sperm whale")
      };
    div.appendChild(document.createComment("ko text: obs"));
    div.appendChild(document.createComment("/ko"));
    options.bindingProviderInstance.bindingHandlers.set(coreBindings)
    applyBindings(context, div);
    assert.include(div.textContent || div.innerText, context.obs())
  })
})


describe("ES6-style interpolated strings", function () {
  function expect_equal(binding, context, expect) {
    var bindings = new Parser(null, context).parse("v: " + binding)
    assert.equal(bindings.v(), expect)
  }

  it("parses a plain string", function () {
    expect_equal("`abc`", {}, "abc")
  })

  it("ignores $xyz", function () {
    expect_equal("`a $b $$`", {}, "a $b $$")
  })

  it("interpolates ${x} primitive", function () {
    expect_equal("`a${x}c`", {x: "B"}, "aBc")
  })

  it("interpolates spacey ${  x  } primitive", function () {
    expect_equal("`a${  x  }cd`", {x: "B"}, "aBcd")
  })

  it("interpolates multiple primitives", function () {
    var ctx = {w: "W", x: "X", y: "Y", z: "Z"}
    expect_equal("`${w}a${x}c${y}d${z}`", ctx, "WaXcYdZ")
  })

  it("interpolates a function", function () {
    var ctx = {foo: function () { return '123' }}
    expect_equal("`A${foo()}B`", ctx, "A123B")
  })

  it("interpolates an observable", function () {
    var ctx = { foo: observable("444") }
    expect_equal("`A${foo()}B`", ctx, "A444B")
  })

  it("automatically unwraps an observable", function () {
    var ctx = { foo: observable("444") }
    expect_equal("`A${foo}B`", ctx, "A444B")
  })

  it("looks up complex expressions", function () {
    var ctx = { a: function() { return { b: [0, 0, {c: 4}] } } }
    expect_equal("`A${a().b[2].c}B`", ctx, "A4B")
  })

  it("skips escaped \\${}", function () {
    expect_equal("`a\\${E}c`", {}, "a${E}c")
  })
})



describe("compound expressions", function() {
  var d = 42,
    e = [9, 8],
    c = {
      d: d,
      e: e
    },
    b = {
      c: c
    },
    a = {
      b: b
    },
    yf2 = function() {
      return [{
        yf2a: 'air'
      }, {
        yf2b: 'brick'
      }]
    },
    yf1 = function() {
      return yf2
    },
    y = [yf1, yf2],
    x = {
      y: y
    },
    z = function() {
      return [function() {
        return 'dv'
      }]
    },
    F1 = function() {
      return 'R1'
    },
    F2 = function() {
      return {
        G: function() {
          return 'R2'
        }
      }
    },
    context,
    obs = observable({
      d: d
    });

  beforeEach(function () {
    context = {
      a: a,
      F1: F1,
      F2: F2,
      x: x,
      obs: obs,
      z: z,
      u: undefined,
      False: observable(false),
    };
  })

  // a property of the observable (not the observable's value)
  obs.P = y;

  function expect_equal(binding, expect) {
    var bindings = new Parser(null, context).parse("v: " + binding)
    assert.equal(bindings.v(), expect)
  }

  function expect_deep_equal(binding, expect) {
    var bindings = new Parser(null, context).parse("v: " + binding)
    assert.deepEqual(bindings.v(), expect)
  }

  it("plucks 'a.b.c'", function() {
    expect_deep_equal('a.b.c', context.a.b.c) // obj
  })

  it("plucks a.b.c.d", function() {
    expect_equal('a.b.c.d', context.a.b.c.d) // 1
  })

  it("plucks a.b.c.x", function() {
    expect_equal('a.b.c.x', context.a.b.c.x) // undefined
  })

  it("plucks a.b.c.d.e[1]", function() {
    expect_equal("a.b.c.e[1]", context.a.b.c.e[1]) // 8
  })

  it("plucks 'u' (undefined)", function() {
    expect_equal('u', undefined)
  })

  it("throws 'missing'", function() {
    assert.throws(function() {
      new Parser(null, context).parse("v: missing").v()
    }, 'not found')
  })

  it("throws when 'r' is not on u", function() {
    function fn() {
      expect_equal('u.r', undefined) // undefined
    }
    assert.throws(fn, "defined")
  })

  it("calls function F1", function() {
    expect_equal('F1()', context.F1()) // R1
  })

  it("calls F2().G()", function() {
    expect_equal("F2().G()", context.F2().G()) // R2
  })

  it("gets 'brick' from x.y[0]()()[1].yf2b", function() {
    var expect = x.y[0]()()[1].yf2b;
    expect_equal("x.y[0]()()[1].yf2b", expect)
  })

  it("gets 'air' from x . y [ 0 ] ( ) ( ) [ 0 ] . yf2a", function() {
    var expect = x.y[0]()()[0].yf2a;
    expect_equal("\n\r\t x\n\r\t  .\n\r\t  y\n\r\t  [\n\r\t  0" +
      "\n\r\t  ]\n\r\t  (\n\r\t  )\n\r\t  (\n\r\t  )\n\r\t  [" +
      "\n\r\t  0\n\r\t  ]\n\r\t .\n\r\t yf2a", expect)
  })

  it("gets z()[0]()", function() {
    var expect = z()[0]();
    expect_equal("z()[0]()", expect)
  })

  it("gets obs().d", function() {
    expect_equal("obs().d", obs().d)
  })

  it("gets obs.P", function() {
    expect_equal("obs.P", obs.P)
  })

  it("gets obs['P']", function() {
    expect_equal("obs['P']", obs.P)
  })

  it("gets (false || {x: 3.14}).x", function () {
    expect_equal("(false || {x: 3.14}).x", 3.14)
  })

  it("gets (False || {x: 3.14}).x", function () {
    expect_equal("(False || {x: 3.14}).x", 3.14)
  })

  it("gets (False() || {x: 3.14}).x", function () {
    expect_equal("(False() || {x: 3.14}).x", 3.14)
  })

  it("gets (False() || {x: 3.14})['x']", function () {
    expect_equal("(False() || {x: 3.14})['x']", 3.14)
  })

  it("gets (false || {x: 3.14})[{a: 'x'}.a]", function () {
    expect_equal("(False() || {x: 3.14})[{a: 'x'}.a]", 3.14)
  })

  it.skip("gets (false || F1)()", function () {
    // TODO
    expect_equal("(false || F1)()", 'R1')
  })

  it.skip("gets (F2()).G()", function () {
    // TODO
    expect_equal("(F2()).G()", 'R2')
  })


  describe("function expressions", function () {
    function R() { return arguments }
    function R0() { return arguments[0] }
    function B() { return { self: this, args: arguments } }
    beforeEach(function () { context = { R: R, B: B, R0: R0 } })

    it("calls the function with an argument", function () {
      expect_deep_equal("R(123)", R(123))
    })

    it("calls the function with two arguments", function () {
      expect_deep_equal("R('x', 'y')", R('x', 'y'))
    })

    it("calls the function with nested functions", function () {
      expect_deep_equal("R(R('xe'))", R(R('xe')))
    })

    it("calls the function with primitives", function () {
      expect_deep_equal(
        "R([123], null, false, true, undefined)",
        R([123], null, false, true, undefined)
      )
    })

    it("chains argument arrays return", function () {
      expect_deep_equal("R0(['x'])[0]", 'x')
    })

    it("exposes argument object return", function () {
      expect_deep_equal("R0({xee: 'xe'}).xee", 'xe')
    })

    it("chains function calls with arguments", function () {
      expect_deep_equal(
        "R0(R0([R0({x: R0('1i3')})]))[0].x",
        '1i3'
      )
    })

    it.skip("calls functions with .bind", function () {
      expect_deep_equal("B.bind('x')()", { self: 'x', args: [] })
    })
  })
}); //  compound functions