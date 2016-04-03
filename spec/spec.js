/*
    Knockout Secure Binding  –  Spec

    Notes:
    1. The binding tests both Knockout's default binding and the secure binding
       so The secure binding is not set by default, for an example of how to
       test it see the test "changing Knockout's bindings to KSB" below

    2. Note all the variables e.g. `instance` set in the outermost `describe`.
       These make for shorthands throughout the tests.

*/

describe("Knockout Secure Binding", function () {
   var instance,
       Parser,
       Expression,
       Identifier,
       Node,
       nodeParamsToObject,
       operators,
       original_provider = ko.bindingProvider,
       csp_rex = /Content Security Policy|blocked by CSP/;

    beforeEach(function () {
        instance = new secureBindingsProvider();
        Parser = instance.Parser,
        Identifier = Parser.Identifier,
        Expression = Parser.Expression,
        Node = Parser.Node,
        nodeParamsToObject = instance.nodeParamsToObject,
        operators = Node.operators;
    })

    it("has loaded knockout", function () {
        assert.property(window, 'ko')
    })

   // The following mucks up our test runner because even though a CSP is not
   // respected, we still want to know whether KSB works -- i.e. it is not a
   // failure of KSB if a browser does not support CSP.
   //
   //  describe("the Knockout bindingProvider", function () {
   //      it("uses the original binding provider", function () {
   //          assert.equal(ko.bindingProvider, original_provider);
   //      })
    //
   //      it("has eval or new Function throw a CSP error", function () {
   //          var efn = function () { return eval("true") },
   //              nfn = function () { new Function("return true") };
    //
   //          console.log("Expecting a CSP violation ...")
   //          assert.throw(efn, csp_rex)
   //          console.log("Expecting a CSP violation ...")
   //          assert.throw(nfn, csp_rex)
   //      })
    //
   //      it("will throw an CSP error with regular bindings", function () {
   //          var div = document.createElement("div"),
   //          fn = function () {
   //              ko.applyBindings({obs: 1}, div)
   //          };
    //
   //          // Although we cannot disable the CSP-violations, printing to the
   //          // console, we can print a lead-in that makes it appear to be
   //          // expected.
   //          console.log("Expecting a CSP violation ...")
   //          div.setAttribute("data-bind", "text: obs"),
   //          ko.bindingProvider.instance = new original_provider();
   //          assert.throw(fn, csp_rex)
   //      })
   //  })

describe("nodeHasBindings", function() {
    it("identifies elements with data-sbind", function () {
        var div = document.createElement("div")
        div.setAttribute("data-sbind", "x")
        assert.ok(instance.nodeHasBindings(div))
    })

    it("does not identify elements without data-sbind", function () {
        var div = document.createElement("div")
        div.setAttribute("data-bind", "x")
        assert.notOk(instance.nodeHasBindings(div))
    })
})

describe("getBindingAccessors with string arg", function() {
    var div;

    beforeEach(function() {
        ko.bindingProvider.instance = new secureBindingsProvider()
        div = document.createElement("div");
        instance.bindings.alpha = {
            init: sinon.spy(),
            update: sinon.spy()
        }
    });

    it("reads multiple bindings", function () {
        div.setAttribute("data-sbind", 'a: 123, b: "456"')
        var bindings = instance.getBindingAccessors(div);
        assert.equal(Object.keys(bindings).length, 2, 'len')
        assert.equal(bindings['a'](), 123, 'a')
        assert.equal(bindings['b'](), "456", 'b')
    });

    it("escapes strings", function () {
        div.setAttribute("data-sbind", 'a: "a\\"b", b: \'c\\\'d\'')
        var bindings = instance.getBindingAccessors(div);
        assert.equal(Object.keys(bindings).length, 2, 'len')
        assert.equal(bindings['a'](), "a\"b", 'a')
        assert.equal(bindings['b'](), "c\'d", 'b')
    })

    it("returns a name/valueAccessor pair", function () {
        div.setAttribute("data-sbind", 'alpha: "122.9"');
        var bindings = instance.getBindingAccessors(div);
        assert.equal(Object.keys(bindings).length, 1, 'len')
        assert.isFunction(bindings['alpha'], 'is accessor')
        assert.equal(bindings['alpha'](), "122.9", '122.9')
    });

    it("becomes the valueAccessor", function () {
        div.setAttribute("data-sbind", 'alpha: "122.9"');
        var i_spy = instance.bindings.alpha.init,
            u_spy = instance.bindings.alpha.update,
            args;
        ko.applyBindings({vm: true}, div);
        assert.equal(i_spy.callCount, 1, "i_spy cc");
        assert.equal(u_spy.callCount, 1, "u_spy cc");
        args = i_spy.getCall(0).args;

        assert.equal(args[0], div, "u_spy div == node")
        assert.equal(args[1](), "122.9", "valueAccessor")
            // args[2] == allBindings
            assert.deepEqual(args[3], {vm: true}, "view model")

        })
})

describe("getBindingAccessors with function arg", function () {
    var div;

    beforeEach(function() {
        ko.bindingProvider.instance = new secureBindingsProvider()
        div = document.createElement("div");
        div.setAttribute("data-sbind", 'alpha: x');
        instance.bindings.alpha = {
            init: sinon.spy(),
            update: sinon.spy()
        }
    });

    it("returns a name/valueAccessor pair", function () {
        var bindings = instance.getBindingAccessors(div);
        assert.equal(Object.keys(bindings).length, 1)
        assert.isFunction(bindings['alpha'])
    });

    it("becomes the valueAccessor", function () {
        var i_spy = instance.bindings.alpha.init,
            u_spy = instance.bindings.alpha.update,
            args;
        ko.applyBindings({x: 0xDEADBEEF}, div);
        assert.equal(i_spy.callCount, 1, "i_spy cc");
        assert.equal(u_spy.callCount, 1, "u_spy cc");
        args = i_spy.getCall(0).args;

        assert.equal(args[0], div, "u_spy div == node")
        assert.equal(args[1](), 0xDEADBEEF, "valueAccessor")
            // args[2] == allBindings
            assert.deepEqual(args[3],  {x: 0xDEADBEEF}, "view model")
        })
})

describe("changing Knockout's bindings to KSB", function () {
    beforeEach(function () {
        ko.bindingProvider.instance = new secureBindingsProvider()
    })

    it("binds Text with data-sbind", function () {
        var div = document.createElement("div");
        div.setAttribute("data-sbind", "text: obs")
        ko.applyBindings({obs: ko.observable("a towel")}, div)
        assert.equal(div.textContent || div.innerText, "a towel")
    })

    it("sets attributes to constants", function () {
        var div = document.createElement("div"),
            context = { aTitle: "petunia plant" };
        div.setAttribute("data-sbind", "attr: { title: aTitle }")
        ko.applyBindings(context, div)
        assert.equal(div.getAttribute("title"), context.aTitle)
    })

    it("sets attributes to observables in objects", function () {
        var div = document.createElement("div"),
            context = { aTitle: ko.observable("petunia plant") };
        div.setAttribute("data-sbind", "attr: { title: aTitle }")
        ko.applyBindings(context, div)
        assert.equal(div.getAttribute("title"), context.aTitle())
    })

    it("registers a click event", function () {
        var div = document.createElement("div"),
            called = false,
            context = { cb: function () { called = true; } };
        div.setAttribute("data-sbind", "click: cb")
        ko.applyBindings(context, div)
        assert.equal(called, false, "not called")
        div.click()
        assert.equal(called, true)
    })

    it("sets an input `value` binding ", function () {
        var input = document.createElement("input"),
            context = { vobs: ko.observable('273-9164') };
        input.setAttribute("data-sbind", "value: vobs")
        ko.applyBindings(context, input)
        assert.equal(input.value, '273-9164')
        context.vobs("Area code 415")
        assert.equal(input.value, 'Area code 415')
    })

    it("reads an input `value` binding", function () {
        var input = document.createElement("input"),
            evt = new CustomEvent("change"),
            context = { vobs: ko.observable() };
        input.setAttribute("data-sbind", "value: vobs")
        ko.applyBindings(context, input)
        input.value = '273-9164'
        input.dispatchEvent(evt)
        assert.equal(context.vobs(), '273-9164')
    })

    it("reads an input `value` binding for a defineProperty", function () {
        // see https://github.com/brianmhunt/knockout-secure-binding/issues/23
        // and http://stackoverflow.com/questions/21580173
        var input = document.createElement("input"),
            evt = new CustomEvent("change"),
            obs = ko.observable(),
            context = { };
        Object.defineProperty(context, 'pobs', {
            configurable: true, enumerable: true, get: obs, set: obs
        });
        input.setAttribute("data-sbind", "value: pobs")
        ko.applyBindings(context, input)
        input.value = '273-9164'
        input.dispatchEvent(evt)
        assert.equal(context.pobs, '273-9164')
    })

    it("writes an input `value` binding for a defineProperty", function () {
        var input = document.createElement("input"),
            evt = new CustomEvent("change"),
            obs = ko.observable(),
            context = { };
        Object.defineProperty(context, 'pobs', {
            configurable: true, enumerable: true, get: obs, set: obs
        });
        input.setAttribute("data-sbind", "value: pobs")
        context.pobs = '273-9164'
        ko.applyBindings(context, input)
        assert.equal(context.pobs, obs())
        assert.equal(input.value, context.pobs)
        context.pobs = '415-273-9164'
        assert.equal(input.value, context.pobs)
        assert.equal(input.value, '415-273-9164')
    })

    it("writes an input object defineProperty", function () {
        var input = document.createElement("input"),
            evt = new CustomEvent("change"),
            obs = ko.observable(),
            context = { obj: {} };
        Object.defineProperty(context.obj, 'sobs', {
            configurable: true, enumerable: true, get: obs, set: obs
        });
        // apply the binding with a value
        input.setAttribute("data-sbind", "value: obj.sobs")
        context.obj.sobs = '273-9164'
        ko.applyBindings(context, input)

        // make sure the element is updated
        assert.equal(context.obj.sobs, obs())
        assert.equal(input.value, context.obj.sobs)

        // update the observable and check the input values
        context.obj.sobs = '415-273-9164'
        assert.equal(input.value, context.obj.sobs)
        assert.equal(input.value, '415-273-9164')
    })

    it("writes nested defineProperties", function () {
        var input = document.createElement("input"),
            evt = new CustomEvent("change"),
            obs = ko.observable(),
            context = {},
            obj = {},
            oo = ko.observable(obj);  // es5 wraps obj in an observable

        Object.defineProperty(context, 'obj', {
            configurable: true, enumerable: true, get: oo, set: oo
        })

        Object.defineProperty(context.obj, 'ddobs', {
            configurable: true, enumerable: true, get: obs, set: obs
        })

        input.setAttribute("data-sbind", "value: obj.ddobs")
        context.obj.ddobs = '555-2368'  // who ya gonna call?
        ko.applyBindings(context, input)

        assert.equal(context.obj.ddobs, obs())
        assert.equal(input.value, context.obj.ddobs)

        context.obj.ddobs = '646-555-2368'
        assert.equal(input.value, '646-555-2368')
    })

    it("reads a nested defineProperty", function () {
        var input = document.createElement("input"),
            evt = new CustomEvent("change"),
            obs = ko.observable(),
            oo = ko.observable({}),
            context = {};

        Object.defineProperty(context, 'obj', {
            configurable: true, enumerable: true, get: oo, set: oo
        })

        Object.defineProperty(oo(), 'drobs', {
            configurable: true, enumerable: true, get: obs, set: obs
        })

        input.setAttribute("data-sbind", "value: obj.drobs")
        ko.applyBindings(context, input)
        input.value = '273.9164'
        input.dispatchEvent(evt)
        assert.equal(context.obj.drobs, '273.9164')
    })

    it("reads a multi-nested defineProperty", function () {
        var input = document.createElement("input"),
            evt = new CustomEvent("change"),
            o0 = ko.observable({}),
            o1 = ko.observable({}),
            o2 = ko.observable({}),
            context = {};

        Object.defineProperty(context, 'o0', {
            configurable: true, enumerable: true, get: o0, set: o0
        })

        Object.defineProperty(o0(), 'o1', {
            configurable: true, enumerable: true, get: o1, set: o1
        })

        Object.defineProperty(o1(), 'o2', {
            configurable: true, enumerable: true, get: o1, set: o1
        })

        Object.defineProperty(o2(), 'oN', {
            configurable: true, enumerable: true, get: o1, set: o1
        })

        input.setAttribute("data-sbind", "value: o0.o1.o2.oN")
        ko.applyBindings(context, input)
        input.value = '1.7724'
        input.dispatchEvent(evt)
        assert.equal(context.o0.o1.o2.oN, '1.7724')
    })
})

describe("The lookup of variables (get_lookup_root)", function () {
    it("accesses the context", function () {
        var binding = "a: x",
            context = { x: 'y' },
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.a(), "y");
    })

    it("accesses the globals", function () {
        var binding = "a: z",
            globals = { z: "ZZ" },
            bindings = new Parser(null, {}, globals).parse(binding);
        assert.equal(bindings.a(), globals.z)
    })

    it("accesses $data.value and value", function () {
        var binding = "x: $data.value, y: value",
            context = { '$data': { value: 42 }},
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.x(), 42)
        assert.equal(bindings.y(), 42)
    })

    it("ignores spaces", function () {
        var binding = "x: $data  .  value, y: $data\n\t\r . \t\r\nvalue",
            context = { '$data': { value: 42 }},
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.x(), 42)
        assert.equal(bindings.y(), 42)
    })

    it("looks up nested elements in objects", function () {
        var binding = "x: { y: { z: a.b.c } }",
            context = { 'a': { b: { c: 11 }}},
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.x().y.z, 11)
    })

    it("does not have access to `window` globals", function () {
        var binding = "x: window, y: global, z: document",
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.x(), undefined)
        assert.equal(bindings.y(), undefined)
        assert.equal(bindings.z(), undefined)
    })

    it("recognizes $context", function () {
        var binding = "x: $context.value, y: value",
            context = { value: 42 },
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.x(), 42)
        assert.equal(bindings.y(), 42)
    })

    it("recognizes $element", function () {
        var binding = "x: $element.id",
            node = { id: 42 },
            bindings = new Parser(node, {}).parse(binding);
        assert.equal(bindings.x(), node.id)
    })

    it("accesses $data before $context", function () {
        var binding = "x: value",
            context = { value: 21, '$data': { value: 42 }},
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.x(), 42)
    })

    it("accesses $context before globals", function () {
        var binding = "a: z",
            context = { z: 42 },
            globals = { z: 84 },
            bindings = new Parser(null, context, globals).parse(binding);
        assert.equal(bindings.a(), 42)
    })

    it("accesses properties created with defineProperty", function () {
        // style of e.g. knockout-es5
        var binding = "a: z",
            context = {},
            bindings = new Parser(null, context).parse(binding),
            obs = ko.observable();

        Object.defineProperty(context, 'z', {
            configurable: true,
            enumerable: true,
            get: obs,
            set: obs
        });

        assert.equal(bindings.a(), undefined)
        context.z = '142'
        assert.equal(bindings.a(), 142)
    })

    it("does not bleed globals", function () {
        var binding = "a: z",
            globals_1 = {z: 168},
            globals_2 = {},
            bindings_1 = new Parser(null, context,
                globals_1).parse(binding),
            bindings_2 = new Parser(null, context,
                globals_2).parse(binding);
        assert.equal(bindings_1.a(), 168)
        assert.equal(bindings_2.a(), undefined)
    })
})

