
import {
    observableArray, observable, isObservable, subscribable
} from '../index.js';

describe('Observable Array', function() {
    var testObservableArray, notifiedValues, beforeNotifiedValues;

    beforeEach(function () {
        testObservableArray = new observableArray([1, 2, 3]);
        notifiedValues = [];
        testObservableArray.subscribe(function (value) {
            notifiedValues.push(value ? value.slice(0) : value);
        });
        beforeNotifiedValues = [];
        testObservableArray.subscribe(function (value) {
            beforeNotifiedValues.push(value ? value.slice(0) : value);
        }, null, "beforeChange");
    });

    it('Should be observable', function () {
        expect(isObservable(testObservableArray)).toEqual(true);
    });

    it('Should initialize to empty array if you pass no args to constructor', function() {
        var instance = new observableArray();
        expect(instance().length).toEqual(0);
    });

    it('Should require constructor arg, if given, to be array-like or null or undefined', function() {
        // Try non-array-like args
        expect(function () { observableArray(1); }).toThrow();
        expect(function () { observableArray({}); }).toThrow();

        // Try allowed args
        expect((new observableArray([1,2,3]))().length).toEqual(3);
        expect((new observableArray(null))().length).toEqual(0);
        expect((new observableArray(undefined))().length).toEqual(0);
    });

    it('Should be able to write values to it', function () {
        testObservableArray(['X', 'Y']);
        expect(notifiedValues.length).toEqual(1);
        expect(notifiedValues[0][0]).toEqual('X');
        expect(notifiedValues[0][1]).toEqual('Y');
    });

    it('Should be able to mark single items as destroyed', function() {
        var x = {}, y = {};
        testObservableArray([x, y]);
        testObservableArray.destroy(y);
        expect(testObservableArray().length).toEqual(2);
        expect(x._destroy).toEqual(undefined);
        expect(y._destroy).toEqual(true);
    });

    it('Should be able to mark multiple items as destroyed', function() {
        var x = {}, y = {}, z = {};
        testObservableArray([x, y, z]);
        testObservableArray.destroyAll([x, z]);
        expect(testObservableArray().length).toEqual(3);
        expect(x._destroy).toEqual(true);
        expect(y._destroy).toEqual(undefined);
        expect(z._destroy).toEqual(true);
    });

    it('Should be able to mark observable items as destroyed', function() {
        var x = observable(), y = observable();
        testObservableArray([x, y]);
        testObservableArray.destroy(y);
        expect(testObservableArray().length).toEqual(2);
        expect(x._destroy).toEqual(undefined);
        expect(y._destroy).toEqual(true);
    });

    it('Should be able to mark all items as destroyed by passing no args to destroyAll()', function() {
        var x = {}, y = {}, z = {};
        testObservableArray([x, y, z]);
        testObservableArray.destroyAll();
        expect(testObservableArray().length).toEqual(3);
        expect(x._destroy).toEqual(true);
        expect(y._destroy).toEqual(true);
        expect(z._destroy).toEqual(true);
    });

    it('Should notify subscribers on push', function () {
        testObservableArray.push("Some new value");
        expect(notifiedValues).toEqual([[1, 2, 3, "Some new value"]]);
    });

    it('Should notify "beforeChange" subscribers before push', function () {
        testObservableArray.push("Some new value");
        expect(beforeNotifiedValues).toEqual([[1, 2, 3]]);
    });

    it('Should notify subscribers on pop', function () {
        var popped = testObservableArray.pop();
        expect(popped).toEqual(3);
        expect(notifiedValues).toEqual([[1, 2]]);
    });

    it('Should notify "beforeChange" subscribers before pop', function () {
        var popped = testObservableArray.pop();
        expect(popped).toEqual(3);
        expect(beforeNotifiedValues).toEqual([[1, 2, 3]]);
    });

    it('Should notify subscribers on splice', function () {
        var spliced = testObservableArray.splice(1, 1);
        expect(spliced).toEqual([2]);
        expect(notifiedValues).toEqual([[1, 3]]);
    });

    it('Should notify "beforeChange" subscribers before splice', function () {
        var spliced = testObservableArray.splice(1, 1);
        expect(spliced).toEqual([2]);
        expect(beforeNotifiedValues).toEqual([[1, 2, 3]]);
    });

    it('Should notify subscribers on remove by value', function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        var removed = testObservableArray.remove("Beta");
        expect(removed).toEqual(["Beta"]);
        expect(notifiedValues).toEqual([["Alpha", "Gamma"]]);
    });

    it('Should notify subscribers on remove by predicate', function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        var removed = testObservableArray.remove(function (value) { return value == "Beta"; });
        expect(removed).toEqual(["Beta"]);
        expect(notifiedValues).toEqual([["Alpha", "Gamma"]]);
    });

    it('Should notify subscribers on remove multiple by value', function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        var removed = testObservableArray.removeAll(["Gamma", "Alpha"]);
        expect(removed).toEqual(["Alpha", "Gamma"]);
        expect(notifiedValues).toEqual([["Beta"]]);
    });

    it('Should clear observable array entirely if you pass no args to removeAll()', function() {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        var removed = testObservableArray.removeAll();
        expect(removed).toEqual(["Alpha", "Beta", "Gamma"]);
        expect(notifiedValues).toEqual([[]]);
    });

    it('Should notify "beforeChange" subscribers before remove', function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        beforeNotifiedValues = [];
        var removed = testObservableArray.remove("Beta");
        expect(removed).toEqual(["Beta"]);
        expect(beforeNotifiedValues).toEqual([["Alpha", "Beta", "Gamma"]]);
    });

    it('Should not notify subscribers on remove by value with no match', function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        var removed = testObservableArray.remove("Delta");
        expect(removed).toEqual([]);
        expect(notifiedValues).toEqual([]);
    });

    it('Should not notify "beforeChange" subscribers before remove by value with no match', function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        beforeNotifiedValues = [];
        var removed = testObservableArray.remove("Delta");
        expect(removed).toEqual([]);
        expect(beforeNotifiedValues).toEqual([]);
    });

    it('Should modify original array on remove', function () {
        var originalArray = ["Alpha", "Beta", "Gamma"];
        testObservableArray(originalArray);
        notifiedValues = [];
        testObservableArray.remove("Beta");
        expect(originalArray).toEqual(["Alpha", "Gamma"]);
    });

    it('Should modify original array on removeAll', function () {
        var originalArray = ["Alpha", "Beta", "Gamma"];
        testObservableArray(originalArray);
        notifiedValues = [];
        testObservableArray.removeAll();
        expect(originalArray).toEqual([]);
    });

    it('Should remove matching observable items', function() {
        var x = observable(), y = observable();
        testObservableArray([x, y]);
        notifiedValues = [];
        var removed = testObservableArray.remove(y);
        expect(testObservableArray()).toEqual([x]);
        expect(removed).toEqual([y]);
        expect(notifiedValues).toEqual([[x]]);
    });

    it('Should notify subscribers on replace', function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        testObservableArray.replace("Beta", "Delta");
        expect(notifiedValues).toEqual([["Alpha", "Delta", "Gamma"]]);
    });

    it('Should notify "beforeChange" subscribers before replace', function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        beforeNotifiedValues = [];
        testObservableArray.replace("Beta", "Delta");
        expect(beforeNotifiedValues).toEqual([["Alpha", "Beta", "Gamma"]]);
    });

    it('Should notify subscribers after marking items as destroyed', function () {
        var x = {}, y = {}, didNotify = false;
        testObservableArray([x, y]);
        testObservableArray.subscribe(function(/* value */) {
            expect(x._destroy).toEqual(undefined);
            expect(y._destroy).toEqual(true);
            didNotify = true;
        });
        testObservableArray.destroy(y);
        expect(didNotify).toEqual(true);
    });

    it('Should notify "beforeChange" subscribers before marking items as destroyed', function () {
        var x = {}, y = {}, didNotify = false;
        testObservableArray([x, y]);
        testObservableArray.subscribe(function(/* value */) {
            expect(x._destroy).toEqual(undefined);
            expect(y._destroy).toEqual(undefined);
            didNotify = true;
        }, null, "beforeChange");
        testObservableArray.destroy(y);
        expect(didNotify).toEqual(true);
    });

    it('Should be able to return first index of item', function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        expect(testObservableArray.indexOf("Beta")).toEqual(1);
        expect(testObservableArray.indexOf("Gamma")).toEqual(2);
        expect(testObservableArray.indexOf("Alpha")).toEqual(0);
        expect(testObservableArray.indexOf("fake")).toEqual(-1);
    });

    it('Should return 0 when you call myArray.length, and the true length when you call myArray().length', function() {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        expect(testObservableArray.length).toEqual(0); // Because JavaScript won't let us override "length" directly
        expect(testObservableArray().length).toEqual(3);
    });

    it('Should return the observableArray reference from "sort" and "reverse"', function() {
        expect(testObservableArray.reverse()).toBe(testObservableArray);
        expect(testObservableArray.sort()).toBe(testObservableArray);

        // Verify that reverse and sort notified their changes
        expect(notifiedValues).toEqual([ [3, 2, 1], [1, 2, 3] ]);
    });

    it('Should inherit any properties defined on subscribable.fn, observable.fn, or observableArray.fn', function() {
        this.after(function() {
            delete subscribable.fn.subscribableProp; // Will be able to reach this
            delete subscribable.fn.customProp;       // Overridden on observable.fn
            delete subscribable.fn.customFunc;       // Overridden on observableArray.fn
            delete observable.fn.customProp;         // Overridden on observableArray.fn
            delete observable.fn.customFunc;         // Will be able to reach this
            delete observableArray.fn.customProp;    // Will be able to reach this
        });

        subscribable.fn.subscribableProp = 'subscribable value';
        subscribable.fn.customProp = 'subscribable value - will be overridden';
        subscribable.fn.customFunc = function() { throw new Error('Shouldn\'t be reachable'); };
        observable.fn.customProp = 'observable prop value - will be overridden';
        observable.fn.customFunc = function() { return this(); };
        observableArray.fn.customProp = 'observableArray value';

        var instance = observableArray([123]);
        expect(instance.subscribableProp).toEqual('subscribable value');
        expect(instance.customProp).toEqual('observableArray value');
        expect(instance.customFunc()).toEqual([123]);
    });

    it('Should have access to functions added to "fn" on existing instances on supported browsers', function () {
        // On unsupported browsers, there's nothing to test
        if (!jasmine.browserSupportsProtoAssignment) {
            return;
        }

        this.after(function() {
            delete observable.fn.customFunction1;
            delete observableArray.fn.customFunction2;
        });

        var observableArray = observableArray();

        var customFunction1 = function () {};
        var customFunction2 = function () {};

        observable.fn.customFunction1 = customFunction1;
        observableArray.fn.customFunction2 = customFunction2;

        expect(observableArray.customFunction1).toBe(customFunction1);
        expect(observableArray.customFunction2).toBe(customFunction2);
    });
});
