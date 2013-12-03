/*
TODO: comments
see eg https://github.com/rniemeyer/knockout-classBindingProvider/blob/master/spec/knockout-classBindingProvider.spec.js
*/

describe("Knockout Secure Binding", function () {
    var instance;

    beforeEach(function () {
        instance = new ko.secureBindingsProvider();
    })

    it("Has loaded knockout", function () {
        assert.property(window, 'ko')
    })

    it("secureBindingsProvider exist on 'ko'", function () {
        // note that it could alternatively be exported with `require`
        assert.property(ko, 'secureBindingsProvider')
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

    describe("getBindings", function() {
        var div;

        beforeEach(function() {
            div = document.createElement("div");
            div.setAttribute("data-sbind", 'alpha: "122.9"');
        });

        it("returns the appropriate binding", function () {
            instance.bindings.alpha = function () {};
            var bindings = instance.getBindings(div);

            assert.equal(Object.keys(bindings).length, 1)
            assert.equal(bindings['alpha'], instance.bindings.alpha)
        });
    })

    describe("the bindings parser", function () {
        it("parses bindings with JSON values", function () {
            var binding_string = 'a: "A", b: 1, c: 2.1, d: ["X", "Y"], e: {"R": "V"}, t: true, f: false, n: null',
            value = instance.parse(binding_string);
            assert.equal(value.a, "A", "string");
            assert.equal(value.b, 1, "int");
            assert.equal(value.c, 2.1, "float");
            assert.deepEqual(value.d, ["X",  "Y"], "array");
            assert.deepEqual(value.e, {"R": "V"}, "object");
            assert.equal(value.t, true, "true");
            assert.equal(value.f, false, "false");
            assert.equal(value.n, null, "null");
        })

        it("undefined keyword works", function () {
            var value = instance.parse("y: undefined");
            assert.equal(value.y, void 0);
        })

        it("Looks up constant on the given context", function () {
            var binding = "a: x",
            context = { x: 'y' },
            bindings = instance.parse(binding, context);
            assert.equal(bindings.a, "y");
        })
    })

    describe("applying bindings", function () {
        it("updates the value", function () {
            var div = document.createElement("div"),
            vm = { X1: 'Y1' };

            div.setAttribute("data-sbind", "text: X1")
            ko.bindingProvider.instance = instance;
            ko.applyBindings(vm, div);
            assert.equal(div.innerText, 'Y1');
        })
    })

    // pluck to get elements from deep in an object.
    //
    // Our pluck is "softer" than a standard lookup in the sense that
    // it will not throw an error if something is not found, but rather
    // return undefined.
    describe("pluck", function () {
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
            pluck = instance.pluck_function;
        })
        it("should pluck deep values from objects", function () {
            assert.deepEqual(pluck('a.b.c')(obj),
                obj.a.b.c, 'a.b.c')
            assert.equal(pluck('a.b.c.d')(obj), 1, "a.b.c.d")
            assert.equal(pluck('a.b.c.x')(obj), undefined, "a.b.c.x")
            assert.equal(pluck('a.b.c.x')(obj), undefined, "a.b.c.x")
            assert.equal(pluck('a.b.c.e.1')(obj), 8, "a.b.c.e.1")
            assert.equal(pluck('x.r')(obj), undefined, "x.r")
            assert.equal(pluck('x')(obj), undefined, "x-undefined")
        })

        it("should call functions", function () {
            assert.equal(pluck("F1()")(obj), "R1", "F1")
            assert.equal(pluck("F2().G()")(obj), "R2", "F2")
        })
    });

})
