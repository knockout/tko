import {
    applyBindings
} from 'tko.bind';

import {
    triggerEvent
} from 'tko.utils';

import {
    Provider
} from 'tko.provider';

import {
    options
} from 'tko.utils';

import * as coreBindings from '../index.js';

import '../node_modules/tko.utils/helpers/jasmine-13-helper.js';

describe('Binding: Submit', function() {
    beforeEach(jasmine.prepareTestNode);

    beforeEach(function(){
        var provider = new Provider()
        options.bindingProviderInstance = provider
        bindingHandlers = provider.bindingHandlers
        bindingHandlers.set(coreBindings.bindings);
    });

    it('Should invoke the supplied function on submit and prevent default action, using model as \'this\' param and the form node as a param to the handler', function () {
        var firstParamStored;
        var model = { wasCalled: false, doCall: function (firstParam) { this.wasCalled = true; firstParamStored = firstParam; } };
        testNode.innerHTML = "<form data-bind='submit:doCall' />";
        var formNode = testNode.childNodes[0];
        applyBindings(model, testNode);
        triggerEvent(testNode.childNodes[0], "submit");
        expect(model.wasCalled).toEqual(true);
        expect(firstParamStored).toEqual(formNode);
    });
});
