
import {
    tasks, options
} from 'tko.utils';

import {
    unwrap,
    observable as Observable,
    observableArray as ObservableArray
} from 'tko.observable';

import {
    Provider
} from 'tko.provider';

import {bindings as coreBindings} from 'tko.binding.core';
import {bindings as templateBindings} from 'tko.binding.template';

import {
    applyBindings
} from '../index';

import {
    useMockForTasks
} from 'tko.utils/helpers/jasmine-13-helper.js';

import 'core-js/fn/object/assign'


describe("Deferred bindings", function() {
    var bindingSpy, bindingHandlers;

    beforeEach(function () {
        jasmine.prepareTestNode();
        useMockForTasks(options);
        options.deferUpdates = true;
        var provider = new Provider();
        options.bindingProviderInstance = provider;
        bindingHandlers = provider.bindingHandlers;
        bindingHandlers.set(coreBindings);
        bindingHandlers.set(templateBindings);

        bindingSpy = jasmine.createSpy('bindingSpy');
        bindingHandlers.test = {
            init: function (element, valueAccessor) {
                bindingSpy('init', unwrap(valueAccessor()));
            },
            update: function (element, valueAccessor) {
                bindingSpy('update', unwrap(valueAccessor()));
            }
        };
    });
    afterEach(function() {
        expect(tasks.resetForTesting()).toEqual(0);
        jasmine.Clock.reset();
        options.deferUpdates = false;
        bindingSpy = bindingHandlers.test = null;
    });

    it("Should update bindings asynchronously", function() {
        var observable = Observable('A');

        // The initial "applyBindings" is synchronous
        testNode.innerHTML = "<div data-bind='test: myObservable'></div>";
        applyBindings({ myObservable: observable }, testNode);
        expect(bindingSpy.argsForCall).toEqual([ ['init', 'A'], ['update', 'A'] ]);

        // When changing the observable, the update is deferred
        bindingSpy.reset();
        observable('B');
        expect(bindingSpy).not.toHaveBeenCalled();

        // Update is still deferred
        observable('C');
        expect(bindingSpy).not.toHaveBeenCalled();

        jasmine.Clock.tick(1);
        // Only the latest value is notified
        expect(bindingSpy.argsForCall).toEqual([ ['update', 'C'] ]);
    });

    it("Should update templates asynchronously", function() {
        var observable = Observable('A');

        testNode.innerHTML = "<div data-bind='template: {data: myObservable}'><div data-bind='test: $data'></div></div>";
        applyBindings({ myObservable: observable }, testNode);
        expect(bindingSpy.argsForCall).toEqual([ ['init', 'A'], ['update', 'A'] ]);

        // mutate; template should not be updated yet
        bindingSpy.reset();
        observable('B');
        expect(bindingSpy).not.toHaveBeenCalled();

        // mutate again; template should not be updated yet
        observable('C');
        expect(bindingSpy).not.toHaveBeenCalled();

        jasmine.Clock.tick(1);
        // only the latest value should be used
        expect(bindingSpy.argsForCall).toEqual([ ['init', 'C'], ['update', 'C'] ]);
    });

    it("Should update 'foreach' items asynchronously", function() {
        var observable = ObservableArray(["A"]);

        testNode.innerHTML = "<div data-bind='foreach: {data: myObservables}'><div data-bind='test: $data'></div></div>";
        applyBindings({ myObservables: observable }, testNode);
        expect(bindingSpy.argsForCall).toEqual([ ['init', 'A'], ['update', 'A'] ]);

        // mutate; template should not be updated yet
        bindingSpy.reset();
        observable(["A", "B"]);
        expect(bindingSpy).not.toHaveBeenCalled();

        // mutate again; template should not be updated yet
        observable(["A", "C"]);
        expect(bindingSpy).not.toHaveBeenCalled();

        jasmine.Clock.tick(1);
        // only the latest value should be used ("C" added but not "B")
        expect(bindingSpy.argsForCall).toEqual([ ['init', 'C'], ['update', 'C'] ]);

        // When an element is deleted and then added in a new place, it should register as a move and
        // not create new DOM elements or update any child bindings
        bindingSpy.reset();
        observable.remove("A");
        observable.push("A");

        var nodeA = testNode.childNodes[0].childNodes[0],
            nodeB = testNode.childNodes[0].childNodes[1];
        jasmine.Clock.tick(1);
        expect(bindingSpy).not.toHaveBeenCalled();
        expect(testNode.childNodes[0].childNodes[0]).toBe(nodeB);
        expect(testNode.childNodes[0].childNodes[1]).toBe(nodeA);
    });

    it("Should be able to force an update using runEarly", function() {
        // This is based on the logic used in https://github.com/rniemeyer/knockout-sortable that when an item
        // is dragged and dropped in the same list, it must be deleted and re-added instead of being moved.

        testNode.innerHTML = "<div data-bind='foreach: someItems'><span data-bind='text: childProp'></span></div>";
        var someItems = ObservableArray([
            { childProp: 'first child' },
            { childProp: 'second child' },
            { childProp: 'moving child' }
        ]);
        applyBindings({ someItems: someItems }, testNode);
        expect(testNode.childNodes[0]).toContainHtml('<span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span><span data-bind="text: childprop">moving child</span>');

        var sourceIndex = 2,
            targetIndex = 0,
            itemNode = testNode.childNodes[0].childNodes[sourceIndex],
            item = someItems()[sourceIndex];

        // Simply removing and re-adding item isn't sufficient because it will be registered as a move and no new element will be added
        // Using tasks.runEarly between the updates ensures that the binding sees each individual update
        someItems.splice(sourceIndex, 1);
        tasks.runEarly();
        someItems.splice(targetIndex, 0, item);

        jasmine.Clock.tick(1);
        expect(testNode.childNodes[0]).toContainHtml('<span data-bind="text: childprop">moving child</span><span data-bind="text: childprop">first child</span><span data-bind="text: childprop">second child</span>');
        expect(testNode.childNodes[0].childNodes[targetIndex]).not.toBe(itemNode);    // node was create anew so it's not the same
    });

    it('Should not throw an exception for value binding on multiple select boxes', function() {
        testNode.innerHTML = "<select data-bind=\"options: ['abc','def','ghi'], value: x\"></select><select data-bind=\"options: ['xyz','uvw'], value: x\"></select>";
        var observable = Observable();
        expect(function() {
            applyBindings({ x: observable }, testNode);
            jasmine.Clock.tick(1);
        }).not.toThrow();
        expect(observable()).not.toBeUndefined();       // The spec doesn't specify which of the two possible values is actually set
    });
});
