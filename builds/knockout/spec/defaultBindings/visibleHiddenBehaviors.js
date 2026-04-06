import '../../helpers/mocha-test-helpers.js'

describe('Binding: Visible/Hidden', function() {
    beforeEach(prepareTestNode);

    it('Visible means the node is only visible when the value is true', function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='visible:myModelProperty()' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);

        expect(testNode.childNodes[0].style.display).to.deep.equal("none");
        observable(true);
        expect(testNode.childNodes[0].style.display).to.deep.equal("");
    });

    it('Visible should unwrap observables implicitly', function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='visible:myModelProperty' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);
        expect(testNode.childNodes[0].style.display).to.deep.equal("none");
    });

    it('Hidden means the node is only visible when the value is false', function () {
        var observable = new ko.observable(false);
        testNode.innerHTML = "<input data-bind='hidden:myModelProperty()' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);

        expect(testNode.childNodes[0].style.display).to.deep.equal("");
        observable(true);
        expect(testNode.childNodes[0].style.display).to.deep.equal("none");
    });

    it('Hidden should unwrap observables implicitly', function () {
        var observable = new ko.observable(true);
        testNode.innerHTML = "<input data-bind='hidden:myModelProperty' />";
        ko.applyBindings({ myModelProperty: observable }, testNode);
        expect(testNode.childNodes[0].style.display).to.deep.equal("none");
    });
});