describe("the build_tree function", function () {
    var nodes_to_tree;

    beforeEach(function () {
        nodes_to_tree = Expression.prototype.build_tree;
    })

    it("converts a simple array to a tree", function () {
        var nodes = ['a', operators['*'], 'b'],
            tree = nodes_to_tree(nodes.slice(0));
                // we use nodes.slice(0) to make a copy.
                assert.equal(tree.lhs, 'a');
                assert.equal(tree.rhs, 'b');
                assert.equal(tree.op, operators['*']);
            })

    it("converts multiple * to a tree", function () {
        var nodes = ['a', operators['*'], 'b', operators['/'], 'c'],
            tree = nodes_to_tree(nodes.slice(0));
        assert.equal(tree.lhs, 'a');
        assert.equal(tree.op, operators['*']);
        assert.equal(tree.rhs.lhs, 'b');
        assert.equal(tree.rhs.op, operators['/']);
        assert.equal(tree.rhs.rhs, 'c');
    })

    it("converts a complex set as expected", function () {
        var nodes = [
            'a', operators['*'], 'b',
            operators['+'],
            'c', operators['*'], 'd', operators['*'], 'e',
            operators['>'],
            'f', operators['+'], 'g', operators['%'], 'h',
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

    it("converts function calls (a())", function () {
        var context = { x: ko.observable(0x0F) },
            parser, nodes, root;
            parser = new Parser(null, context);
            nodes = [
                // the third argument is the same as _deref_call
                new Identifier(parser, 'x', [true]),
                operators['|'],
                0x80
            ];
        root = nodes_to_tree(nodes.slice(0));

        assert.equal(root.get_node_value(), 0x8F)
    })
})

describe("Identifier", function () {
    var c = 'Z',
        f = function () { return 'Fv' };

    it("looks up values on the parser context", function () {
        var context = { c: c, f: f },
            parser = new Parser(null, context);
        assert.equal(new Identifier(parser, "c").get_value(), 'Z')
        assert.equal(new Identifier(parser, "f").get_value(), f)
    })

    describe("the dereference function", function () {
        it("does nothing with no references", function () {
            var refs = undefined,
                ident = new Identifier({}, 'x', refs);
            assert.equal(ident.dereference('1'), 1)
        })
        it("does nothing with empty array references", function () {
            var refs = [],
                ident = new Identifier({}, 'x', refs);
            assert.equal(ident.dereference('1'), 1)
        })
        it("applies the functions of the refs to the value", function () {
            var refs = [true, true],
                ident = new Identifier({}, 'x', refs),
                g = function () { return '42' },
                f = function () { return g };
            assert.equal(ident.dereference(f), 42)
        })

        it("sets `this` to the parent member", function () {
            var div = document.createElement("div"),
                context = {
                    fn: function () {
                        assert.isObject(this)
                        assert.equal(this, context)
                        return 'ahab'
                    },
                    moby: 'dick'
                };
            div.setAttribute("data-sbind", "text: $data.fn()")
            ko.bindingProvider.instance = new secureBindingsProvider()
            ko.applyBindings(context, div)
            assert.equal(div.textContent || div.innerText, 'ahab')
        })

        it("sets `this` of a top-level item to {$data, $context, globals, node}", function () {
            var div = document.createElement("div"),
                globals = { Ramanujan: "1729" };
                context = {
                    fn: function () {
                        assert.isObject(this)
                        assert.equal(ko.contextFor(div), this.$context,
                            '$context')
                        assert.equal(ko.dataFor(div), this.$data, '$data')
                        assert.equal(div, this.$element, 'div')
                        assert.deepEqual(globals, this.globals, 'globals')
                        return 'sigtext'
                    }
                };
            div.setAttribute("data-sbind", "text: fn()")
            ko.bindingProvider.instance = new secureBindingsProvider({ globals: globals })
            ko.applyBindings(context, div)
            assert.equal(div.textContent || div.innerText, 'sigtext')
        })

    })

    it("dereferences values on the parser", function () {
        var context = { f: f },
            parser = new Parser(null, context),
            derefs = [true];
        assert.equal(new Identifier(parser, 'f', derefs).get_value(), 'Fv')
    })
})

describe("Node", function () {
    it("traverses the tree 19 * -2 + 4", function () {
        var root = new Node();
        root.op = operators['+']
        root.lhs = new Node(19, operators['*'], -2)
        root.rhs = 4
        assert.equal(root.get_node_value(), 19 * -2 + 4)
    })

    it("looks up identifiers", function () {
        var root = new Node(),
            context = { x: 19 },
            parser = new Parser(null, context),
            ident = new Identifier(parser, 'x');
        root.op = operators['+']
        root.lhs = ident
        root.rhs = 23
        assert.equal(root.get_node_value(), 23 + 19)
    })
})

describe("the bindings parser", function () {
    it("parses bindings with JSON values", function () {
        var binding_string = 'a: "A", b: 1, c: 2.1, d: ["X", "Y"], e: {"R": "V"}, t: true, f: false, n: null',
            value = new Parser(null, {}).parse(binding_string);
        assert.equal(value.a(), "A", "string");
        assert.equal(value.b(), 1, "int");
        assert.equal(value.c(), 2.1, "float");
        assert.deepEqual(value.d(), ["X",  "Y"], "array");
        assert.deepEqual(value.e(), {"R": "V"}, "object");
        assert.equal(value.t(), true, "true");
        assert.equal(value.f(), false, "false");
        assert.equal(value.n(), null, "null");
    })

    it("parses an array of JSON values", function () {
        var binding = "x: [1, 2.1, true, false, null, undefined]",
        bindings = new Parser(null, {}).parse(
            binding);
        assert.deepEqual(bindings.x(), [1, 2.1, true, false, null, undefined])
    })

    it("undefined keyword works", function () {
        var value = new Parser(null, {}).parse(
            "y: undefined");
        assert.equal(value.y(), void 0);
    })

    it("parses single-quote strings", function () {
        var binding = "text: 'st\\'r'",
            bindings = new Parser(null, {}).parse(binding);
        assert.equal(bindings.text(), "st'r")
    })

    it("parses bare `text` as `text: null`", function () {
      var binding = "text",
          bindings = new Parser(null, {}).parse(binding);
      assert.deepEqual(bindings.text(), null)
   })

    it('parses `text: "alpha"`', function () {
      var binding = 'text: "alpha"',
          bindings = new Parser(null, {}).parse(binding);
      assert.deepEqual(bindings.text(), 'alpha')
    })

    it("parses `a: 'a', b, c: 'c'` => ..., b: null, ...", function () {
      var binding = "a: 'a', b, c: 'c'",
          bindings = new Parser(null, {}).parse(binding);
      assert.deepEqual(bindings.a(), 'a')
      assert.deepEqual(bindings.b(), null)
      assert.deepEqual(bindings.c(), 'c')
   })

    it("parses text: {object: 'string'}", function () {
        var binding = "text: {object: 'string'}",
            bindings = new Parser(null, {}).parse(binding);
        assert.deepEqual(bindings.text(), { object: "string" })
    })

    it("parses object: attr: {name: value}", function () {
        var binding = "attr: { klass: kValue }",
            context = { kValue: 'Sam' }
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.attr().klass, 'Sam')
    })

    it("parses object: attr: {name: ko.observable(value)}", function () {
        var binding = "attr : { klass: kValue }",
            context = { kValue: ko.observable('Gollum') }
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.attr().klass(), 'Gollum')
    })

    it("parses object: attr: {n1: v1, n2: v2}", function () {
        var binding = "attr : { a: x, b: y }",
            context = { x: 'Real', y: 'Imaginary' }
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.attr().a, 'Real')
        assert.equal(bindings.attr().b, 'Imaginary')
    })

    it("parses compound operator d()[0]()", function () {
        var binding = "attr: d()[0]()",
            d = function () { return [function () { return 'z' }]},
            context = { d: d },
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.attr(), 'z')
    })

    it("parses string+var+string", function () {
        // re issue #27
        var binding = "text: 'prefix'+name+'postfix'"
            context = { name: ko.observable('mike') },
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.text(), 'prefixmikepostfix')
    })
})

