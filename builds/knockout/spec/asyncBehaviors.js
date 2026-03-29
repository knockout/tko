function createSpy() {
    var spy = sinon.stub();
    Object.defineProperties(spy, {
        calls: {
            get: function() {
                return spy.getCalls();
            }
        },
        argsForCall: {
            get: function() {
                return spy.getCalls().map(function(call) { return call.args; });
            }
        }
    });
    spy.reset = spy.resetHistory.bind(spy);
    spy.andCallFake = spy.callsFake.bind(spy);
    spy.andReturn = spy.returns.bind(spy);
    return spy;
}

describe("Throttled observables", function() {
    beforeEach(function() {
        Clock.useMock();
    }); // Workaround for spurious timing-related failures on IE8 (issue #736)

    it("Should notify subscribers asynchronously after writes stop for the specified timeout duration", function() {
        var observable = ko.observable('A').extend({ throttle: 100 });
        var notifiedValues = [];
        observable.subscribe(function(value) {
            notifiedValues.push(value);
        });

        // Mutate a few times
        observable('B');
        observable('C');
        observable('D');
        expect(notifiedValues.length).to.deep.equal(0); // Should not notify synchronously

        Clock.tick(10);

        // Mutate more
        observable('E');
        observable('F');
        expect(notifiedValues.length).to.deep.equal(0); // Should not notify until end of throttle timeout

        Clock.tick(100);
        expect(notifiedValues.length).to.deep.equal(1);
        expect(notifiedValues[0]).to.deep.equal("F");
    });
});

describe("Throttled dependent observables", function() {
    beforeEach(function() {
        Clock.useMock();
    }); // Workaround for spurious timing-related failures on IE8 (issue #736)

    it("Should notify subscribers asynchronously after dependencies stop updating for the specified timeout duration", function() {
        var underlying = ko.observable();
        var asyncDepObs = ko.dependentObservable(function() {
            return underlying();
        }).extend({ throttle: 100 });
        var notifiedValues = [];
        asyncDepObs.subscribe(function(value) {
            notifiedValues.push(value);
        });

        // Check initial state
        expect(asyncDepObs()).to.equal(undefined);
        // Mutate
        underlying('New value');
        expect(asyncDepObs()).to.equal(undefined); // Should not update synchronously
        expect(notifiedValues.length).to.deep.equal(0);

        // Still shouldn't have evaluated
        Clock.tick(10);
        expect(asyncDepObs()).to.equal(undefined); // Should not update until throttle timeout
        expect(notifiedValues.length).to.deep.equal(0);

        // Now wait for throttle timeout
        Clock.tick(100);
        expect(asyncDepObs()).to.deep.equal('New value');
        expect(notifiedValues.length).to.deep.equal(1);
        expect(notifiedValues[0]).to.deep.equal('New value');
    });

    it("Should run evaluator only once when dependencies stop updating for the specified timeout duration", function() {
        var evaluationCount = 0;
        var someDependency = ko.observable();
        var asyncDepObs = ko.dependentObservable(function() {
            evaluationCount++;
            return someDependency();
        }).extend({ throttle: 100 });

        // Mutate a few times synchronously
        expect(evaluationCount).to.deep.equal(1); // Evaluates synchronously when first created, like all dependent observables
        someDependency("A");
        someDependency("B");
        someDependency("C");
        expect(evaluationCount).to.deep.equal(1); // Should not re-evaluate synchronously when dependencies update

        // Also mutate async
        Clock.tick(10);
        someDependency("D");
        expect(evaluationCount).to.deep.equal(1);

        // Now wait for throttle timeout
        Clock.tick(100);
        expect(evaluationCount).to.deep.equal(2); // Finally, it's evaluated
        expect(asyncDepObs()).to.deep.equal("D");
    });
});

