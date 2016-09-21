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

import {bindings as coreBindings} from '../index.js';

import '../node_modules/tko.utils/helpers/jasmine-13-helper.js';

describe('Binding: CSS style', function() {
    beforeEach(jasmine.prepareTestNode);

    beforeEach(function(){
        var provider = new Provider();
        options.bindingProviderInstance = provider;
        provider.bindingHandlers.set(coreBindings);
    });

    it('Should give the element the specified CSS style value', function () {
        var myObservable = observable("red");
        testNode.innerHTML = "<div data-bind='style: { backgroundColor: colorValue }'>Hallo</div>";
        applyBindings({ colorValue: myObservable }, testNode);

        expect(testNode.childNodes[0].style.backgroundColor).toEqualOneOf(["red", "#ff0000"]); // Opera returns style color values in #rrggbb notation, unlike other browsers
        myObservable("green");
        expect(testNode.childNodes[0].style.backgroundColor).toEqualOneOf(["green", "#008000"]);
        myObservable(undefined);
        expect(testNode.childNodes[0].style.backgroundColor).toEqual("");
    });

    it('Should be able to apply the numeric value zero to a style', function() {
        // Represents https://github.com/knockout/knockout/issues/972
        testNode.innerHTML = "<div data-bind='style: { width: 0 }'></div>";
        applyBindings(null, testNode);
        expect(testNode.childNodes[0].style.width).toBe("0px");
    });

    it('Should be able to use "false" to remove a style', function() {
        // Verifying that the fix for 972 doesn't break this existing behaviour
        testNode.innerHTML = "<div style='width: 100px' data-bind='style: { width: false }'></div>";
        applyBindings(null, testNode);
        expect(testNode.childNodes[0].style.width).toBe("");
    });
});
