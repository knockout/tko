import {
    applyBindings
} from 'tko.bind';

import {
    Provider
} from 'tko.provider';

import {
    options
} from 'tko.utils';

import {bindings as coreBindings} from '../index.js';

import 'tko.utils/helpers/jasmine-13-helper.js';

describe('Binding: Unique Name', function() {
    beforeEach(jasmine.prepareTestNode);

    beforeEach(function(){
        var provider = new Provider();
        options.bindingProviderInstance = provider;
        provider.bindingHandlers.set(coreBindings);
    });

    it('Should apply a different name to each element', function () {
        testNode.innerHTML = "<div data-bind='uniqueName: true'></div><div data-bind='uniqueName: true'></div>";
        applyBindings({}, testNode);

        expect(testNode.childNodes[0].name.length > 0).toEqual(true);
        expect(testNode.childNodes[1].name.length > 0).toEqual(true);
        expect(testNode.childNodes[0].name === testNode.childNodes[1].name).toEqual(false);
    });
});
