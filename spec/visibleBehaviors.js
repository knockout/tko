import {
    applyBindings
} from 'tko.bind';

import {
    observable
} from 'tko.observable';

import {
    Provider
} from 'tko.provider';

import {
    options
} from 'tko.utils';

import * as coreBindings from '../index.js';

import '../node_modules/tko.utils/helpers/jasmine-13-helper.js';

describe('Binding: Visible', function() {
    beforeEach(jasmine.prepareTestNode);

    beforeEach(function(){
        var provider = new Provider()
        options.bindingProviderInstance = provider
        bindingHandlers = provider.bindingHandlers
        bindingHandlers.set(coreBindings.bindings);
    });

    it('Should display the node only when the value is true', function () {
        var myObservable = observable(false);
        testNode.innerHTML = "<input data-bind='visible:myModelProperty()' />";
        applyBindings({ myModelProperty: myObservable }, testNode);

        expect(testNode.childNodes[0].style.display).toEqual("none");
        myObservable(true);
        expect(testNode.childNodes[0].style.display).toEqual("");
    });

    it('Should unwrap observables implicitly', function () {
        var myObservable = observable(false);
        testNode.innerHTML = "<input data-bind='visible:myModelProperty' />";
        applyBindings({ myModelProperty: myObservable }, testNode);
        expect(testNode.childNodes[0].style.display).toEqual("none");
    });
});
