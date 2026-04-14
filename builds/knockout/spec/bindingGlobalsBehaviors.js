describe('options.bindingGlobals', function() {
    beforeEach(prepareTestNode);

    it('references the global window by default', function() {
        after(function () { ko.cleanNode(document.body); });     // Just to avoid interfering with other specs

        window.testFoo = "bar";
        testNode.innerHTML = "<div id='testFoo' data-bind='text: testFoo'></div>";
        ko.applyBindings();
        expect(document.getElementById("testFoo").innerText).to.deep.equal("bar");
    });

    it.skip('is reassignable (https://github.com/knockout/tko/issues/166)', function() {
        this.skip();
        ko.options.bindingGlobals = {foo: "bar"};
        testNode.innerHTML = "<div id='testFoo' data-bind='text: foo'></div>";
        ko.applyBindings();
        expect(document.getElementById("testFoo").innerText).to.deep.equal("bar");
    });
});
