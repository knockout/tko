
function copyDomNodeChildren(domNode) {
    var copy = [];
    for (var i = 0; i < domNode.childNodes.length; i++)
        copy.push(domNode.childNodes[i]);
    return copy;
}

describe('Array to DOM node children mapping', function() {
    beforeEach(prepareTestNode);

    it('Should populate the DOM node by mapping array elements', function () {
        var array = ["A", "B"];
        var mapping = function (arrayItem) {
            var output1 = document.createElement("DIV");
            var output2 = document.createElement("DIV");
            output1.innerHTML = arrayItem + "1";
            output2.innerHTML = arrayItem + "2";
            return [output1, output2];
        };
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, array, mapping);
        expect(testNode.childNodes.length).to.deep.equal(4);
        expect(testNode.childNodes[0].innerHTML).to.deep.equal("A1");
        expect(testNode.childNodes[1].innerHTML).to.deep.equal("A2");
        expect(testNode.childNodes[2].innerHTML).to.deep.equal("B1");
        expect(testNode.childNodes[3].innerHTML).to.deep.equal("B2");
    });

    it('Should only call the mapping function for new array elements', function () {
        var mappingInvocations = [];
        var mapping = function (arrayItem) {
            mappingInvocations.push(arrayItem);
            return null;
        };
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["A", "B"], mapping);
        expect(mappingInvocations).to.deep.equal(["A", "B"]);

        mappingInvocations = [];
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["A", "A2", "B"], mapping);
        expect(mappingInvocations).to.deep.equal(["A2"]);
    });

    it('Should retain existing node instances if the array is unchanged', function () {
        var array = ["A", "B"];
        var mapping = function (arrayItem) {
            var output1 = document.createElement("DIV");
            var output2 = document.createElement("DIV");
            output1.innerHTML = arrayItem + "1";
            output2.innerHTML = arrayItem + "2";
            return [output1, output2];
        };

        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, array, mapping);
        var existingInstances = copyDomNodeChildren(testNode);

        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, array, mapping);
        var newInstances = copyDomNodeChildren(testNode);

        expect(newInstances).to.deep.equal(existingInstances);
    });

    it('Should insert added nodes at the corresponding place in the DOM', function () {
        var mappingInvocations = [];
        var mapping = function (arrayItem) {
            mappingInvocations.push(arrayItem);
            var output = document.createElement("DIV");
            output.innerHTML = arrayItem;
            return [output];
        };

        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["A", "B"], mapping);
        expect(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).to.deep.equal(["A", "B"]);
        expect(mappingInvocations).to.deep.equal(["A", "B"]);

        mappingInvocations = [];
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["first", "A", "middle1", "middle2", "B", "last"], mapping);
        expect(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).to.deep.equal(["first", "A", "middle1", "middle2", "B", "last"]);
        expect(mappingInvocations).to.deep.equal(["first", "middle1", "middle2", "last"]);
    });

    it('Should remove deleted nodes from the DOM', function () {
        var mappingInvocations = [];
        var mapping = function (arrayItem) {
            mappingInvocations.push(arrayItem);
            var output = document.createElement("DIV");
            output.innerHTML = arrayItem;
            return [output];
        };

        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["first", "A", "middle1", "middle2", "B", "last"], mapping);
        expect(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).to.deep.equal(["first", "A", "middle1", "middle2", "B", "last"]);
        expect(mappingInvocations).to.deep.equal(["first", "A", "middle1", "middle2", "B", "last"]);

        mappingInvocations = [];
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["A", "B"], mapping);
        expect(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).to.deep.equal(["A", "B"]);
        expect(mappingInvocations).to.deep.equal([]);
    });

    it('Should tolerate DOM nodes being removed manually, before the corresponding array entry is removed', function() {
        // Represents https://github.com/SteveSanderson/knockout/issues/413
        // Ideally, people wouldn't be mutating the generated DOM manually. But this didn't error in v2.0, so we should try to avoid introducing a break.
        var mappingInvocations = [];
        var mapping = function (arrayItem) {
            mappingInvocations.push(arrayItem);
            var output = document.createElement("DIV");
            output.innerHTML = arrayItem;
            return [output];
        };

        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["A", "B", "C"], mapping);
        expectContainHtml(testNode, "<div>a</div><div>b</div><div>c</div>");

        // Now kill the middle DIV manually, even though people shouldn't really do this
        var elemToRemove = testNode.childNodes[1];
        expect(elemToRemove.innerHTML).to.deep.equal("B"); // Be sure it's the right one
        elemToRemove.parentNode.removeChild(elemToRemove);

        // Now remove the corresponding array entry. This shouldn't cause an exception.
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["A", "C"], mapping);
        expectContainHtml(testNode, "<div>a</div><div>c</div>");
    });

    it('Should handle sequences of mixed insertions and deletions', function () {
        var mappingInvocations = [], countCallbackInvocations = 0;
        var mapping = function (arrayItem) {
            mappingInvocations.push(arrayItem);
            var output = document.createElement("DIV");
            output.innerHTML = ko.utils.unwrapObservable(arrayItem) || "null";
            return [output];
        };
        var callback = function(arrayItem, nodes) {
            ++countCallbackInvocations;
            expect(mappingInvocations[mappingInvocations.length-1]).to.deep.equal(arrayItem);
        }

        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["A"], mapping, null, callback);
        expect(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).to.deep.equal(["A"]);
        expect(mappingInvocations).to.deep.equal(["A"]);
        expect(countCallbackInvocations).to.deep.equal(mappingInvocations.length);

        mappingInvocations = [], countCallbackInvocations = 0;
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["B"], mapping, null, callback); // Delete and replace single item
        expect(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).to.deep.equal(["B"]);
        expect(mappingInvocations).to.deep.equal(["B"]);
        expect(countCallbackInvocations).to.deep.equal(mappingInvocations.length);

        mappingInvocations = [], countCallbackInvocations = 0;
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["A", "B", "C"], mapping, null, callback); // Add at beginning and end
        expect(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).to.deep.equal(["A", "B", "C"]);
        expect(mappingInvocations).to.deep.equal(["A", "C"]);
        expect(countCallbackInvocations).to.deep.equal(mappingInvocations.length);

        mappingInvocations = [], countCallbackInvocations = 0;
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, ["C", "B", "A"], mapping, null, callback); // Move items
        expect(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).to.deep.equal(["C", "B", "A"]);
        expect(mappingInvocations).to.deep.equal([]);
        expect(countCallbackInvocations).to.deep.equal(mappingInvocations.length);

        // Check that observable items can be added and unwrapped in the mapping function and will update the DOM.
        // Also check that observables accessed in the callback function do not update the DOM.
        mappingInvocations = [], countCallbackInvocations = 0;
        var observable = ko.observable(1), callbackObservable = ko.observable(1);
        var callback2 = function(arrayItem, nodes) {
            callbackObservable();
            callback(arrayItem, nodes);
        };
        ko.utils.setDomNodeChildrenFromArrayMapping(testNode, [observable, null, "B"], mapping, null, callback2); // Add to beginning; delete from end
        expect(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).to.deep.equal(["1", "null", "B"]);
        expect(mappingInvocations).to.deep.equal([observable, null]);
        expect(countCallbackInvocations).to.deep.equal(mappingInvocations.length);

        // Change the value of the mapped observable and verify that the DOM is updated
        mappingInvocations = [], countCallbackInvocations = 0;
        observable(2);
        expect(ko.utils.arrayMap(testNode.childNodes, function (x) { return x.innerHTML })).to.deep.equal(["2", "null", "B"]);
        expect(mappingInvocations).to.deep.equal([observable]);
        expect(countCallbackInvocations).to.deep.equal(mappingInvocations.length);

        // Change the value of the callback observable and verify that the DOM wasn't updated
        mappingInvocations = [], countCallbackInvocations = 0;
        callbackObservable(2);
        expect(mappingInvocations.length).to.deep.equal(0);
        expect(countCallbackInvocations).to.deep.equal(0);
    });
});