describe("the parsing of expressions", function () {
    it("works with explicit braces ( )", function () {
        var binding = "attr : (x)",
            context = { x: 'spot' }
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.attr(), 'spot')
    })

    it("computes a + b", function () {
        var binding = "text: a + b",
            context = { a: 1, b: 2 },
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.text(), 3);
    })

    it("computes obs(a) + obs(b)", function () {
        var binding = "text: a + b",
            context = { a: ko.observable(1), b: ko.observable(2) },
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.text(), 3);
    })

    it("computes a + b * c", function () {
        var binding = "text: a + b * c",
            context = { a: 1, b: 2, c: 4 },
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.text(), 1 + 2 * 4);
    })

    it("compares a + 3 > b * obs(c)", function () {
        var binding = "text: a + 3 > b * c",
            context = { a: 1, b: 2, c: ko.observable(4) },
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.text(), 1 + 3 > 2 * 4);
    })

    it("respects brackets () precedence", function () {
        var binding = "text: 2 * (3 + 4)",
            bindings = new Parser(null, {}).parse(binding);
        assert.equal(bindings.text(), 2 * (3 + 4))

    })

    it("computes complex arithematic as expected", function () {
        var binding = "text: 1 * 4 % 3 + 11 * 99 / (8 - 14)",
            bindings = new Parser(null, {}).parse(binding);
        assert.equal(bindings.text(), 1 * 4 % 3 + 11 * 99 / (8 - 14));
            // == -180.5
        })

    it("recalculates observables", function () {
        var binding = "text: a - b",
            context = { a: ko.observable(1), b: ko.observable(2) },
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.text(), -1);
        context.a(2)
        assert.equal(bindings.text(), 0);
    })

    it("sets properties of objects", function () {
        var binding = "text: { x: 3 < 1, y: a < b }",
            context = { a: ko.observable(1), b: ko.observable(2) },
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.text().x, false);
        assert.equal(bindings.text().y, true);
        context.a(3)
        assert.equal(bindings.text().y, false);
    })

    it("has working logic operations", function () {
        var binding = "text: a || b",
            context = { a: ko.observable(false), b: ko.observable(false) },
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.text(), false);
        context.a(true)
        assert.equal(bindings.text(), true);
        context.a(false)
        assert.equal(bindings.text(), false);
        context.b(true)
        assert.equal(bindings.text(), true);
    })

    it("does not unwrap a single observable argument", function () {
        var binding = "text: a",
            context = { a: ko.observable() },
            bindings = new Parser(null, context).parse(binding);
        assert.ok(ko.isObservable(bindings.text()))
    })

    it("parses a string of functions a().b()", function () {
        var binding = "ref: a().b()",
            b = function () { return 'Cee' },
            a = function () { return { b: b } },
            context = { a: a },
            bindings = new Parser(null, context).parse(binding);
        assert.ok(bindings.ref(), 'Cee')
    })
})

