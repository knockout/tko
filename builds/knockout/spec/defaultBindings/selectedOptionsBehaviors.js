describe('Binding: Selected Options', function() {
    beforeEach(prepareTestNode);

    it('Should only be applicable to SELECT nodes', function () {
        var threw = false;
        testNode.innerHTML = "<input data-bind='selectedOptions:[]' />";
        try { ko.applyBindings({}, testNode); }
        catch (ex) { threw = true; }
        expect(threw).to.deep.equal(true);
    });

    it('Should set selection in the SELECT node to match the model', function () {
        var bObject = {};
        var values = new ko.observableArray(["A", bObject, "C"]);
        var selection = new ko.observableArray([bObject]);
        testNode.innerHTML = "<select multiple='multiple' data-bind='options:myValues, selectedOptions:mySelection'></select>";
        ko.applyBindings({ myValues: values, mySelection: selection }, testNode);

        expectHaveSelectedValues(testNode.childNodes[0], [bObject]);
        selection.push("C");
        expectHaveSelectedValues(testNode.childNodes[0], [bObject, "C"]);
    });

    it('Should update the model when selection in the SELECT node changes', function () {
        function setMultiSelectOptionSelectionState(optionElement, state) {
            // Workaround an IE 6 bug (http://benhollis.net/experiments/browserdemos/ie6-adding-options.html)
            if (/MSIE 6/i.test(navigator.userAgent))
                optionElement.setAttribute('selected', state);
            else
                optionElement.selected = state;
        }

        var cObject = {};
        var values = new ko.observableArray(["A", "B", cObject]);
        var selection = new ko.observableArray(["B"]);
        testNode.innerHTML = "<select multiple='multiple' data-bind='options:myValues, selectedOptions:mySelection'></select>";
        ko.applyBindings({ myValues: values, mySelection: selection }, testNode);

        expect(selection()).to.deep.equal(["B"]);
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0], true);
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[1], false);
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[2], true);
        ko.utils.triggerEvent(testNode.childNodes[0], "change");

        expect(selection()).to.deep.equal(["A", cObject]);
        expect(selection()[1] === cObject).to.deep.equal(true); // Also check with strict equality, because we don't want to falsely accept [object Object] == cObject
    });

    it('Should update the model when selection in the SELECT node changes for non-observable property values', function () {
        function setMultiSelectOptionSelectionState(optionElement, state) {
            // Workaround an IE 6 bug (http://benhollis.net/experiments/browserdemos/ie6-adding-options.html)
            if (/MSIE 6/i.test(navigator.userAgent))
                optionElement.setAttribute('selected', state);
            else
                optionElement.selected = state;
        }

        var cObject = {};
        var values = new ko.observableArray(["A", "B", cObject]);
        var selection = ["B"];
        var myModel = { myValues: values, mySelection: selection };
        testNode.innerHTML = "<select multiple='multiple' data-bind='options:myValues, selectedOptions:mySelection'></select>";
        ko.applyBindings(myModel, testNode);

        expect(myModel.mySelection).to.deep.equal(["B"]);
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0], true);
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[1], false);
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[2], true);
        ko.utils.triggerEvent(testNode.childNodes[0], "change");

        expect(myModel.mySelection).to.deep.equal(["A", cObject]);
        expect(myModel.mySelection[1] === cObject).to.deep.equal(true); // Also check with strict equality, because we don't want to falsely accept [object Object] == cObject
    });

    it('Should update the model when selection in the SELECT node inside an optgroup changes', function () {
        function setMultiSelectOptionSelectionState(optionElement, state) {
            // Workaround an IE 6 bug (http://benhollis.net/experiments/browserdemos/ie6-adding-options.html)
            if (/MSIE 6/i.test(navigator.userAgent))
                optionElement.setAttribute('selected', state);
            else
                optionElement.selected = state;
        }

        var selection = new ko.observableArray([]);
        testNode.innerHTML = "<select multiple='multiple' data-bind='selectedOptions:mySelection'><optgroup label='group'><option value='a'>a-text</option><option value='b'>b-text</option><option value='c'>c-text</option></optgroup></select>";
        ko.applyBindings({ mySelection: selection }, testNode);

        expect(selection()).to.deep.equal([]);

        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0].childNodes[0], true);
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0].childNodes[1], false);
        setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0].childNodes[2], true);
        ko.utils.triggerEvent(testNode.childNodes[0], "change");

        expect(selection()).to.deep.equal(['a', 'c']);
    });

    it('Should set selection in the SELECT node inside an optgroup to match the model', function () {
        var selection = new ko.observableArray(['a']);
        testNode.innerHTML = "<select multiple='multiple' data-bind='selectedOptions:mySelection'><optgroup label='group'><option value='a'>a-text</option><option value='b'>b-text</option><option value='c'>c-text</option></optgroup><optgroup label='group2'><option value='d'>d-text</option></optgroup></select>";
        ko.applyBindings({ mySelection: selection }, testNode);

        expectHaveSelectedValues(testNode.childNodes[0].childNodes[0], ['a']);
        expectHaveSelectedValues(testNode.childNodes[0].childNodes[1], []);
        selection.push('c');
        expectHaveSelectedValues(testNode.childNodes[0].childNodes[0], ['a', 'c']);
        expectHaveSelectedValues(testNode.childNodes[0].childNodes[1], []);
        selection.push('d');
        expectHaveSelectedValues(testNode.childNodes[0].childNodes[0], ['a', 'c']);
        expectHaveSelectedValues(testNode.childNodes[0].childNodes[1], ['d']);
    });

    it('Should not change the scroll position when updating the view', function() {
        var selection = ko.observableArray(), data = [];
        for (var i = 1; i < 101; i++) {
            data.push({ code: '0000' + i, name: 'Item ' + i });
        }

        testNode.innerHTML = "<select multiple=\"multiple\" data-bind=\"options: data, optionsText: 'name', optionsValue: 'code', selectedOptions: selectedItems\"></select>";
        ko.applyBindings({ selectedItems: selection, data: data }, testNode);

        var selectElem = testNode.childNodes[0];
        expect(selectElem.scrollTop).to.equal(0);
        expectHaveSelectedValues(selectElem, []);

        selection.push('0000100');
        expect(selectElem.scrollTop).to.equal(0);
        expectHaveSelectedValues(selectElem, ['0000100']);

        selectElem.scrollTop = 80;
        var previousScrollTop = selectElem.scrollTop;   // some browsers modify the scrollTop right away
        selection.push('000050');
        expect(selectElem.scrollTop).to.equal(previousScrollTop);
        expectHaveSelectedValues(selectElem, ['000050', '0000100']);
    });
});
