describe('Binding: Enable/Disable', function() {
    beforeEach(prepareTestNode);

    it('Enable means the node is enabled only when the value is true', function () {
        var observable = new ko.observable();
        testNode.innerHTML = "<input data-bind='enable:myModelProperty()' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);

        expect(testNode.childNodes[0].disabled).to.deep.equal(true);
        observable(1);
        expect(testNode.childNodes[0].disabled).to.deep.equal(false);
    });

    it('Disable means the node is enabled only when the value is false', function () {
        var observable = new ko.observable();
        testNode.innerHTML = "<input data-bind='disable:myModelProperty()' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);

        expect(testNode.childNodes[0].disabled).to.deep.equal(false);
        observable(1);
        expect(testNode.childNodes[0].disabled).to.deep.equal(true);
    });

    it('Enable should unwrap observables implicitly', function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='enable:myModelProperty' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);
        expect(testNode.childNodes[0].disabled).to.deep.equal(true);
    });

    it('Disable should unwrap observables implicitly', function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='disable:myModelProperty' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);
        expect(testNode.childNodes[0].disabled).to.deep.equal(false);
    });
});