describe("unary operations", function () {
    it("include the negation operator", function () {
        var binding = "neg: !a",
            context = { a: ko.observable(false) },
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.neg(), true)
        context.a(true);
        assert.equal(bindings.neg(), false)
    });

    it("does the double negative", function () {
        var binding = "neg: !!a",
            context = { a: ko.observable(false) },
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.neg(), false)
        context.a(true);
        assert.equal(bindings.neg(), true)
    });

    it("works in an object", function () {
        var binding = "neg: { x: !a, y: !!a }",
            context = { a: ko.observable(false) },
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.neg().x, true)
        assert.equal(bindings.neg().y, false)
        context.a(true);
        assert.equal(bindings.neg().x, false)
        assert.equal(bindings.neg().y, true)
    })

    it("negates an expression eg !(a || b)"/*, function () {
        var binding = 'ne: !(a || b)',
            context = { a: ko.observable(true), b: ko.observable(false) },
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.ne(), false)
        context.a(false)
        assert.equal(bindings.ne(), true)
    }*/)
})

describe("array accessors - []", function () {
    it("works for [ int ]", function () {
        var binding = "ref: a[ 4 ]",
        context = { a: { 4: "square" } },
        bindings = new Parser(null, context).parse(binding)
        assert.equal(bindings.ref(), "square")
    })

    it("works for [ string ]", function () {
        var binding = "neg: a [ 'hello' ]",
            context = { a: { hello: 128} },
            bindings = new Parser(null, context).parse(binding)
        assert.equal(bindings.neg(), 128)
    })

    it("works for [ observable ]", function () {
        // make sure observables can be keys to objects.
        var binding = "neg: a[ x ]",
            x = ko.observable(0),
            context = { a: {}, x: x },
            bindings;
            context.a[x] = 12;
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.neg(), 12)
    })

    it("works for [ observable() ]", function () {
        var binding = "neg: a[ x() ]",
            context = { a: [ 123, 456 ], x: ko.observable(1) },
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.neg(), 456)
        context.x(0)
        assert.equal(bindings.neg(), 123)
    })

    it("works off a function e.g. f()[1]", function () {
        var binding = "neg: f()[3]",
            f = function () { return [3, 4, 5, 6]}
            context = { f: f },
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.neg(), 6)
    })

    it("unwraps Identifier/Expression contents"/*, function () {
        var binding = "arr: [a, a && b]",
            context = { a: ko.observable(true), b: ko.observable(false) },
            bindings = new Parser(null, context).parse(binding);
        assert.equal(bindings.arr()[0], true)
        assert.equal(bindings.arr()[1], false)
        context.b(true)
        assert.equal(bindings.arr()[1], true)
    }*/)
})

