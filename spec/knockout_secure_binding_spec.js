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
        it("parses regular JSON", function () {
            var obj = {
                "a": "A",
                "b": 1,
                "c": 2.1,
                "d": ['x', 'y'],
                "e": { 'r': 'v' },
                "t": true,
                "f": false,
                "n": null,
            },
            value = instance.parse(JSON.stringify(obj));
            assert.deepEqual(value, obj)
        })

        it("undefined keyword works", function () {
            var value = instance.parse("undefined");
            assert.equal(value, void 0);
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
