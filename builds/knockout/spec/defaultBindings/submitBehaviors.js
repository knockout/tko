import { expect } from 'chai'
import '../../helpers/mocha-test-helpers.js'

describe('Binding: Submit', function() {
    beforeEach(prepareTestNode);

    it('Should invoke the supplied function on submit and prevent default action, using model as \'this\' param and the form node as a param to the handler', function () {
        var firstParamStored;
        var model = { wasCalled: false, doCall: function (firstParam) { this.wasCalled = true; firstParamStored = firstParam; } };
        testNode.innerHTML = "<form data-bind='submit:doCall' />";
        var formNode = testNode.childNodes[0];
        ko.applyBindings(model, testNode);
        ko.utils.triggerEvent(testNode.childNodes[0], "submit");
        expect(model.wasCalled).to.deep.equal(true);
        expect(firstParamStored).to.deep.equal(formNode);
    });
});