describe("Virtual elements", function() {
    beforeEach(function () {
        ko.bindingProvider.instance = new secureBindingsProvider();
    })

    it("binds to a raw comment", function () {
        var cmt = document.createComment("ko test: obs");
        assert.ok(instance.nodeHasBindings(cmt))
    })

    it("ignores non ko: comments", function () {
        var cmt = document.createComment("hello world");
        assert.notOk(instance.nodeHasBindings(cmt))
    })

    it("binds text in virtual element", function () {
       var cmt = document.createComment("ko text: obs"),
         context =  { obs: ko.observable("a towel") },
         bindings;
       bindings = instance.getBindingAccessors(cmt, context)
       assert.isObject(bindings)
       assert.isFunction(bindings.text)
       assert.equal(ko.unwrap(bindings.text()), context.obs())
   })

    it("binds a sub-element comment", function () {
        var div = document.createElement("div"),
        context = { obs: ko.observable("a sperm whale") };
        div.appendChild(document.createComment("ko text: obs"));
        div.appendChild(document.createComment("/ko"));
        ko.applyBindings(context, div);
        assert.include(div.textContent || div.innerText, context.obs())
    })
})

describe("Components", function () {
  describe("custom elements", function () {
    // Note: knockout/spec/components
    beforeEach(function () {
       ko.bindingProvider.instance = new secureBindingsProvider();
    });

    it("inserts templates into custom elements", function (done) {
       ko.components.register('helium', {
          template: 'X<i data-sbind="text: 123"></i>'
       });
       var initialMarkup = 'He: <helium></helium>';
       var root = document.createElement("div");
       root.innerHTML = initialMarkup;

       // Since components are loaded asynchronously, it doesn't show up synchronously
       ko.applyBindings(null, root);
       assert.equal(root.innerHTML, initialMarkup);
       setTimeout(function () {
          window.root = root;
          assert.equal(root.innerHTML,
             'He: <helium>X<i data-sbind="text: 123">123</i></helium>'
          );
          done();
       }, 1);
    });

    it("interprets the params of custom elements", function (done) {
       var called = false;
       ko.components.register("argon", {
          viewModel: function(params) {
             this.delta = 'G2k'
             called = true;
          },
          template: "<b>sXZ <u data-sbind='text: delta'></u></b>"
       });
       var ce = document.createElement("argon");
       ce.setAttribute("params",
          "alpha: 1, beta: [2], charlie: {x: 3}, delta: delta"
       );
       ko.applyBindings({delta: 'QxE'}, ce);
       setTimeout(function () {
          assert.equal(ce.innerHTML,
             '<b>sXZ <u data-sbind="text: delta">G2k</u></b>');
          assert.equal(called, true);
          done()
       }, 1)
    });

    it("does not unwrap observables (#44)", function (done) {
      // Per https://plnkr.co/edit/EzpJD3yXd01aqPbuOq1X
      function AppViewModel(value) {
        this.appvalue = ko.observable(value);
      }

      function ParentViewModel(params) {
        this.parentvalue = params.value;
      }

      function ChildViewModel(params) {
        assert.ok(ko.isObservable(params.value))
        this.cvalue = params.value
      }

      var ps = document.createElement('script')
      ps.setAttribute('id', 'parent-44')
      ps.setAttribute('type', 'text/html')
      ps.innerHTML = '<div>Parent: <span data-bind="text: parentvalue"></span></div>' +
          '<child params="value: parentvalue"></child>'
      document.body.appendChild(ps)

      cs = document.createElement('script')
      cs.setAttribute('id', 'child-44')
      cs.setAttribute('type', 'text/html')
      cs.innerHTML = ''
      document.body.appendChild(cs)

      var div = document.createElement('div')
      div.innerHTML = '<div data-bind="text: appvalue"></div>' +
        '<parent params="value: appvalue"></parent>'

      var viewModel = new AppViewModel("hello");
      ko.components.register("parent", {
          template: { element: "parent-44" },
          viewModel: ParentViewModel
      });
      ko.components.register("child", {
          template: { element: "child-44" },
          viewModel: ChildViewModel
      });
      var options = {
          attribute: "data-bind",
          globals: window,
          bindings: ko.bindingHandlers,
          noVirtualElements: false
      };
      // ko.bindingProvider.instance = new original_provider()
      ko.bindingProvider.instance = new secureBindingsProvider(options);
      ko.applyBindings(viewModel, div);
      setTimeout(function () { done() }, 50)
    });

    it("uses empty params={$raw:{}} if the params attr is whitespace", function (done) {
      var called = false;
      ko.components.register("lithium", {
        viewModel: function(params) {
          assert.deepEqual(params, {$raw:{}})
          done()
        },
        template: "hello"
      });
      var ce = document.createElement("lithium");
      ce.setAttribute("params", "   ");
      ko.applyBindings({delta: 'QxE'}, ce);
      // No error raised.
    })

    it('parses `text: "alpha"` on a custom element', function (done) {
      // re brianmhunt/knockout-secure-binding#38
      ko.components.register("neon", {
        viewModel: function (params) {
          assert.equal(params.text, "Knights of Ne.");
          done();
        },
        template: "A noble gas and less noble car."
      })
      var ne = document.createElement("neon");
      ne.setAttribute("params", 'text: "Knights of Ne."')
      ko.applyBindings({}, ne);
      // No error raised.
    })
  });

   describe("nodeParamsToObject", function () {
      var parser = null;
      beforeEach(function () {

      });
      it("returns {$raw:{}} when there is no params attribute", function () {
         var parser = bindings = new Parser(null, {});
         var node = document.createElement("div");
         assert.deepEqual(nodeParamsToObject(node, parser), {$raw:{}});
      });

      it("returns the params items", function () {
         var parser = new Parser(null, {});
         var node = document.createElement("div");
         node.setAttribute('params', 'value: "42.99"')
         var expect = {
            value: "42.99",
            $raw: {
               value: "42.99"
            }
         };
         assert.deepEqual(ko.toJS(nodeParamsToObject(node, parser)), expect);
      });

      it("returns unwrapped params", function () {
         var parser = new Parser(null, {fe: ko.observable('Iron')});
         var node = document.createElement("div");
         node.setAttribute('params', 'type: fe');
         var paramsObject = nodeParamsToObject(node, parser);
         assert.equal(paramsObject.type(), "Iron")
         assert.equal(paramsObject.$raw.type()(), "Iron")
      });
   });
});

