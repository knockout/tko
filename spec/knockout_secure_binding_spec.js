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

        /* TODO: comments
         see eg https://github.com/rniemeyer/knockout-classBindingProvider/blob/master/spec/knockout-classBindingProvider.spec.js
         */
     })

    describe("the value parser", function () {
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

        it("Looks up words on our $context", function () {

        })
    })

    describe("getBindings", function() {
        var div;

        beforeEach(function() {
            div = document.createElement("div")
            div.setAttribute("data-sbind", "alpha: '123'")
        })

        describe("returns the appropriate binding", function () {
            instance.bindings.alpha = function () {};
            assert.equal(instance.getBindings(div),
                instance.bindings.alpha)
        })


    })
})
