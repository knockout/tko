
let testObservableArray
let notifiedValues
let beforeNotifiedValues

describe('Observable Array', function() {
    beforeEach(function () {
        testObservableArray = new ko.observableArray([1, 2, 3]);
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
        expect(ko.isObservable(testObservableArray)).to.deep.equal(true);
    });

    it('Should advertise as observable array', function () {
        expect(ko.isObservableArray(ko.observableArray())).to.deep.equal(true);
    });

    it('ko.isObservableArray should return false for non-observable array values', function () {
        ko.utils.arrayForEach([
            undefined,
            null,
            "x",
            {},
            function() {},
            ko.observable([]),
        ], function (value) {
            expect(ko.isObservableArray(value)).to.deep.equal(false);
        });
    });

    it('Should initialize to empty array if you pass no args to constructor', function() {
        var instance = new ko.observableArray();
        expect(instance().length).to.deep.equal(0);
    });

    it('Should require constructor arg, if given, to be array-like or null or undefined', function() {
        // Try non-array-like args
        expect(function () { ko.observableArray(1); }).to.throw();
        expect(function () { ko.observableArray({}); }).to.throw();

        // Try allowed args
        expect((new ko.observableArray([1,2,3]))().length).to.deep.equal(3);
        expect((new ko.observableArray(null))().length).to.deep.equal(0);
        expect((new ko.observableArray(undefined))().length).to.deep.equal(0);
    });

    it('Should be able to write values to it', function () {
        testObservableArray(['X', 'Y']);
        expect(notifiedValues.length).to.deep.equal(1);
        expect(notifiedValues[0][0]).to.deep.equal('X');
        expect(notifiedValues[0][1]).to.deep.equal('Y');
    });

    it('Should be able to mark single items as destroyed', function() {
        var x = {}, y = {};
        testObservableArray([x, y]);
        testObservableArray.destroy(y);
        expect(testObservableArray().length).to.deep.equal(2);
        expect(x._destroy).to.deep.equal(undefined);
        expect(y._destroy).to.deep.equal(true);
    });

    it('Should be able to mark multiple items as destroyed', function() {
        var x = {}, y = {}, z = {};
        testObservableArray([x, y, z]);
        testObservableArray.destroyAll([x, z]);
        expect(testObservableArray().length).to.deep.equal(3);
        expect(x._destroy).to.deep.equal(true);
        expect(y._destroy).to.deep.equal(undefined);
        expect(z._destroy).to.deep.equal(true);
    });

    it('Should be able to mark observable items as destroyed', function() {
        var x = ko.observable(), y = ko.observable();
        testObservableArray([x, y]);
        testObservableArray.destroy(y);
        expect(testObservableArray().length).to.deep.equal(2);
        expect(x._destroy).to.deep.equal(undefined);
        expect(y._destroy).to.deep.equal(true);
    });

    it('Should be able to mark all items as destroyed by passing no args to destroyAll()', function() {
        var x = {}, y = {}, z = {};
        testObservableArray([x, y, z]);
        testObservableArray.destroyAll();
        expect(testObservableArray().length).to.deep.equal(3);
        expect(x._destroy).to.deep.equal(true);
        expect(y._destroy).to.deep.equal(true);
        expect(z._destroy).to.deep.equal(true);
    });

    it('Should notify subscribers on push', function () {
        testObservableArray.push("Some new value");
        expect(notifiedValues).to.deep.equal([[1, 2, 3, "Some new value"]]);
    });

    it('Should notify "beforeChange" subscribers before push', function () {
        testObservableArray.push("Some new value");
        expect(beforeNotifiedValues).to.deep.equal([[1, 2, 3]]);
    });

    it('Should notify subscribers on pop', function () {
        var popped = testObservableArray.pop();
        expect(popped).to.deep.equal(3);
        expect(notifiedValues).to.deep.equal([[1, 2]]);
    });

    it('Should notify "beforeChange" subscribers before pop', function () {
        var popped = testObservableArray.pop();
        expect(popped).to.deep.equal(3);
        expect(beforeNotifiedValues).to.deep.equal([[1, 2, 3]]);
    });

    it('Should notify subscribers on splice', function () {
        var spliced = testObservableArray.splice(1, 1);
        expect(spliced).to.deep.equal([2]);
        expect(notifiedValues).to.deep.equal([[1, 3]]);
    });

    it('Should notify "beforeChange" subscribers before splice', function () {
        var spliced = testObservableArray.splice(1, 1);
        expect(spliced).to.deep.equal([2]);
        expect(beforeNotifiedValues).to.deep.equal([[1, 2, 3]]);
    });

    it('Should notify subscribers on remove by value', function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        var removed = testObservableArray.remove("Beta");
        expect(removed).to.deep.equal(["Beta"]);
        expect(notifiedValues).to.deep.equal([["Alpha", "Gamma"]]);
    });

    it('Should notify subscribers on remove by predicate', function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        var removed = testObservableArray.remove(function (value) { return value == "Beta"; });
        expect(removed).to.deep.equal(["Beta"]);
        expect(notifiedValues).to.deep.equal([["Alpha", "Gamma"]]);
    });

    it('Should notify subscribers on remove multiple by value', function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        var removed = testObservableArray.removeAll(["Gamma", "Alpha"]);
        expect(removed).to.deep.equal(["Alpha", "Gamma"]);
        expect(notifiedValues).to.deep.equal([["Beta"]]);
    });

    it('Should clear observable array entirely if you pass no args to removeAll()', function() {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        var removed = testObservableArray.removeAll();
        expect(removed).to.deep.equal(["Alpha", "Beta", "Gamma"]);
        expect(notifiedValues).to.deep.equal([[]]);
    });

    it('Should notify "beforeChange" subscribers before remove', function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        beforeNotifiedValues = [];
        var removed = testObservableArray.remove("Beta");
        expect(removed).to.deep.equal(["Beta"]);
        expect(beforeNotifiedValues).to.deep.equal([["Alpha", "Beta", "Gamma"]]);
    });

    it('Should not notify subscribers on remove by value with no match', function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        var removed = testObservableArray.remove("Delta");
        expect(removed).to.deep.equal([]);
        expect(notifiedValues).to.deep.equal([]);
    });

    it('Should not notify "beforeChange" subscribers before remove by value with no match', function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        beforeNotifiedValues = [];
        var removed = testObservableArray.remove("Delta");
        expect(removed).to.deep.equal([]);
        expect(beforeNotifiedValues).to.deep.equal([]);
    });

    it('Should modify original array on remove', function () {
        var originalArray = ["Alpha", "Beta", "Gamma"];
        testObservableArray(originalArray);
        notifiedValues = [];
        var removed = testObservableArray.remove("Beta");
        expect(originalArray).to.deep.equal(["Alpha", "Gamma"]);
    });

    it('Should modify original array on removeAll', function () {
        var originalArray = ["Alpha", "Beta", "Gamma"];
        testObservableArray(originalArray);
        notifiedValues = [];
        var removed = testObservableArray.removeAll();
        expect(originalArray).to.deep.equal([]);
    });

    it('Should remove matching observable items', function() {
        var x = ko.observable(), y = ko.observable();
        testObservableArray([x, y]);
        notifiedValues = [];
        var removed = testObservableArray.remove(y);
        expect(testObservableArray()).to.deep.equal([x]);
        expect(removed).to.deep.equal([y]);
        expect(notifiedValues).to.deep.equal([[x]]);
    });

    it ('Should throw an exception if matching array item moved or removed during "remove"', function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        expect(function () {
            testObservableArray.remove(function (value) {
                if (value == "Beta") {
                    testObservableArray.splice(0, 1);
                    return true;
                }
            });
        }).to.throw();
        expect(testObservableArray()).to.deep.equal(["Beta", "Gamma"]);
    });

    it('Should notify subscribers on replace', function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        notifiedValues = [];
        testObservableArray.replace("Beta", "Delta");
        expect(notifiedValues).to.deep.equal([["Alpha", "Delta", "Gamma"]]);
    });

    it('Should notify "beforeChange" subscribers before replace', function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        beforeNotifiedValues = [];
        testObservableArray.replace("Beta", "Delta");
        expect(beforeNotifiedValues).to.deep.equal([["Alpha", "Beta", "Gamma"]]);
    });

    it('Should notify subscribers after marking items as destroyed', function () {
        var x = {}, y = {}, didNotify = false;
        testObservableArray([x, y]);
        testObservableArray.subscribe(function(value) {
            expect(x._destroy).to.deep.equal(undefined);
            expect(y._destroy).to.deep.equal(true);
            didNotify = true;
        });
        testObservableArray.destroy(y);
        expect(didNotify).to.deep.equal(true);
    });

    it('Should notify "beforeChange" subscribers before marking items as destroyed', function () {
        var x = {}, y = {}, didNotify = false;
        testObservableArray([x, y]);
        testObservableArray.subscribe(function(value) {
            expect(x._destroy).to.deep.equal(undefined);
            expect(y._destroy).to.deep.equal(undefined);
            didNotify = true;
        }, null, "beforeChange");
        testObservableArray.destroy(y);
        expect(didNotify).to.deep.equal(true);
    });

    it('Should be able to return first index of item', function () {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        expect(testObservableArray.indexOf("Beta")).to.deep.equal(1);
        expect(testObservableArray.indexOf("Gamma")).to.deep.equal(2);
        expect(testObservableArray.indexOf("Alpha")).to.deep.equal(0);
        expect(testObservableArray.indexOf("fake")).to.deep.equal(-1);
    });

    it('Should return the true length / myArray.length, and the true length when you call myArray().length', function() {
        testObservableArray(["Alpha", "Beta", "Gamma"]);
        let overwriteableLength = false
        // Old JavaScript won't let us override "length" directly
        try {
          Object.defineProperty(function x () {}, 'length', {})
          overwriteableLength = true
        } catch (e) { }

        expect(testObservableArray.length).to.deep.equal(overwriteableLength ? 3 : 0);
        expect(testObservableArray().length).to.deep.equal(3);
    });

    it('Should be able to call standard mutators without creating a subscription', function() {
        var timesEvaluated = 0,
            newArray = ko.observableArray(["Alpha", "Beta", "Gamma"]);

        var computed = ko.computed(function() {
            // Make a few standard mutations
            newArray.push("Delta");
            newArray.remove("Beta");
            newArray.splice(2, 1);

            // Peek to ensure we really had the intended effect
            expect(newArray.peek()).to.deep.equal(["Alpha", "Gamma"]);

            // Also make use of the KO delete/destroy functions to check they don't cause subscriptions
            newArray([{ someProp: 123 }]);
            newArray.destroyAll();
            expect(newArray.peek()[0]._destroy).to.deep.equal(true);
            newArray.removeAll();
            expect(newArray.peek()).to.deep.equal([]);

            timesEvaluated++;
        });

        // Verify that we haven't caused a subscription
        expect(timesEvaluated).to.deep.equal(1);
        expect(newArray.getSubscriptionsCount()).to.deep.equal(0);

        // Don't just trust getSubscriptionsCount - directly verify that mutating newArray doesn't cause a re-eval
        newArray.push("Another");
        expect(timesEvaluated).to.deep.equal(1);
    });

    it('Should return the observableArray reference from "sort" and "reverse"', function() {
        expect(testObservableArray.reverse()).to.equal(testObservableArray);
        expect(testObservableArray.sort()).to.equal(testObservableArray);

        // Verify that reverse and sort notified their changes
        expect(notifiedValues).to.deep.equal([ [3, 2, 1], [1, 2, 3] ]);
    });

    it('Should return a new sorted array from "sorted"', function() {
        // set some unsorted values so we can see that the new array is sorted
        testObservableArray([ 5, 7, 3, 1 ]);
        notifiedValues = [];

        var newArray = testObservableArray.sorted();
        expect(newArray).to.deep.equal([ 1, 3, 5, 7 ]);
        expect(newArray).not.to.equal(testObservableArray());

        var newArray2 = testObservableArray.sorted(function(a, b) {
            return b - a;
        });
        expect(newArray2).to.deep.equal([ 7, 5, 3, 1 ]);
        expect(newArray2).not.to.equal(testObservableArray());
        expect(newArray2).not.to.equal(newArray);

        expect(notifiedValues).to.deep.equal([]);
    });

    it('Should return a new reversed array from "reversed"', function() {
        var newArray = testObservableArray.reversed();
        expect(newArray).to.deep.equal([ 3, 2, 1 ]);
        expect(newArray).not.to.equal(testObservableArray());

        expect(notifiedValues).to.deep.equal([]);
    });

    it('Should inherit any properties defined on ko.subscribable.fn, ko.observable.fn, or ko.observableArray.fn', function() {
        after(function() {
            delete ko.subscribable.fn.subscribableProp; // Will be able to reach this
            delete ko.subscribable.fn.customProp;       // Overridden on ko.observable.fn
            delete ko.subscribable.fn.customFunc;       // Overridden on ko.observableArray.fn
            delete ko.observable.fn.customProp;         // Overridden on ko.observableArray.fn
            delete ko.observable.fn.customFunc;         // Will be able to reach this
            delete ko.observableArray.fn.customProp;    // Will be able to reach this
        });

        ko.subscribable.fn.subscribableProp = 'subscribable value';
        ko.subscribable.fn.customProp = 'subscribable value - will be overridden';
        ko.subscribable.fn.customFunc = function() { throw new Error('Shouldn\'t be reachable') };
        ko.observable.fn.customProp = 'observable prop value - will be overridden';
        ko.observable.fn.customFunc = function() { return this(); };
        ko.observableArray.fn.customProp = 'observableArray value';

        var instance = ko.observableArray([123]);
        expect(instance.subscribableProp).to.deep.equal('subscribable value');
        expect(instance.customProp).to.deep.equal('observableArray value');
        expect(instance.customFunc()).to.deep.equal([123]);
    });

    it('Should have access to functions added to "fn" on existing instances on supported browsers', function () {
        // On unsupported browsers, there's nothing to test
        if (!browserSupportsProtoAssignment) {
            return;
        }

        after(function() {
            delete ko.observable.fn.customFunction1;
            delete ko.observableArray.fn.customFunction2;
        });

        var observableArray = ko.observableArray();

        var customFunction1 = function () {};
        var customFunction2 = function () {};

        ko.observable.fn.customFunction1 = customFunction1;
        ko.observableArray.fn.customFunction2 = customFunction2;

        expect(observableArray.customFunction1).to.equal(customFunction1);
        expect(observableArray.customFunction2).to.equal(customFunction2);
    });
})