describe("compound expressions", function () {
    var d = 42,
        e = [9, 8],
        c = { d: d, e: e },
        b = { c: c },
        a = { b: b },
        yf2 = function () { return [ { yf2a: 'air' }, { yf2b: 'brick' } ] },
        yf1 = function () { return yf2 },
        y = [ yf1, yf2 ],
        x = { y: y },
        z = function () { return [function() { return 'dv' }] },
        F1 = function () { return 'R1' },
        F2 = function () {
            return { G: function () { return 'R2' }}
        },
        obs = ko.observable({ d: d }),
        context = { a: a, F1: F1, F2: F2, x: x, obs: obs, z: z };

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

    it("plucks 'a.b.c'", function () {
        expect_deep_equal('a.b.c', context.a.b.c) // obj
    })

    it("plucks a.b.c.d", function () {
        expect_equal('a.b.c.d', context.a.b.c.d) // 1
    })

    it("plucks a.b.c.x", function () {
        expect_equal('a.b.c.x', context.a.b.c.x) // undefined
    })

    it("plucks a.b.c.d.e[1]", function () {
        expect_equal("a.b.c.e[1]", context.a.b.c.e[1]) // 8
    })

    it("plucks 'u' (undefined)", function () {
        expect_equal('u', undefined)
    })

    it("throws when 'r' is not on u", function () {
        function fn() {
            expect_equal('u.r', undefined) // undefined
        }
        assert.throws(fn, "defined")
    })

    it("calls function F1", function () {
        expect_equal('F1()', context.F1()) // R1
    })

    it("calls F2().G()", function () {
        expect_equal("F2().G()", context.F2().G()) // R2
    })

    it("gets 'brick' from x.y[0]()()[1].yf2b", function () {
        var expect = x.y[0]()()[1].yf2b;
        expect_equal("x.y[0]()()[1].yf2b", expect)
    })

    it("gets 'air' from x . y [ 0 ] ( ) ( ) [ 0 ] . yf2a", function () {
        var expect = x.y[0]()()[0].yf2a;
        expect_equal("\n\r\t x\n\r\t  .\n\r\t  y\n\r\t  [\n\r\t  0" +
            "\n\r\t  ]\n\r\t  (\n\r\t  )\n\r\t  (\n\r\t  )\n\r\t  [" +
            "\n\r\t  0\n\r\t  ]\n\r\t .\n\r\t yf2a", expect)
    })

    it("gets z()[0]()", function () {
        var expect = z()[0]();
        expect_equal("z()[0]()", expect)
    })

    it("gets obs().d", function () {
        expect_equal("obs().d", obs().d)
    })

    it("gets obs.P", function () {
        expect_equal("obs.P", obs.P)
    })

    it("gets obs['P']", function () {
        expect_equal("obs['P']", obs.P)
    })
}); //  compound functions
})