describe('Rate-limited', function() {
    beforeEach(function() {
        Clock.useMock();
    });

    describe('Subscribable', function() {
        it('Should delay change notifications', function() {
            var subscribable = new ko.subscribable().extend({rateLimit:500});
            var notifySpy = createSpy('notifySpy');
            subscribable.subscribe(notifySpy);
            subscribable.subscribe(notifySpy, null, 'custom');

            // "change" notification is delayed
            subscribable.notifySubscribers('a', "change");
            expect(notifySpy.called).to.equal(false);

            // Default notification is delayed
            subscribable.notifySubscribers('b');
            expect(notifySpy.called).to.equal(false);

            // Other notifications happen immediately
            subscribable.notifySubscribers('c', "custom");
            expect(notifySpy.calledWith('c')).to.equal(true);

            // Advance clock; Change notification happens now using the latest value notified
            notifySpy.reset();
            Clock.tick(500);
            expect(notifySpy.calledWith('b')).to.equal(true);
        });

        it('Should notify every timeout interval using notifyAtFixedRate method ', function() {
            var subscribable = new ko.subscribable().extend({rateLimit:{method:'notifyAtFixedRate', timeout:50}});
            var notifySpy = createSpy('notifySpy');
            subscribable.subscribe(notifySpy);

            // Push 10 changes every 25 ms
            for (var i = 0; i < 10; ++i) {
                subscribable.notifySubscribers(i+1);
                Clock.tick(25);
            }

            // Notification happens every 50 ms, so every other number is notified
            expect(notifySpy.calls.length).to.equal(5);
            expect(notifySpy.argsForCall).to.deep.equal([ [2], [4], [6], [8], [10] ]);

            // No more notifications happen
            notifySpy.reset();
            Clock.tick(50);
            expect(notifySpy.called).to.equal(false);
        });

        it('Should notify after nothing happens for the timeout period using notifyWhenChangesStop method', function() {
            var subscribable = new ko.subscribable().extend({rateLimit:{method:'notifyWhenChangesStop', timeout:50}});
            var notifySpy = createSpy('notifySpy');
            subscribable.subscribe(notifySpy);

            // Push 10 changes every 25 ms
            for (var i = 0; i < 10; ++i) {
                subscribable.notifySubscribers(i+1);
                Clock.tick(25);
            }

            // No notifications happen yet
            expect(notifySpy.called).to.equal(false);

            // Notification happens after the timeout period
            Clock.tick(50);
            expect(notifySpy.calls.length).to.equal(1);
            expect(notifySpy.calledWith(10)).to.equal(true);
        });

        it('Should use latest settings when applied multiple times', function() {
            var subscribable = new ko.subscribable().extend({rateLimit:250}).extend({rateLimit:500});
            var notifySpy = createSpy('notifySpy');
            subscribable.subscribe(notifySpy);

            subscribable.notifySubscribers('a');

            Clock.tick(250);
            expect(notifySpy.called).to.equal(false);

            Clock.tick(250);
            expect(notifySpy.calledWith('a')).to.equal(true);
        });

        it('Uses latest settings for future notification and previous settings for pending notification', function() {
            // This test describes the current behavior for the given scenario but is not a contract for that
            // behavior, which could change in the future if convenient.
            var subscribable = new ko.subscribable().extend({rateLimit:250});
            var notifySpy = createSpy('notifySpy');
            subscribable.subscribe(notifySpy);

            subscribable.notifySubscribers('a');  // Pending notification

            // Apply new setting and schedule new notification
            subscribable = subscribable.extend({rateLimit:500});
            subscribable.notifySubscribers('b');

            // First notification happens using original settings
            Clock.tick(250);
            expect(notifySpy.calledWith('a')).to.equal(true);

            // Second notification happends using later settings
            notifySpy.reset();
            Clock.tick(250);
            expect(notifySpy.calledWith('b')).to.equal(true);
        });

        it('Should return "[object Object]" with .toString', function() {
          // Issue #2252: make sure .toString method does not throw error
          expect(new ko.subscribable().toString()).to.equal('[object Object]')
        });
    });

    describe('Observable', function() {
        it('Should delay change notifications', function() {
            var observable = ko.observable().extend({rateLimit:500});
            var notifySpy = createSpy('notifySpy');
            observable.subscribe(notifySpy);
            var beforeChangeSpy = createSpy('beforeChangeSpy')
                .andCallFake(function(value) {expect(observable()).to.equal(value); });
            observable.subscribe(beforeChangeSpy, null, 'beforeChange');

            // Observable is changed, but notification is delayed
            observable('a');
            expect(observable()).to.deep.equal('a');
            expect(notifySpy.called).to.equal(false);
            expect(beforeChangeSpy.calledWith(undefined)).to.equal(true);    // beforeChange notification happens right away

            // Second change notification is also delayed
            observable('b');
            expect(notifySpy.called).to.equal(false);

            // Advance clock; Change notification happens now using the latest value notified
            Clock.tick(500);
            expect(notifySpy.calledWith('b')).to.equal(true);
            expect(beforeChangeSpy.calls.length).to.equal(1);   // Only one beforeChange notification
        });

        it('Should notify "spectator" subscribers whenever the value changes', function () {
            var observable = new ko.observable('A').extend({rateLimit:500}),
                spectateSpy = createSpy('notifySpy'),
                notifySpy = createSpy('notifySpy');

            observable.subscribe(spectateSpy, null, "spectate");
            observable.subscribe(notifySpy);

            expect(spectateSpy.called).to.equal(false);
            expect(notifySpy.called).to.equal(false);

            observable('B');
            expect(spectateSpy.calledWith('B')).to.equal(true);
            observable('C');
            expect(spectateSpy.calledWith('C')).to.equal(true);

            expect(notifySpy.called).to.equal(false);
            Clock.tick(500);

            // "spectate" was called for each new value
            expect(spectateSpy.argsForCall).to.deep.equal([ ['B'], ['C'] ]);
            // whereas "change" was only called for the final value
            expect(notifySpy.argsForCall).to.deep.equal([ ['C'] ]);
        });

        it('Should suppress change notification when value is changed/reverted', function() {
            var observable = ko.observable('original').extend({rateLimit:500});
            var notifySpy = createSpy('notifySpy');
            observable.subscribe(notifySpy);
            var beforeChangeSpy = createSpy('beforeChangeSpy');
            observable.subscribe(beforeChangeSpy, null, 'beforeChange');

            observable('new');                      // change value
            expect(observable()).to.deep.equal('new');    // access observable to make sure it really has the changed value
            observable('original');                 // but then change it back
            expect(notifySpy.called).to.equal(false);
            Clock.tick(500);
            expect(notifySpy.called).to.equal(false);

            // Check that value is correct and notification hasn't happened
            expect(observable()).to.deep.equal('original');
            expect(notifySpy.called).to.equal(false);

            // Changing observable to a new value still works as expected
            observable('new');
            Clock.tick(500);
            expect(notifySpy.calledWith('new')).to.equal(true);
            expect(beforeChangeSpy.calledWith('original')).to.equal(true);
            expect(beforeChangeSpy.calledWith('new')).to.equal(false);
        });

        it('Should support notifications from nested update', function() {
            var observable = ko.observable('a').extend({rateLimit:500});
            var notifySpy = createSpy('notifySpy');
            observable.subscribe(notifySpy);

            // Create a one-time subscription that will modify the observable
            var updateSub = observable.subscribe(function() {
                updateSub.dispose();
                observable('z');
            });

            observable('b');
            expect(notifySpy.called).to.equal(false);
            expect(observable()).to.deep.equal('b');

            notifySpy.reset();
            Clock.tick(500);
            expect(notifySpy.calledWith('b')).to.equal(true);
            expect(observable()).to.deep.equal('z');

            notifySpy.reset();
            Clock.tick(500);
            expect(notifySpy.calledWith('z')).to.equal(true);
        });

        it('Should suppress notifications when value is changed/reverted from nested update', function() {
            var observable = ko.observable('a').extend({rateLimit:500});
            var notifySpy = createSpy('notifySpy');
            observable.subscribe(notifySpy);

            // Create a one-time subscription that will modify the observable and then revert the change
            var updateSub = observable.subscribe(function(newValue) {
                updateSub.dispose();
                observable('z');
                observable(newValue);
            });

            observable('b');
            expect(notifySpy.called).to.equal(false);
            expect(observable()).to.deep.equal('b');

            notifySpy.reset();
            Clock.tick(500);
            expect(notifySpy.calledWith('b')).to.equal(true);
            expect(observable()).to.deep.equal('b');

            notifySpy.reset();
            Clock.tick(500);
            expect(notifySpy.called).to.equal(false);
        });

        it('Should not notify future subscribers', function() {
            var observable = ko.observable('a').extend({rateLimit:500}),
                notifySpy1 = createSpy('notifySpy1'),
                notifySpy2 = createSpy('notifySpy2'),
                notifySpy3 = createSpy('notifySpy3');

            observable.subscribe(notifySpy1);
            observable('b');
            observable.subscribe(notifySpy2);
            observable('c');
            observable.subscribe(notifySpy3);

            expect(notifySpy1.called).to.equal(false);
            expect(notifySpy2.called).to.equal(false);
            expect(notifySpy3.called).to.equal(false);

            Clock.tick(500);
            expect(notifySpy1.calledWith('c')).to.equal(true);
            expect(notifySpy2.calledWith('c')).to.equal(true);
            expect(notifySpy3.called).to.equal(false);
        });

        it('Should delay update of dependent computed observable', function() {
            var observable = ko.observable().extend({rateLimit:500});
            var computed = ko.computed(observable);

            // Check initial value
            expect(computed()).to.equal(undefined);

            // Observable is changed, but computed is not
            observable('a');
            expect(observable()).to.deep.equal('a');
            expect(computed()).to.equal(undefined);

            // Second change also
            observable('b');
            expect(computed()).to.equal(undefined);

            // Advance clock; Change notification happens now using the latest value notified
            Clock.tick(500);
            expect(computed()).to.deep.equal('b');
        });

        it('Should delay update of dependent pure computed observable', function() {
            var observable = ko.observable().extend({rateLimit:500});
            var computed = ko.pureComputed(observable);

            // Check initial value
            expect(computed()).to.equal(undefined);

            // Observable is changed, but computed is not
            observable('a');
            expect(observable()).to.deep.equal('a');
            expect(computed()).to.equal(undefined);

            // Second change also
            observable('b');
            expect(computed()).to.equal(undefined);

            // Advance clock; Change notification happens now using the latest value notified
            Clock.tick(500);
            expect(computed()).to.deep.equal('b');
        });

        it('Should not update dependent computed created after last update', function() {
            var observable = ko.observable('a').extend({rateLimit:500});
            observable('b');

            var evalSpy = createSpy('evalSpy');
            var computed = ko.computed(function () {
                return evalSpy(observable());
            });
            expect(evalSpy.calledWith('b')).to.equal(true);
            evalSpy.reset();

            Clock.tick(500);
            expect(evalSpy.called).to.equal(false);
        });


        it('Should not cause loss of updates when an intermediate value is read by a dependent computed observable', function() {
            // From https://github.com/knockout/knockout/issues/1835
            var one = ko.observable(false).extend({rateLimit: 100}),
                two = ko.observable(false),
                three = ko.computed(function() { return one() || two(); }),
                threeNotifications = [];

            three.subscribe(function(val) {
                threeNotifications.push(val);
            });

            // The loop shows that the same steps work continuously
            for (var i = 0; i < 3; i++) {
                expect(one() || two() || three()).to.deep.equal(false);
                threeNotifications = [];

                one(true);
                expect(threeNotifications).to.deep.equal([]);
                two(true);
                expect(threeNotifications).to.deep.equal([true]);
                two(false);
                expect(threeNotifications).to.deep.equal([true]);
                one(false);
                expect(threeNotifications).to.deep.equal([true]);

                Clock.tick(100);
                expect(threeNotifications).to.deep.equal([true, false]);
            }
        });
    });

    describe('Observable Array change tracking', function() {
        it('Should provide correct changelist when multiple updates are merged into one notification', function() {
            var myArray = ko.observableArray(['Alpha', 'Beta']).extend({rateLimit:1}),
                changelist;

            myArray.subscribe(function(changes) {
                changelist = changes;
            }, null, 'arrayChange');

            myArray.push('Gamma');
            myArray.push('Delta');
            Clock.tick(10);
            expect(changelist).to.deep.equal([
                { status : 'added', value : 'Gamma', index : 2 },
                { status : 'added', value : 'Delta', index : 3 }
            ]);

            changelist = undefined;
            myArray.shift();
            myArray.shift();
            Clock.tick(10);
            expect(changelist).to.deep.equal([
                { status : 'deleted', value : 'Alpha', index : 0 },
                { status : 'deleted', value : 'Beta', index : 1 }
            ]);

            changelist = undefined;
            myArray.push('Epsilon');
            myArray.pop();
            Clock.tick(10);
            expect(changelist).to.deep.equal(undefined);
        });
    });

    describe('Computed Observable', function() {
        it('Should delay running evaluator where there are no subscribers', function() {
            var observable = ko.observable();
            var evalSpy = createSpy('evalSpy');
            var computed = ko.computed(function () { evalSpy(observable()); return observable(); }).extend({rateLimit:500});

            // Observable is changed, but evaluation is delayed
            evalSpy.reset();
            observable('a');
            observable('b');
            expect(evalSpy.called).to.equal(false);

            // Advance clock; Change notification happens now using the latest value notified
            evalSpy.reset();
            Clock.tick(500);
            expect(evalSpy.calledWith('b')).to.equal(true);
        });

        it('Should delay change notifications and evaluation', function() {
            var observable = ko.observable();
            var evalSpy = createSpy('evalSpy');
            var computed = ko.computed(function () { evalSpy(observable()); return observable(); }).extend({rateLimit:500});
            var notifySpy = createSpy('notifySpy');
            computed.subscribe(notifySpy);
            var beforeChangeSpy = createSpy('beforeChangeSpy')
                .andCallFake(function(value) {expect(computed()).to.equal(value); });
            computed.subscribe(beforeChangeSpy, null, 'beforeChange');

            // Observable is changed, but notification is delayed
            evalSpy.reset();
            observable('a');
            expect(evalSpy.called).to.equal(false);
            expect(computed()).to.deep.equal('a');
            expect(evalSpy.calledWith('a')).to.equal(true);      // evaluation happens when computed is accessed
            expect(notifySpy.called).to.equal(false);       // but notification is still delayed
            expect(beforeChangeSpy.calledWith(undefined)).to.equal(true);    // beforeChange notification happens right away

            // Second change notification is also delayed
            evalSpy.reset();
            observable('b');
            expect(computed.peek()).to.deep.equal('a');           // peek returns previously evaluated value
            expect(evalSpy.called).to.equal(false);
            expect(notifySpy.called).to.equal(false);

            // Advance clock; Change notification happens now using the latest value notified
            evalSpy.reset();
            Clock.tick(500);
            expect(evalSpy.calledWith('b')).to.equal(true);
            expect(notifySpy.calledWith('b')).to.equal(true);
            expect(beforeChangeSpy.calls.length).to.equal(1);   // Only one beforeChange notification
        });

        it('Should run initial evaluation at first subscribe when using deferEvaluation', function() {
            // This behavior means that code using rate-limited computeds doesn't need to care if the
            // computed also has deferEvaluation. For example, the preceding test ('Should delay change
            // notifications and evaluation') will pass just as well if using deferEvaluation.
            var observable = ko.observable('a');
            var evalSpy = createSpy('evalSpy');
            var computed = ko.computed({
                read: function () {
                    evalSpy(observable());
                    return observable();
                },
                deferEvaluation: true
            }).extend({rateLimit:500});
            expect(evalSpy.called).to.equal(false);

            var notifySpy = createSpy('notifySpy');
            computed.subscribe(notifySpy);
            expect(evalSpy.calledWith('a')).to.equal(true);
            expect(notifySpy.called).to.equal(false);
        });

        it('Should run initial evaluation when observable is accessed when using deferEvaluation', function() {
            var observable = ko.observable('a');
            var evalSpy = createSpy('evalSpy');
            var computed = ko.computed({
                read: function () {
                    evalSpy(observable());
                    return observable();
                },
                deferEvaluation: true
            }).extend({rateLimit:500});
            expect(evalSpy.called).to.equal(false);

            expect(computed()).to.deep.equal('a');
            expect(evalSpy.calledWith('a')).to.equal(true);
        });

        it('Should suppress change notifications when value is changed/reverted', function() {
            var observable = ko.observable('original');
            var computed = ko.computed(function () { return observable(); }).extend({rateLimit:500});
            var notifySpy = createSpy('notifySpy');
            computed.subscribe(notifySpy);
            var beforeChangeSpy = createSpy('beforeChangeSpy');
            computed.subscribe(beforeChangeSpy, null, 'beforeChange');

            observable('new');                      // change value
            expect(computed()).to.deep.equal('new');      // access computed to make sure it really has the changed value
            observable('original');                 // and then change the value back
            expect(notifySpy.called).to.equal(false);
            Clock.tick(500);
            expect(notifySpy.called).to.equal(false);

            // Check that value is correct and notification hasn't happened
            expect(computed()).to.deep.equal('original');
            expect(notifySpy.called).to.equal(false);

            // Changing observable to a new value still works as expected
            observable('new');
            Clock.tick(500);
            expect(notifySpy.calledWith('new')).to.equal(true);
            expect(beforeChangeSpy.calledWith('original')).to.equal(true);
            expect(beforeChangeSpy.calledWith('new')).to.equal(false);
        });

        it('Should not re-evaluate if computed is disposed before timeout', function() {
            var observable = ko.observable('a');
            var evalSpy = createSpy('evalSpy');
            var computed = ko.computed(function () { evalSpy(observable()); return observable(); }).extend({rateLimit:500});

            expect(computed()).to.deep.equal('a');
            expect(evalSpy.calls.length).to.equal(1);
            expect(evalSpy.calledWith('a')).to.equal(true);

            evalSpy.reset();
            observable('b');
            computed.dispose();

            Clock.tick(500);
            expect(computed()).to.deep.equal('a');
            expect(evalSpy.called).to.equal(false);
        });

        it('Should be able to re-evaluate a computed that previously threw an exception', function() {
            var observableSwitch = ko.observable(true), observableValue = ko.observable(1),
                computed = ko.computed(function() {
                    if (!observableSwitch()) {
                        throw Error("Error during computed evaluation");
                    } else {
                        return observableValue();
                    }
                }).extend({rateLimit:500});

            // Initially the computed evaluated successfully
            expect(computed()).to.deep.equal(1);

            expect(function () {
                // Update observable to cause computed to throw an exception
                observableSwitch(false);
                computed();
            }).to.throw("Error during computed evaluation");

            // The value of the computed is now undefined, although currently it keeps the previous value
            // This should not try to re-evaluate and thus shouldn't throw an exception
            expect(computed()).to.deep.equal(1);
            // The computed should not be dependent on the second observable
            expect(computed.getDependenciesCount()).to.deep.equal(1);
            expect(computed.getDependencies()).to.deep.equal([observableSwitch]);

            // Updating the second observable shouldn't re-evaluate computed
            observableValue(2);
            expect(computed()).to.deep.equal(1);

            // Update the first observable to cause computed to re-evaluate
            observableSwitch(1);
            expect(computed()).to.deep.equal(2);
        });

        it('Should delay update of dependent computed observable', function() {
            var observable = ko.observable();
            var rateLimitComputed = ko.computed(observable).extend({rateLimit:500});
            var dependentComputed = ko.computed(rateLimitComputed);

            // Check initial value
            expect(dependentComputed()).to.equal(undefined);

            // Rate-limited computed is changed, but dependent computed is not
            observable('a');
            expect(rateLimitComputed()).to.deep.equal('a');
            expect(dependentComputed()).to.equal(undefined);

            // Second change also
            observable('b');
            expect(dependentComputed()).to.equal(undefined);

            // Advance clock; Change notification happens now using the latest value notified
            Clock.tick(500);
            expect(dependentComputed()).to.deep.equal('b');
        });

        it('Should delay update of dependent pure computed observable', function() {
            var observable = ko.observable();
            var rateLimitComputed = ko.computed(observable).extend({rateLimit:500});
            var dependentComputed = ko.pureComputed(rateLimitComputed);

            // Check initial value
            expect(dependentComputed()).to.equal(undefined);

            // Rate-limited computed is changed, but dependent computed is not
            observable('a');
            expect(rateLimitComputed()).to.deep.equal('a');
            expect(dependentComputed()).to.equal(undefined);

            // Second change also
            observable('b');
            expect(dependentComputed()).to.equal(undefined);

            // Advance clock; Change notification happens now using the latest value notified
            Clock.tick(500);
            expect(dependentComputed()).to.deep.equal('b');
        });

        it('Should not cause loss of updates when an intermediate value is read by a dependent computed observable', function() {
            // From https://github.com/knockout/knockout/issues/1835
            var one = ko.observable(false),
                onePointOne = ko.computed(one).extend({rateLimit: 100}),
                two = ko.observable(false),
                three = ko.computed(function() { return onePointOne() || two(); }),
                threeNotifications = [];

            three.subscribe(function(val) {
                threeNotifications.push(val);
            });

            // The loop shows that the same steps work continuously
            for (var i = 0; i < 3; i++) {
                expect(onePointOne() || two() || three()).to.deep.equal(false);
                threeNotifications = [];

                one(true);
                expect(threeNotifications).to.deep.equal([]);
                two(true);
                expect(threeNotifications).to.deep.equal([true]);
                two(false);
                expect(threeNotifications).to.deep.equal([true]);
                one(false);
                expect(threeNotifications).to.deep.equal([true]);

                Clock.tick(100);
                expect(threeNotifications).to.deep.equal([true, false]);
            }
        });
    });
});

