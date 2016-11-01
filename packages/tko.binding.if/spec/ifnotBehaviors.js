
import {
    applyBindings, contextFor
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

import {
  bindings as ifBindings,
  // setTemplateEngine,
  // templateEngine,
  // nativeTemplateEngine
} from '../index.js';
import {bindings as coreBindings} from 'tko.binding.core';

import 'tko.utils/helpers/jasmine-13-helper.js';


describe('Binding: Ifnot', function() {
    beforeEach(jasmine.prepareTestNode);

    beforeEach(function(){
        var provider = new Provider();
        options.bindingProviderInstance = provider;
        provider.bindingHandlers.set(coreBindings);
        provider.bindingHandlers.set(ifBindings);
    });

    it('Should remove descendant nodes from the document (and not bind them) if the value is truey', function() {
        testNode.innerHTML = "<div data-bind='ifnot: condition'><span data-bind='text: someItem.nonExistentChildProp'></span></div>";
        expect(testNode.childNodes[0].childNodes.length).toEqual(1);
        applyBindings({ someItem: null, condition: true }, testNode);
        expect(testNode.childNodes[0].childNodes.length).toEqual(0);
    });

    xit('Should leave descendant nodes in the document (and bind them) if the value is falsey, independently of the active template engine', function() {
        this.after(function() { setTemplateEngine(new nativeTemplateEngine()); });

        setTemplateEngine(new templateEngine()); // This template engine will just throw errors if you try to use it
        testNode.innerHTML = "<div data-bind='ifnot: condition'><span data-bind='text: someItem.existentChildProp'></span></div>";
        expect(testNode.childNodes.length).toEqual(1);
        applyBindings({ someItem: { existentChildProp: 'Child prop value' }, condition: false }, testNode);
        expect(testNode.childNodes[0].childNodes.length).toEqual(1);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("Child prop value");
    });

    it('Should leave descendant nodes unchanged if the value is falsey and remains falsey when changed', function() {
        var someItem = observable(false);
        testNode.innerHTML = "<div data-bind='ifnot: someItem'><span data-bind='text: someItem()'></span></div>";
        var originalNode = testNode.childNodes[0].childNodes[0];

        // Value is initially true, so nodes are retained
        applyBindings({ someItem: someItem }, testNode);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("false");
        expect(testNode.childNodes[0].childNodes[0]).toEqual(originalNode);

        // Change the value to a different falsey value
        someItem(0);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("0");
        expect(testNode.childNodes[0].childNodes[0]).toEqual(originalNode);
    });

    it('Should toggle the presence and bindedness of descendant nodes according to the falsiness of the value', function() {
        var someItem = observable(undefined);
        var condition = observable(true);
        testNode.innerHTML = "<div data-bind='ifnot: condition'><span data-bind='text: someItem().occasionallyExistentChildProp'></span></div>";
        applyBindings({ someItem: someItem, condition: condition }, testNode);

        // First it's not there
        expect(testNode.childNodes[0].childNodes.length).toEqual(0);

        // Then it's there
        someItem({ occasionallyExistentChildProp: 'Child prop value' });
        condition(false);
        expect(testNode.childNodes[0].childNodes.length).toEqual(1);
        expect(testNode.childNodes[0].childNodes[0]).toContainText("Child prop value");

        // Then it's gone again
        condition(true);
        someItem(null);
        expect(testNode.childNodes[0].childNodes.length).toEqual(0);
    });

    it('Should not interfere with binding context', function() {
        testNode.innerHTML = "<div data-bind='ifnot: false'>Parents: <span data-bind='text: $parents.length'></span></div>";
        applyBindings({ }, testNode);
        expect(testNode.childNodes[0]).toContainText("Parents: 0");
        expect(contextFor(testNode.childNodes[0].childNodes[1]).$parents.length).toEqual(0);
    });
});