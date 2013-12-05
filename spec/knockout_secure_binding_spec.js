/*
TODO: comments
see eg https://github.com/rniemeyer/knockout-classBindingProvider/blob/master/spec/knockout-classBindingProvider.spec.js
*/

describe("Knockout Secure Binding", function () {
    var instance,
        csp_rex = /Content Security Policy|blocked by CSP/;

    beforeEach(function () {
        instance = new ko.secureBindingsProvider();
    })

    // it("Has a built-in delay", function (done) {
    //   // we use this to make sure our test driver will actually
    //   // work when the results are slow (who tests the testers?)
    //   setTimeout(function () { done () }, 1000)
    // })

    it("Has loaded knockout", function () {
        assert.property(window, 'ko')
    })

    it("secureBindingsProvider exist on 'ko'", function () {
        // note that it could alternatively be exported with `require`
        assert.property(ko, 'secureBindingsProvider')
    })

    it("has eval or new Function throw a CSP error", function () {
        var efn = function () { return eval("true") },
            nfn = function () { new Function("return true") };

        console.log("Expecting a CSP violation ...")
        assert.throw(efn, csp_rex)
        console.log("Expecting a CSP violation ...")
        assert.throw(nfn, csp_rex)
    })

    it("will throw an CSP error with regular bindings", function () {
        var div = document.createElement("div"),
            fn = function () {
                ko.applyBindings({obs: 1}, div)
            };

        // Although we cannot disable the CSP-violations, printing to the
        // console, we can print a lead-in that makes it appear to be
        // expected.
        console.log("Expecting a CSP violation ...")
        div.setAttribute("data-bind", "text: obs"),
        ko.bindingProvider.instance = new ko.bindingProvider()
        assert.throw(fn, csp_rex)
    })

    it("provides a binding provider", function () {
        ko.bindingProvider.instance = new ko.secureBindingsProvider();
    })

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
            ko.bindingProvider.instance = new ko.secureBindingsProvider()
            div = document.createElement("div");
            div.setAttribute("data-sbind", 'alpha: "122.9"');
            instance.bindings.alpha = {
                init: sinon.spy(),
                update: sinon.spy()
            }
        });

        it("returns a name/valueAccessor pair", function () {
            var bindings = instance.getBindingAccessors(div);
            assert.equal(Object.keys(bindings).length, 1)
            assert.isFunction(bindings['alpha'])
            assert.equal(bindings['alpha'](), "122.9")
        });

        it("becomes the valueAccessor", function () {
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
            ko.bindingProvider.instance = new ko.secureBindingsProvider()
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

    describe("Knockout's Text binding", function () {
        beforeEach(function () {
            ko.bindingProvider.instance = new ko.secureBindingsProvider()
        })
        it("binds with data-sbind", function () {
            var div = document.createElement("div")
            div.setAttribute("data-sbind", "text: obs")
            ko.applyBindings({obs: ko.observable("a towel")}, div)
            assert.equal(div.textContent, "a towel")
        })
    })

    describe("the bindings parser", function () {
        it("parses bindings with JSON values", function () {
            var binding_string = 'a: "A", b: 1, c: 2.1, d: ["X", "Y"], e: {"R": "V"}, t: true, f: false, n: null',
            value = instance.parse(binding_string);
            assert.equal(value.a(), "A", "string");
            assert.equal(value.b(), 1, "int");
            assert.equal(value.c(), 2.1, "float");
            assert.deepEqual(value.d(), ["X",  "Y"], "array");
            assert.deepEqual(value.e(), {"R": "V"}, "object");
            assert.equal(value.t(), true, "true");
            assert.equal(value.f(), false, "false");
            assert.equal(value.n(), null, "null");
        })

        it("Parses an array of JSON values", function () {
            var binding = "x: [1, 2.1, true, false, null, undefined]",
                bindings = instance.parse(binding);
            assert.deepEqual(bindings.x(), [1, 2.1, true, false, null, undefined])
        })

        it("undefined keyword works", function () {
            var value = instance.parse("y: undefined");
            assert.equal(value.y(), void 0);
        })

        it("Looks up constant on the given context", function () {
            var binding = "a: x",
                context = { x: 'y' },
                bindings = instance.parse(binding, null, context);
            assert.equal(bindings.a(), "y");
        })

        it("Parses single-quote strings", function () {
            var binding = "text: 'st\\'r'",
                bindings = instance.parse(binding, null, {});
            assert.equal(bindings.text(), "st'r")
        })

        it("Parses text: {object: 'string'}", function () {
            var binding = "text: {object: 'string'}",
                bindings = instance.parse(binding, null, {});
            assert.deepEqual(bindings.text(), { object: "string" })
        })

        it("Returns $data.value and value", function () {
            var binding = "x: $data.value, y: value",
                context = { '$data': { value: 42 }},
                bindings = instance.parse(binding, null, context);
            assert.equal(bindings.x(), 42)
            assert.equal(bindings.y(), 42)
        })

        it("Recognizes $context", function () {
            var binding = "x: $context.value, y: value",
                context = { value: 42 },
                bindings = instance.parse(binding, null, context);
            assert.equal(bindings.x(), 42)
            assert.equal(bindings.y(), 42)
        })

        it("Does not have access to globals", function () {
            var binding = "x: window, y: global, z: document",
                bindings = instance.parse(binding, null, context);
            assert.equal(bindings.x(), undefined)
            assert.equal(bindings.y(), undefined)
            assert.equal(bindings.z(), undefined)
        })

        it("Recognizes $element", function () {
            var binding = "x: $element.id",
                node = { id: 42 },
                bindings = instance.parse(binding, node, {});
            assert.equal(bindings.x(), node.id)
        })
    })

    // pluck to get elements from deep in an object.
    //
    // Our pluck is "softer" than a standard lookup in the sense that
    // it will not throw an error if something is not found, but rather
    // return undefined.
    describe("make_accessor", function () {
        var obj = {
            a: {
                b: {
                    c: {
                        d: 1,
                        e: [9, 8]
                    }
                }
            },
            F1: function () { return 'R1' },
            F2: function () {
                return { G: function () { return 'R2' }}
            }
        }, pluck;
        beforeEach(function () {
            pluck = instance.make_accessor;
        })
        it("should pluck deep values from objects", function () {
            assert.deepEqual(pluck('a.b.c', obj)(),
                obj.a.b.c, 'a.b.c')
            assert.equal(pluck('a.b.c.d', obj)(), 1, "a.b.c.d")
            assert.equal(pluck('a.b.c.x', obj)(), undefined, "a.b.c.x")
            assert.equal(pluck('a.b.c.x', obj)(), undefined, "a.b.c.x")
            assert.equal(pluck('a.b.c.e.1', obj)(), 8, "a.b.c.e.1")
            assert.equal(pluck('x.r', obj)(), undefined, "x.r")
            assert.equal(pluck('x', obj)(), undefined, "x-undefined")
        })

        it("should call functions", function () {
            assert.equal(pluck("F1()", obj)(), "R1", "F1")
            assert.equal(pluck("F2().G()", obj)(), "R2", "F2")
        })
    }); // make_accessor

})
