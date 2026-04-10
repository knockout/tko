import { expect } from 'chai'
import '../helpers/mocha-test-helpers.js'

describe('ko.when', function() {
    it('Runs callback when predicate function becomes true, but only once', function() {
        var x = ko.observable(3),
            called = 0;

        ko.when(function () { return x() === 4; }, function () { called++; });

        x(5);
        expect(called).to.equal(0);
        expect(x.getSubscriptionsCount()).to.equal(1);

        x(4);
        expect(called).to.equal(1);
        expect(x.getSubscriptionsCount()).to.equal(0);

        x(3);
        x(4);
        expect(called).to.equal(1);
        expect(x.getSubscriptionsCount()).to.equal(0);
    });

    it('Runs callback if predicate function is already true', function() {
        var x = ko.observable(4),
            called = 0;

        ko.when(function () { return x() === 4; }, function () { called++; });

        expect(called).to.equal(1);
        expect(x.getSubscriptionsCount()).to.equal(0);

        x(3);
        x(4);
        expect(called).to.equal(1);
        expect(x.getSubscriptionsCount()).to.equal(0);
    });

    it('Accepts an observable as the predicate', function() {
        var x = ko.observable(false),
            called = 0;

        ko.when(x, function () { called++; });

        expect(called).to.equal(0);
        expect(x.getSubscriptionsCount()).to.equal(1);

        x(true);
        expect(called).to.equal(1);
        expect(x.getSubscriptionsCount()).to.equal(0);
    });

    it('Returns an object with a dispose function that cancels the notification', function() {
        var x = ko.observable(false),
            called = 0;

        var handle = ko.when(x, function () { called++; });

        expect(called).to.equal(0);
        expect(x.getSubscriptionsCount()).to.equal(1);

        handle.dispose();
        expect(x.getSubscriptionsCount()).to.equal(0);

        x(true);
        expect(called).to.equal(0);
    });

    it('Will call callback function only once even if value is updated during callback', function() {
        var x = ko.observable(false),
            called = 0;

        ko.when(x, function () {
            called++;
            x(false);
            x(true);
        });

        expect(called).to.equal(0);
        expect(x.getSubscriptionsCount()).to.equal(1);

        x(true);
        expect(called).to.equal(1);
    });

    it('Should be able to specify a \'this\' pointer for the callback', function () {
        var model = {
            someProperty: 123,
            myCallback: function () { expect(this.someProperty).to.deep.equal(123); }
        };
        ko.when(ko.observable(true), model.myCallback, model);
    });

    it('Returns the actual truthy predicate value as the callback first parameter', function () {
        function myCallback (value) {
            expect(value).to.deep.equal(2);
        }
        ko.when(ko.observable(2), myCallback);
    });
});