describe('Deferred', function() {
    beforeEach(function() {
        Clock.useMock();
        this.restoreAfter(ko.options, 'taskScheduler');
        this.restoreAfter(ko.tasks, 'scheduler');
        ko.options.taskScheduler = function(callback) {
            setTimeout(callback, 0);
        };
        ko.tasks.scheduler = function(callback) {
            setTimeout(callback, 0);
        };
    });

    afterEach(function() {
        expect(ko.tasks.resetForTesting()).to.deep.equal(0);
        Clock.reset();
    });

    describe('Observable', function() {
        it('Should delay notifications', function() {
            var observable = ko.observable().extend({deferred:true});
            var notifySpy = createSpy('notifySpy');
            observable.subscribe(notifySpy);

            observable('A');
            expect(notifySpy.called).to.equal(false);

            Clock.tick(1);
            expect(notifySpy.argsForCall).to.deep.equal([ ['A'] ]);
        });

        it('Should throw if you attempt to turn off deferred', function() {
            // As of commit 6d5d786, the 'deferred' option cannot be deactivated (once activated for
            // a given observable).
            var observable = ko.observable();

            observable.extend({deferred: true});
            expect(function() {
                observable.extend({deferred: false});
            }).to.throw('The \'deferred\' extender only accepts the value \'true\', because it is not supported to turn deferral off once enabled.');
        });

        it('Should notify subscribers about only latest value', function() {
            var observable = ko.observable().extend({notify:'always', deferred:true});  // include notify:'always' to ensure notifications weren't suppressed by some other means
            var notifySpy = createSpy('notifySpy');
            observable.subscribe(notifySpy);

            observable('A');
            observable('B');

            Clock.tick(1);
            expect(notifySpy.argsForCall).to.deep.equal([ ['B'] ]);
        });

        it('Should suppress notification when value is changed/reverted', function() {
            var observable = ko.observable('original').extend({deferred:true});
            var notifySpy = createSpy('notifySpy');
            observable.subscribe(notifySpy);

            observable('new');
            expect(observable()).to.deep.equal('new');
            observable('original');

            Clock.tick(1);
            expect(notifySpy.called).to.equal(false);
            expect(observable()).to.deep.equal('original');
        });

        it('Should not notify future subscribers', function() {
            var observable = ko.observable('a').extend({deferred:true}),
                notifySpy1 = createSpy('notifySpy1'),
                notifySpy2 = createSpy('notifySpy2'),
                notifySpy3 = createSpy('notifySpy3');

            observable.subscribe(notifySpy1);
            observable('b');
            observable.subscribe(notifySpy2);
            observable('c');
            observable.subscribe(notifySpy3);

            expect(notifySpy1.called).to.equal(false);
            expect(notifySpy2.called).to.equal(false);
            expect(notifySpy3.called).to.equal(false);

            Clock.tick(1);
            expect(notifySpy1.calledWith('c')).to.equal(true);
            expect(notifySpy2.calledWith('c')).to.equal(true);
            expect(notifySpy3.called).to.equal(false);
        });

        it('Should not update dependent computed created after last update', function() {
            var observable = ko.observable('a').extend({deferred:true});
            observable('b');

            var evalSpy = createSpy('evalSpy');
            var computed = ko.computed(function () {
                return evalSpy(observable());
            });
            expect(evalSpy.calledWith('b')).to.equal(true);
            evalSpy.reset();

            Clock.tick(1);
            expect(evalSpy.called).to.equal(false);
        });

        it('Is default behavior when "ko.options.deferUpdates" is "true"', function() {
            this.restoreAfter(ko.options, 'deferUpdates');
            ko.options.deferUpdates = true;

            var observable = ko.observable();
            var notifySpy = createSpy('notifySpy');
            observable.subscribe(notifySpy);

            observable('A');
            expect(notifySpy.called).to.equal(false);

            Clock.tick(1);
            expect(notifySpy.argsForCall).to.deep.equal([ ['A'] ]);
        });
    });

    describe('Observable Array change tracking', function() {
        it('Should provide correct changelist when multiple updates are merged into one notification', function() {
            var myArray = ko.observableArray(['Alpha', 'Beta']).extend({deferred:true}),
                changelist;

            myArray.subscribe(function(changes) {
                changelist = changes;
            }, null, 'arrayChange');

            myArray.push('Gamma');
            myArray.push('Delta');
            Clock.tick(1);
            expect(changelist).to.deep.equal([
                { status : 'added', value : 'Gamma', index : 2 },
                { status : 'added', value : 'Delta', index : 3 }
            ]);

            changelist = undefined;
            myArray.shift();
            myArray.shift();
            Clock.tick(1);
            expect(changelist).to.deep.equal([
                { status : 'deleted', value : 'Alpha', index : 0 },
                { status : 'deleted', value : 'Beta', index : 1 }
            ]);

            changelist = undefined;
            myArray.push('Epsilon');
            myArray.pop();
            Clock.tick(1);
            expect(changelist).to.deep.equal(undefined);
        });
    });

    describe('Computed Observable', function() {
        it('Should defer notification of changes and minimize evaluation', function () {
            var timesEvaluated = 0,
                data = ko.observable('A'),
                computed = ko.computed(function () { ++timesEvaluated; return data(); }).extend({deferred:true}),
                notifySpy = createSpy('notifySpy'),
                subscription = computed.subscribe(notifySpy);

            expect(computed()).to.deep.equal('A');
            expect(timesEvaluated).to.deep.equal(1);
            Clock.tick(1);
            expect(notifySpy.called).to.equal(false);

            data('B');
            expect(timesEvaluated).to.deep.equal(1);  // not immediately evaluated
            expect(computed()).to.deep.equal('B');
            expect(timesEvaluated).to.deep.equal(2);
            expect(notifySpy.called).to.equal(false);

            Clock.tick(1);
            expect(notifySpy.calls.length).to.deep.equal(1);
            expect(notifySpy.argsForCall).to.deep.equal([ ['B'] ]);
        });

        it('Should notify first change of computed with deferEvaluation if value is changed to undefined', function () {
            var data = ko.observable('A'),
                computed = ko.computed(data, null, {deferEvaluation: true}).extend({deferred:true}),
                notifySpy = createSpy('notifySpy'),
                subscription = computed.subscribe(notifySpy);

            expect(computed()).to.deep.equal('A');

            data(undefined);
            expect(computed()).to.deep.equal(undefined);
            expect(notifySpy.called).to.equal(false);

            Clock.tick(1);
            expect(notifySpy.calls.length).to.deep.equal(1);
            expect(notifySpy.argsForCall).to.deep.equal([ [undefined] ]);
        });

        it('Should notify first change to pure computed after awakening if value changed to last notified value', function() {
            var data = ko.observable('A'),
                computed = ko.pureComputed(data).extend({deferred:true}),
                notifySpy = createSpy('notifySpy'),
                subscription = computed.subscribe(notifySpy);

            data('B');
            expect(computed()).to.deep.equal('B');
            expect(notifySpy.called).to.equal(false);
            Clock.tick(1);
            expect(notifySpy.argsForCall).to.deep.equal([ ['B'] ]);

            subscription.dispose();
            notifySpy.reset();
            data('C');
            expect(computed()).to.deep.equal('C');
            Clock.tick(1);
            expect(notifySpy.called).to.equal(false);

            subscription = computed.subscribe(notifySpy);
            data('B');
            expect(computed()).to.deep.equal('B');
            expect(notifySpy.called).to.equal(false);
            Clock.tick(1);
            expect(notifySpy.argsForCall).to.deep.equal([ ['B'] ]);
        });

        it('Should delay update of dependent computed observable', function() {
            var data = ko.observable('A'),
                deferredComputed = ko.computed(data).extend({deferred:true}),
                dependentComputed = ko.computed(deferredComputed);

            expect(dependentComputed()).to.deep.equal('A');

            data('B');
            expect(deferredComputed()).to.deep.equal('B');
            expect(dependentComputed()).to.deep.equal('A');

            data('C');
            expect(dependentComputed()).to.deep.equal('A');

            Clock.tick(1);
            expect(dependentComputed()).to.deep.equal('C');
        });

        it('Should delay update of dependent pure computed observable', function() {
            var data = ko.observable('A'),
                deferredComputed = ko.computed(data).extend({deferred:true}),
                dependentComputed = ko.pureComputed(deferredComputed);

            expect(dependentComputed()).to.deep.equal('A');

            data('B');
            expect(deferredComputed()).to.deep.equal('B');
            expect(dependentComputed()).to.deep.equal('A');

            data('C');
            expect(dependentComputed()).to.deep.equal('A');

            Clock.tick(1);
            expect(dependentComputed()).to.deep.equal('C');
        });

        it('Should *not* delay update of dependent deferred computed observable', function () {
            var data = ko.observable('A').extend({deferred:true}),
                timesEvaluated = 0,
                computed1 = ko.computed(function () { return data() + 'X'; }).extend({deferred:true}),
                computed2 = ko.computed(function () { timesEvaluated++; return computed1() + 'Y'; }).extend({deferred:true}),
                notifySpy = createSpy('notifySpy'),
                subscription = computed2.subscribe(notifySpy);

            expect(computed2()).to.deep.equal('AXY');
            expect(timesEvaluated).to.deep.equal(1);

            data('B');
            expect(computed2()).to.deep.equal('BXY');
            expect(timesEvaluated).to.deep.equal(2);
            expect(notifySpy.called).to.equal(false);

            Clock.tick(1);
            expect(computed2()).to.deep.equal('BXY');
            expect(timesEvaluated).to.deep.equal(2);      // Verify that the computed wasn't evaluated again unnecessarily
            expect(notifySpy.argsForCall).to.deep.equal([ ['BXY'] ]);
        });

        it('Should *not* delay update of dependent deferred pure computed observable', function () {
            var data = ko.observable('A').extend({deferred:true}),
                timesEvaluated = 0,
                computed1 = ko.pureComputed(function () { return data() + 'X'; }).extend({deferred:true}),
                computed2 = ko.pureComputed(function () { timesEvaluated++; return computed1() + 'Y'; }).extend({deferred:true});

            expect(computed2()).to.deep.equal('AXY');
            expect(timesEvaluated).to.deep.equal(1);

            data('B');
            expect(computed2()).to.deep.equal('BXY');
            expect(timesEvaluated).to.deep.equal(2);

            Clock.tick(1);
            expect(computed2()).to.deep.equal('BXY');
            expect(timesEvaluated).to.deep.equal(2);      // Verify that the computed wasn't evaluated again unnecessarily
        });

        it('Should *not* delay update of dependent rate-limited computed observable', function() {
            var data = ko.observable('A'),
                deferredComputed = ko.computed(data).extend({deferred:true}),
                dependentComputed = ko.computed(deferredComputed).extend({rateLimit: 500}),
                notifySpy = createSpy('notifySpy'),
                subscription = dependentComputed.subscribe(notifySpy);

            expect(dependentComputed()).to.deep.equal('A');

            data('B');
            expect(deferredComputed()).to.deep.equal('B');
            expect(dependentComputed()).to.deep.equal('B');

            data('C');
            expect(dependentComputed()).to.deep.equal('C');
            expect(notifySpy.called).to.equal(false);

            Clock.tick(500);
            expect(dependentComputed()).to.deep.equal('C');
            expect(notifySpy.argsForCall).to.deep.equal([ ['C'] ]);
        });

        it('Is default behavior when "ko.options.deferUpdates" is "true"', function() {
            this.restoreAfter(ko.options, 'deferUpdates');
            ko.options.deferUpdates = true;

            var data = ko.observable('A'),
                computed = ko.computed(data),
                notifySpy = createSpy('notifySpy'),
                subscription = computed.subscribe(notifySpy);

            // Notification is deferred
            data('B');
            expect(notifySpy.called).to.equal(false);

            Clock.tick(1);
            expect(notifySpy.argsForCall).to.deep.equal([ ['B'] ]);
        });

        it('Is superseded by rate-limit', function() {
            this.restoreAfter(ko.options, 'deferUpdates');
            ko.options.deferUpdates = true;

            var data = ko.observable('A'),
                deferredComputed = ko.computed(data),
                dependentComputed = ko.computed(function() { return 'R' + deferredComputed(); }).extend({rateLimit: 500}),
                notifySpy = createSpy('notifySpy'),
                subscription1 = deferredComputed.subscribe(notifySpy),
                subscription2 = dependentComputed.subscribe(notifySpy);

            expect(dependentComputed()).to.deep.equal('RA');

            data('B');
            expect(deferredComputed()).to.deep.equal('B');
            expect(dependentComputed()).to.deep.equal('RB');
            expect(notifySpy.called).to.equal(false);       // no notifications yet

            Clock.tick(1);
            expect(notifySpy.argsForCall).to.deep.equal([ ['B'] ]);   // only the deferred computed notifies initially

            Clock.tick(499);
            expect(notifySpy.argsForCall).to.deep.equal([ ['B'], [ 'RB' ] ]); // the rate-limited computed notifies after the specified timeout
        });

        it('Should minimize evaluation at the end of a complex graph', function() {
            this.restoreAfter(ko.options, 'deferUpdates');
            ko.options.deferUpdates = true;

            var a = ko.observable('a'),
                b = ko.pureComputed(function b() {
                    return 'b' + a();
                }),
                c = ko.pureComputed(function c() {
                    return 'c' + a();
                }),
                d = ko.pureComputed(function d() {
                    return 'd(' + b() + ',' + c() + ')';
                }),
                e = ko.pureComputed(function e() {
                    return 'e' + a();
                }),
                f = ko.pureComputed(function f() {
                    return 'f' + a();
                }),
                g = ko.pureComputed(function g() {
                    return 'g(' + e() + ',' + f() + ')';
                }),
                h = ko.pureComputed(function h() {
                    return 'h(' + c() + ',' + g() + ',' + d() + ')';
                }),
                i = ko.pureComputed(function i() {
                    return 'i(' + a() + ',' + h() + ',' + b() + ',' + f() + ')';
                }).extend({notify:"always"}),   // ensure we get a notification for each evaluation
                notifySpy = createSpy('callback'),
                subscription = i.subscribe(notifySpy);

            a('x');
            Clock.tick(1);
            expect(notifySpy.argsForCall).to.deep.equal([['i(x,h(cx,g(ex,fx),d(bx,cx)),bx,fx)']]);    // only one evaluation and notification
        });

        it('Should minimize evaluation when dependent computed doesn\'t actually change', function() {
            // From https://github.com/knockout/knockout/issues/2174
            this.restoreAfter(ko.options, 'deferUpdates');
            ko.options.deferUpdates = true;

            var source = ko.observable({ key: 'value' }),
                c1 = ko.computed(function () {
                    return source()['key'];
                }),
                countEval = 0,
                c2 = ko.computed(function () {
                    countEval++;
                    return c1();
                });

            source({ key: 'value' });
            Clock.tick(1);
            expect(countEval).to.deep.equal(1);

            // Reading it again shouldn't cause an update
            expect(c2()).to.deep.equal(c1());
            expect(countEval).to.deep.equal(1);
        });

        it('Should ignore recursive dirty events', function() {
            // From https://github.com/knockout/knockout/issues/1943
            this.restoreAfter(ko.options, 'deferUpdates');
            ko.options.deferUpdates = true;

            var a = ko.observable(),
                b = ko.computed({ read : function() { a(); return d(); }, deferEvaluation : true }),
                d = ko.computed({ read : function() { a(); return b(); }, deferEvaluation : true }),
                bSpy = createSpy('bSpy'),
                dSpy = createSpy('dSpy');

            b.subscribe(bSpy, null, "dirty");
            d.subscribe(dSpy, null, "dirty");

            d();
            expect(bSpy.called).to.equal(false);
            expect(dSpy.called).to.equal(false);

            a('something');
            expect(bSpy.calls.length).to.equal(2);  // 1 for a, and 1 for d
            expect(dSpy.calls.length).to.equal(2);  // 1 for a, and 1 for b

            Clock.tick(1);
        });

        it('Should not cause loss of updates when an intermediate value is read by a dependent computed observable', function() {
            // From https://github.com/knockout/knockout/issues/1835
            var one = ko.observable(false).extend({deferred: true}),
                onePointOne = ko.computed(one).extend({deferred: true}),
                two = ko.observable(false),
                three = ko.computed(function() { return onePointOne() || two(); }),
                threeNotifications = [];

            three.subscribe(function(val) {
                threeNotifications.push(val);
            });

            // The loop shows that the same steps work continuously
            for (var i = 0; i < 3; i++) {
                expect(onePointOne() || two() || three()).to.deep.equal(false);
                threeNotifications = [];

                one(true);
                expect(threeNotifications).to.deep.equal([]);
                two(true);
                expect(threeNotifications).to.deep.equal([true]);
                two(false);
                expect(threeNotifications).to.deep.equal([true]);
                one(false);
                expect(threeNotifications).to.deep.equal([true]);

                Clock.tick(1);
                expect(threeNotifications).to.deep.equal([true, false]);
            }
        });

        it('Should only notify changes if computed was evaluated', function() {
            // See https://github.com/knockout/knockout/issues/2240
            // Set up a scenario where a computed will be marked as dirty but won't get marked as
            // stale and so won't be re-evaluated
            this.restoreAfter(ko.options, 'deferUpdates');
            ko.options.deferUpdates = true;

            var obs = ko.observable('somevalue'),
                isTruthy = ko.pureComputed(function() { return !!obs(); }),
                objIfTruthy = ko.pureComputed(function() { return isTruthy(); }).extend({ notify: 'always' }),
                notifySpy = createSpy('callback'),
                subscription = objIfTruthy.subscribe(notifySpy);

            obs('someothervalue');
            Clock.tick(1);
            expect(notifySpy.called).to.equal(false);

            obs('');
            Clock.tick(1);
            expect(notifySpy.called).to.equal(true);
            expect(notifySpy.argsForCall).to.deep.equal([[false]]);
            notifySpy.reset();

            obs(undefined);
            Clock.tick(1);
            expect(notifySpy.called).to.equal(false);
        });

        it('Should not re-evaluate if pure computed becomes asleep while a notification is pending', function() {
            this.restoreAfter(ko.options, 'deferUpdates');
            ko.options.deferUpdates = true;

            var data = ko.observable('A'),
                timesEvaluated = 0,
                computed1 = ko.computed(function () {
                    if (data() == 'B')
                        subscription.dispose();
                }),
                computed2 = ko.pureComputed(function () {
                    timesEvaluated++;
                    return data() + '2';
                }),
                notifySpy = createSpy('callback'),
                subscription = computed2.subscribe(notifySpy);

            // The computed is evaluated when awakened
            expect(timesEvaluated).to.deep.equal(1);

            // When we update the observable, both computeds will be marked dirty and scheduled for notification
            // But the first one will dispose the subscription to the second, putting it to sleep
            data('B');
            Clock.tick(1);
            expect(timesEvaluated).to.deep.equal(1);

            // When we read the computed it should be evaluated again because its dependencies have changed
            expect(computed2()).to.deep.equal('B2');
            expect(timesEvaluated).to.deep.equal(2);

            expect(notifySpy.called).to.equal(false);
        });
    });

    describe('ko.when', function() {
        it('Runs callback in a sepearate task when predicate function becomes true, but only once', function() {
            this.restoreAfter(ko.options, 'deferUpdates');
            ko.options.deferUpdates = true;

            var x = ko.observable(3),
                called = 0;

            ko.when(function () { return x() === 4; }, function () { called++; });

            x(5);
            expect(called).to.equal(0);
            expect(x.getSubscriptionsCount()).to.equal(1);

            x(4);
            expect(called).to.equal(0);

            Clock.tick(1);
            expect(called).to.equal(1);
            expect(x.getSubscriptionsCount()).to.equal(0);

            x(3);
            x(4);
            Clock.tick(1);
            expect(called).to.equal(1);
            expect(x.getSubscriptionsCount()).to.equal(0);
        });

        it('Runs callback in a sepearate task if predicate function is already true', function() {
            this.restoreAfter(ko.options, 'deferUpdates');
            ko.options.deferUpdates = true;

            var x = ko.observable(4),
                called = 0;

            ko.when(function () { return x() === 4; }, function () { called++; });

            expect(called).to.equal(0);
            expect(x.getSubscriptionsCount()).to.equal(1);

            Clock.tick(1);
            expect(called).to.equal(1);
            expect(x.getSubscriptionsCount()).to.equal(0);

            x(3);
            x(4);
            Clock.tick(1);
            expect(called).to.equal(1);
            expect(x.getSubscriptionsCount()).to.equal(0);
        });
    });
});
