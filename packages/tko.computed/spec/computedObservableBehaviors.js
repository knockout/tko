
import {
    isSubscribable, isObservable, observable, unwrap, dependencyDetection,
    isWritableObservable, isWriteableObservable, observableArray, subscribable
} from 'tko.observable';

import {
    computed, isPureComputed, isComputed
} from '../index.js';

describe('Dependent Observable', function() {
    it('Should be subscribable', function () {
        var instance = computed(function () { });
        expect(isSubscribable(instance)).toEqual(true);
    });

    it('Should advertise that instances are observable', function () {
        var instance = computed(function () { });
        expect(isObservable(instance)).toEqual(true);
    });

    it('Should unwrap the underlying value of observables', function() {
        var someObject = { abc: 123 },
            observablePrimitiveValue = observable(123),
            observableObjectValue = observable(someObject),
            observableNullValue = observable(null),
            observableUndefinedValue = observable(undefined),
            computedValue = computed(function() { return observablePrimitiveValue() + 1; });

        expect(unwrap(observablePrimitiveValue)).toBe(123);
        expect(unwrap(observableObjectValue)).toBe(someObject);
        expect(unwrap(observableNullValue)).toBe(null);
        expect(unwrap(observableUndefinedValue)).toBe(undefined);
        expect(unwrap(computedValue)).toBe(124);
    });

    it('Should advertise that instances are computed', function () {
        var instance = computed(function () { });
        expect(isComputed(instance)).toEqual(true);
    });

    it('Should advertise that instances are not pure computed', function () {
        var instance = computed(function () { });
        expect(isPureComputed(instance)).toEqual(false);
    });

    it('Should advertise that instances cannot have values written to them', function () {
        var instance = computed(function () { });
        expect(isWriteableObservable(instance)).toEqual(false);
        expect(isWritableObservable(instance)).toEqual(false);
    });

    it('Should require an evaluator function as constructor param', function () {
        expect(function () { computed(); }).toThrow();
    });

    it('Should be able to read the current value of the evaluator function', function () {
        var instance = computed(function () { return 123; });
        expect(instance()).toEqual(123);
    });

    it('Should not be able to write a value to it if there is no "write" callback', function () {
        var instance = computed(function () { return 123; });

        expect(function () { instance(456); }).toThrow();
        expect(instance()).toEqual(123);
    });

    it('Should invoke the "write" callback, where present, if you attempt to write a value to it', function() {
        var invokedWriteWithValue, invokedWriteWithThis;
        var instance = computed({
            read: function() {},
            write: function(value) { invokedWriteWithValue = value; invokedWriteWithThis = this; }
        });

        var someContainer = { depObs: instance };
        someContainer.depObs("some value");
        expect(invokedWriteWithValue).toEqual("some value");
        expect(invokedWriteWithThis).toEqual(function(){return this;}.call()); // Since no owner was specified
    });

    it('Should be able to write to multiple computed properties on a model object using chaining syntax', function() {
        var model = {
            prop1: computed({
                read: function(){},
                write: function(value) {
                    expect(value).toEqual("prop1");
                } }),
            prop2: computed({
                read: function(){},
                write: function(value) {
                    expect(value).toEqual("prop2");
                } })
        };
        model.prop1('prop1').prop2('prop2');
    });

    it('Should be able to use Function.prototype methods to access/update', function() {
        var instance = computed({read: function() {return 'A';}, write: function(/* value */) {}});
        var obj = {};

        expect(instance.call(null)).toEqual('A');
        expect(instance.apply(null, [])).toBe('A');
        expect(instance.call(obj, 'B')).toBe(obj);
    });

    it('Should use options.owner as "this" when invoking the "write" callback, and can pass multiple parameters', function() {
        var invokedWriteWithArgs, invokedWriteWithThis;
        var someOwner = {};
        var obs = observable();
        var instance = computed({
            read: function() { return obs(); },
            write: function() { obs(null); invokedWriteWithArgs = Array.prototype.slice.call(arguments, 0); invokedWriteWithThis = this; },
            owner: someOwner
        });

        instance("first", 2, ["third1", "third2"]);
        expect(invokedWriteWithArgs.length).toEqual(3);
        expect(invokedWriteWithArgs[0]).toEqual("first");
        expect(invokedWriteWithArgs[1]).toEqual(2);
        expect(invokedWriteWithArgs[2]).toEqual(["third1", "third2"]);
        expect(invokedWriteWithThis).toEqual(someOwner);
    });

    it('Should use the second arg (evaluatorFunctionTarget) for "this" when calling read/write if no options.owner was given', function() {
        var expectedThis = {}, actualReadThis, actualWriteThis;
        var obs = observable();
        var instance = computed({
            read: function() { actualReadThis = this; return obs(); },
            write: function() { actualWriteThis = this; obs(null); }
        }, expectedThis);

        instance("force invocation of write");

        expect(actualReadThis).toEqual(expectedThis);
        expect(actualWriteThis).toEqual(expectedThis);
    });

    it('Should be able to pass evaluator function using "options" parameter called "read"', function() {
        var instance = computed({
            read: function () { return 123; }
        });
        expect(instance()).toEqual(123);
    });

    it('Should cache result of evaluator function and not call it again until dependencies change', function () {
        var timesEvaluated = 0;
        var instance = computed(function () { timesEvaluated++; return 123; });
        expect(instance()).toEqual(123);
        expect(instance()).toEqual(123);
        expect(timesEvaluated).toEqual(1);
    });

    it('Should automatically update value when a dependency changes', function () {
        var observableInstance = new observable(1);
        var depedentObservable = computed(function () { return observableInstance() + 1; });
        expect(depedentObservable()).toEqual(2);

        observableInstance(50);
        expect(depedentObservable()).toEqual(51);
    });

    it('Should be able to use \'peek\' on an observable to avoid a dependency', function() {
        var observableInstance = observable(1),
            computedInstance = computed(function () { return observableInstance.peek() + 1; });
        expect(computedInstance()).toEqual(2);

        observableInstance(50);
        expect(computedInstance()).toEqual(2);    // value wasn't changed
    });

    it('Should be able to use \'ko.ignoreDependencies\' within a computed to avoid dependencies', function() {
        var observableInstance = observable(1),
            computedInstance = computed(function () {
                return dependencyDetection.ignoreDependencies(function() { return observableInstance() + 1; } );
            });
        expect(computedInstance()).toEqual(2);

        observableInstance(50);
        expect(computedInstance()).toEqual(2);    // value wasn't changed
    });

    it('Should unsubscribe from previous dependencies each time a dependency changes', function () {
        var observableA = new observable("A");
        var observableB = new observable("B");
        var observableToUse = "A";
        var timesEvaluated = 0;
        var depedentObservable = computed(function () {
            timesEvaluated++;
            return observableToUse == "A" ? observableA() : observableB();
        });

        expect(depedentObservable()).toEqual("A");
        expect(timesEvaluated).toEqual(1);

        // Changing an unrelated observable doesn't trigger evaluation
        observableB("B2");
        expect(timesEvaluated).toEqual(1);

        // Switch to other observable
        observableToUse = "B";
        observableA("A2");
        expect(depedentObservable()).toEqual("B2");
        expect(timesEvaluated).toEqual(2);

        // Now changing the first observable doesn't trigger evaluation
        observableA("A3");
        expect(timesEvaluated).toEqual(2);
    });

    it('Should notify subscribers of changes', function () {
        var notifiedValue;
        var observableInstance = new observable(1);
        var depedentObservable = computed(function () { return observableInstance() + 1; });
        depedentObservable.subscribe(function (value) { notifiedValue = value; });

        expect(notifiedValue).toEqual(undefined);
        observableInstance(2);
        expect(notifiedValue).toEqual(3);
    });

    it('Should notify "beforeChange" subscribers before changes', function () {
        var notifiedValue;
        var observableInstance = new observable(1);
        var depedentObservable = computed(function () { return observableInstance() + 1; });
        depedentObservable.subscribe(function (value) { notifiedValue = value; }, null, "beforeChange");

        expect(notifiedValue).toEqual(undefined);
        observableInstance(2);
        expect(notifiedValue).toEqual(2);
        expect(depedentObservable()).toEqual(3);
    });

    it('Should only update once when each dependency changes, even if evaluation calls the dependency multiple times', function () {
        var notifiedValues = [];
        var observableInstance = new observable();
        var depedentObservable = computed(function () { return observableInstance() * observableInstance(); });
        depedentObservable.subscribe(function (value) { notifiedValues.push(value); });
        observableInstance(2);
        expect(notifiedValues.length).toEqual(1);
        expect(notifiedValues[0]).toEqual(4);
    });

    it('Should be able to chain computed observables', function () {
        var underlyingObservable = new observable(1);
        var computed1 = computed(function () { return underlyingObservable() + 1; });
        var computed2 = computed(function () { return computed1() + 1; });
        expect(computed2()).toEqual(3);

        underlyingObservable(11);
        expect(computed2()).toEqual(13);
    });

    it('Should be able to use \'peek\' on a computed observable to avoid a dependency', function () {
        var underlyingObservable = new observable(1);
        var computed1 = computed(function () { return underlyingObservable() + 1; });
        var computed2 = computed(function () { return computed1.peek() + 1; });
        expect(computed2()).toEqual(3);
        expect(computed2.isActive()).toEqual(false);

        underlyingObservable(11);
        expect(computed2()).toEqual(3);    // value wasn't changed
    });

    it('Should accept "owner" parameter to define the object on which the evaluator function should be called', function () {
        var model = new (function () {
            this.greeting = "hello";
            this.fullMessageWithoutOwner = computed(function () { return (this || {}).greeting + " world"; });
            this.fullMessageWithOwner = computed(function () { return this.greeting + " world"; }, this);
        })();
        expect(model.fullMessageWithoutOwner()).toEqual("undefined world");
        expect(model.fullMessageWithOwner()).toEqual("hello world");
    });

    it('Should dispose and not call its evaluator function when the disposeWhen function returns true', function () {
        var underlyingObservable = new observable(100);
        var timeToDispose = false;
        var timesEvaluated = 0;
        var computedInstance = computed(
            function () { timesEvaluated++; return underlyingObservable() + 1; },
            null,
            { disposeWhen: function () { return timeToDispose; } }
        );
        expect(timesEvaluated).toEqual(1);
        expect(computedInstance.getDependenciesCount()).toEqual(1);
        expect(computedInstance.isActive()).toEqual(true);

        timeToDispose = true;
        underlyingObservable(101);
        expect(timesEvaluated).toEqual(1);
        expect(computedInstance.getDependenciesCount()).toEqual(0);
        expect(computedInstance.isActive()).toEqual(false);
    });

    it('Should dispose itself as soon as disposeWhen returns true, as long as it isn\'t waiting for a DOM node to be removed', function() {
        var underlyingObservable = observable(100),
            computedInstance = computed(
                underlyingObservable,
                null,
                { disposeWhen: function() { return true; } }
            );

        expect(underlyingObservable.getSubscriptionsCount()).toEqual(0);
        expect(computedInstance.isActive()).toEqual(false);
    });

    it('Should delay disposal until after disposeWhen returns false if it is waiting for a DOM node to be removed', function() {
        var underlyingObservable = observable(100),
            shouldDispose = true,
            computedInstance = computed(
                underlyingObservable,
                null,
                { disposeWhen: function() { return shouldDispose; }, disposeWhenNodeIsRemoved: true }
            );

        // Even though disposeWhen returns true, it doesn't dispose yet, because it's
        // expecting an initial 'false' result to indicate the DOM node is still in the document
        expect(underlyingObservable.getSubscriptionsCount()).toEqual(1);
        expect(computedInstance.isActive()).toEqual(true);

        // Trigger the false result. Of course it still doesn't dispose yet, because
        // disposeWhen says false.
        shouldDispose = false;
        underlyingObservable(101);
        expect(underlyingObservable.getSubscriptionsCount()).toEqual(1);
        expect(computedInstance.isActive()).toEqual(true);

        // Now trigger a true result. This time it will dispose.
        shouldDispose = true;
        underlyingObservable(102);
        expect(underlyingObservable.getSubscriptionsCount()).toEqual(0);
        expect(computedInstance.isActive()).toEqual(false);
    });

    it('Should describe itself as active if the evaluator has dependencies on its first run', function() {
        var someObservable = observable('initial'),
            computedInstance = computed(function () { return someObservable(); });
        expect(computedInstance.isActive()).toEqual(true);
    });

    it('Should describe itself as inactive if the evaluator has no dependencies on its first run', function() {
        var computedInstance = computed(function () { return 123; });
        expect(computedInstance.isActive()).toEqual(false);
    });

    it('Should describe itself as inactive if subsequent runs of the evaluator result in there being no dependencies', function() {
        var someObservable = observable('initial'),
            shouldHaveDependency = true,
            computedInstance = computed(function () { return shouldHaveDependency && someObservable(); });
        expect(computedInstance.isActive()).toEqual(true);

        // Trigger a refresh
        shouldHaveDependency = false;
        someObservable('modified');
        expect(computedInstance.isActive()).toEqual(false);
    });

    it('Should advertise that instances *can* have values written to them if you supply a "write" callback', function() {
        var instance = computed({
            read: function() {},
            write: function() {}
        });
        expect(isWriteableObservable(instance)).toEqual(true);
        expect(isWritableObservable(instance)).toEqual(true);
    });

    it('Should allow deferring of evaluation (and hence dependency detection)', function () {
        var timesEvaluated = 0;
        var instance = computed({
            read: function () { timesEvaluated++; return 123; },
            deferEvaluation: true
        });
        expect(timesEvaluated).toEqual(0);
        expect(instance()).toEqual(123);
        expect(timesEvaluated).toEqual(1);
    });

    it('Should perform dependency detection when subscribed to when constructed with "deferEvaluation"', function() {
        var data = observable(1),
            computedInstance = computed({ read: data, deferEvaluation: true }),
            result = observable();

        // initially computed has no dependencies since it has not been evaluated
        expect(computedInstance.getDependenciesCount()).toEqual(0);

        // Now subscribe to computed
        computedInstance.subscribe(result);

        // The dependency should now be tracked
        expect(computedInstance.getDependenciesCount()).toEqual(1);

        // But the subscription should not have sent down the initial value
        expect(result()).toEqual(undefined);

        // Updating data should trigger the subscription
        data(42);
        expect(result()).toEqual(42);
    });

    it('Should fire "awake" event when deferred computed is first evaluated', function() {
        var data = observable('A'),
            computedInstance = computed({ read: data, deferEvaluation: true });

        var notifySpy = jasmine.createSpy('notifySpy');
        computedInstance.subscribe(notifySpy, null, 'awake');

        expect(notifySpy).not.toHaveBeenCalled();

        expect(computedInstance()).toEqual('A');
        expect(notifySpy).toHaveBeenCalledWith('A');
        expect(notifySpy.calls.length).toBe(1);

        // Subscribing or updating data shouldn't trigger any more notifications
        notifySpy.reset();
        computedInstance.subscribe(function() {});
        data('B');
        computedInstance();
        expect(notifySpy).not.toHaveBeenCalled();
    });

    it('Should prevent recursive calling of read function', function() {
        var observableInstance = observable(0);
        computed(function() {
            // this both reads and writes to the observable
            // will result in errors like "Maximum call stack size exceeded" (chrome)
            // or "Out of stack space" (IE) or "too much recursion" (Firefox) if recursion
            // isn't prevented
            observableInstance(observableInstance() + 1);
        });
    });

    it('Should not subscribe to observables accessed through change notifications of a computed', function() {
        // See https://github.com/SteveSanderson/knockout/issues/341
        var observableDependent = observable(),
            observableIndependent = observable(),
            computedInstance = computed(function() { return observableDependent(); });

        // initially there is only one dependency
        expect(computedInstance.getDependenciesCount()).toEqual(1);

        // create a change subscription that also accesses an observable
        computedInstance.subscribe(function() { observableIndependent(); });
        // now trigger evaluation of the computed by updating its dependency
        observableDependent(1);
        // there should still only be one dependency
        expect(computedInstance.getDependenciesCount()).toEqual(1);

        // also test with a beforeChange subscription
        computedInstance.subscribe(function() { observableIndependent(); }, null, 'beforeChange');
        observableDependent(2);
        expect(computedInstance.getDependenciesCount()).toEqual(1);
    });

    it('Should not subscribe to observables accessed through change notifications of a modified observable', function() {
        // See https://github.com/SteveSanderson/knockout/issues/341
        var observableDependent = observable(),
            observableIndependent = observable(),
            observableModified = observable(),
            computedInstance = computed(function() { observableModified(observableDependent()); });

        // initially there is only one dependency
        expect(computedInstance.getDependenciesCount()).toEqual(1);

        // create a change subscription that also accesses an observable
        observableModified.subscribe(function() { observableIndependent(); });
        // now trigger evaluation of the computed by updating its dependency
        observableDependent(1);
        // there should still only be one dependency
        expect(computedInstance.getDependenciesCount()).toEqual(1);

        // also test with a beforeChange subscription
        observableModified.subscribe(function() { observableIndependent(); }, null, 'beforeChange');
        observableDependent(2);
        expect(computedInstance.getDependenciesCount()).toEqual(1);
    });

    it('Should be able to re-evaluate a computed that previously threw an exception', function() {
        var observableSwitch = observable(true), observableValue = observable(1),
            computedInstance = computed(function() {
                if (!observableSwitch()) {
                    throw Error("Error during computed evaluation");
                } else {
                    return observableValue();
                }
            });

        // Initially the computed evaluated sucessfully
        expect(computedInstance()).toEqual(1);

        expect(function () {
            // Update observable to cause computed to throw an exception
            observableSwitch(false);
        }).toThrow("Error during computed evaluation");

        // The value of the computed is now undefined, although currently it keeps the previous value
        expect(computedInstance()).toEqual(1);
        // The computed should not be dependent on the second observable
        expect(computedInstance.getDependenciesCount()).toEqual(1);

        // Updating the second observable shouldn't re-evaluate computed
        observableValue(2);
        expect(computedInstance()).toEqual(1);

        // Update the first observable to cause computed to re-evaluate
        observableSwitch(1);
        expect(computedInstance()).toEqual(2);
    });

    it('Should expose a "notify" extender that can configure a computed to notify on all changes', function() {
        var notifiedValues = [];
        var observableInstance = observable(1);
        var computedInstance = computed(function () { return observableInstance(); });
        computedInstance.subscribe(function (value) { notifiedValues.push(value); });

        expect(notifiedValues).toEqual([]);

        // Trigger update without changing value; the computed will not notify the change (default behavior)
        observableInstance.valueHasMutated();
        expect(notifiedValues).toEqual([]);

        // Set the computed to notify always
        computedInstance.extend({ notify: 'always' });
        observableInstance.valueHasMutated();
        expect(notifiedValues).toEqual([1]);
    });


    it('Should support array tracking using extender', function() {
        var myArray = observable(['Alpha', 'Beta', 'Gamma']),
            myComputed = computed(function() {
                return myArray().slice(-2);
            }).extend({trackArrayChanges:true}),
            changelist;

        expect(myComputed()).toEqual(['Beta', 'Gamma']);

        var arrayChange = myComputed.subscribe(function(changes) {
            changelist = changes;
        }, null, 'arrayChange');

        myArray(['Alpha', 'Beta', 'Gamma', 'Delta']);
        expect(myComputed()).toEqual(['Gamma', 'Delta']);
        expect(changelist).toEqual([
            { status : 'deleted', value : 'Beta', index : 0 },
            { status : 'added', value : 'Delta', index : 1 }
        ]);

        // Should clean up all subscriptions when arrayChange subscription is disposed
        arrayChange.dispose();
        expect(myComputed.getSubscriptionsCount()).toBe(0);
    });

    // Borrowed from haberman/knockout (see knockout/knockout#359)
    it('Should allow long chains without overflowing the stack', function() {
        // maximum with previous code (when running this test only): Chrome 28: 1310, IE 10: 2200; FF 23: 103
        // maximum with changed code: Chrome 28: 2620, +100%, IE 10: 4900, +122%; FF 23: 267, +160%
        // (per #1622 and #1905, max depth reduced to pass tests in older FF)
        var depth = 100;
        var first = observable(0);
        var last = first;
        for (var i = 0; i < depth; i++) {
            (function() {
                var l = last;
                last = computed(function() { return l() + 1; });
            })();
        }
        var all = computed(function() { return last() + first(); });
        first(1);
        expect(all()).toEqual(depth+2);
    });

    it('Should inherit any properties defined on ko.subscribable.fn or computed.fn', function() {
        this.after(function() {
            delete subscribable.fn.customProp;       // Will be able to reach this
            delete subscribable.fn.customFunc;       // Overridden on computed.fn
            delete computed.fn.customFunc;         // Will be able to reach this
        });

        subscribable.fn.customProp = 'subscribable value';
        subscribable.fn.customFunc = function() { throw new Error('Shouldn\'t be reachable'); };
        computed.fn.customFunc = function() { return this(); };

        var instance = computed(function() { return 123; });
        expect(instance.customProp).toEqual('subscribable value');
        expect(instance.customFunc()).toEqual(123);
    });

    it('Should have access to functions added to "fn" on existing instances on supported browsers', function () {
        // On unsupported browsers, there's nothing to test
        if (!jasmine.browserSupportsProtoAssignment) {
            return;
        }

        this.after(function() {
            delete subscribable.fn.customFunction1;
            delete computed.fn.customFunction2;
        });

        var computedInstance = computed(function () {});

        var customFunction1 = function () {};
        var customFunction2 = function () {};

        subscribable.fn.customFunction1 = customFunction1;
        computed.fn.customFunction2 = customFunction2;

        expect(computedInstance.customFunction1).toBe(customFunction1);
        expect(computedInstance.customFunction2).toBe(customFunction2);
    });

    it('Should not evaluate (or add dependencies) after it has been disposed', function () {
        var evaluateCount = 0,
            observableInstance = observable(0),
            computedInstance = computed(function () {
                return ++evaluateCount + observableInstance();
            });

        expect(evaluateCount).toEqual(1);
        computedInstance.dispose();

        // This should not cause a new evaluation
        observableInstance(1);
        expect(evaluateCount).toEqual(1);
        expect(computedInstance()).toEqual(1);
        expect(computedInstance.getDependenciesCount()).toEqual(0);
    });

    it('Should not evaluate (or add dependencies) after it has been disposed if created with "deferEvaluation"', function () {
        var evaluateCount = 0,
            observableInstance = observable(0),
            computedInstance = computed({
                read: function () {
                    return ++evaluateCount + observable();
                },
                deferEvaluation: true
            });

        expect(evaluateCount).toEqual(0);
        computedInstance.dispose();

        // This should not cause a new evaluation
        observableInstance(1);
        expect(evaluateCount).toEqual(0);
        expect(computedInstance()).toEqual(undefined);
        expect(computedInstance.getDependenciesCount()).toEqual(0);
    });

    it('Should not add dependencies if disposed during evaluation', function () {
        // This is a bit of a contrived example and likely won't occur in any actual applications.
        // A more likely scenario might involve a binding that removes a node connected to the binding,
        // causing the binding's computed observable to dispose.
        // See https://github.com/knockout/knockout/issues/1041
        var evaluateCount = 0,
            observableToTriggerDisposal = observable(false),
            observableGivingValue = observable(0),
            computedInstance = computed(function() {
                if (observableToTriggerDisposal())
                    computedInstance.dispose();
                return ++evaluateCount + observableGivingValue();
            });

        // Check initial state
        expect(evaluateCount).toEqual(1);
        expect(computedInstance()).toEqual(1);
        expect(computedInstance.getDependenciesCount()).toEqual(2);
        expect(observableGivingValue.getSubscriptionsCount()).toEqual(1);

        // Now cause a disposal during evaluation
        observableToTriggerDisposal(true);
        expect(evaluateCount).toEqual(2);
        expect(computedInstance()).toEqual(2);
        expect(computedInstance.getDependenciesCount()).toEqual(0);
        expect(observableGivingValue.getSubscriptionsCount()).toEqual(0);
    });

    describe('Context', function() {
        it('Should accurately report initial evaluation', function() {
            var observableInstance = observable(1),
                evaluationCount = 0,
                computedInstance = computed(function() {
                    ++evaluationCount;
                    observableInstance();   // for dependency
                    return dependencyDetection.isInitial();
                });

            expect(evaluationCount).toEqual(1);     // single evaluation
            expect(computedInstance()).toEqual(true);       // value of isInitial was true

            observableInstance(2);
            expect(evaluationCount).toEqual(2);     // second evaluation
            expect(computedInstance()).toEqual(false);      // value of isInitial was false

            // value outside of computed is undefined
            expect(dependencyDetection.isInitial()).toBeUndefined();
        });

        it('Should accurately report initial evaluation when deferEvaluation is true', function() {
            var observableInstance = observable(1),
                evaluationCount = 0,
                computedInstance = computed(function() {
                    ++evaluationCount;
                    observableInstance();   // for dependency
                    return dependencyDetection.isInitial();
                }, null, {deferEvaluation:true});

            expect(evaluationCount).toEqual(0);     // no evaluation yet
            expect(computedInstance()).toEqual(true);       // first access causes evaluation; value of isInitial was true
            expect(evaluationCount).toEqual(1);     // single evaluation

            observableInstance(2);
            expect(evaluationCount).toEqual(2);     // second evaluation
            expect(computedInstance()).toEqual(false);      // value of isInitial was false
        });

        it('Should accurately report the number of dependencies', function() {
            var observable1 = observable(1),
                observable2 = observable(1),
                evaluationCount = 0,
                computedInstance = computed(function() {
                    ++evaluationCount;
                    // no dependencies at first
                    expect(dependencyDetection.getDependenciesCount()).toEqual(0);
                    // add a single dependency
                    observable1();
                    expect(dependencyDetection.getDependenciesCount()).toEqual(1);
                    // add a second one
                    observable2();
                    expect(dependencyDetection.getDependenciesCount()).toEqual(2);
                    // accessing observable again doesn't affect count
                    observable1();
                    expect(dependencyDetection.getDependenciesCount()).toEqual(2);
                });

            expect(evaluationCount).toEqual(1);     // single evaluation
            expect(computedInstance.getDependenciesCount()).toEqual(2); // matches value from context

            observable1(2);
            expect(evaluationCount).toEqual(2);     // second evaluation
            expect(computedInstance.getDependenciesCount()).toEqual(2); // matches value from context

            // value outside of computed is undefined
            expect(dependencyDetection.getDependenciesCount()).toBeUndefined();
        });
    });

    describe("observableArray properties", function () {
        it('Should be able to call standard mutators without creating a subscription', function() {
            var timesEvaluated = 0,
                newArray = observableArray(["Alpha", "Beta", "Gamma"]);

            computed(function() {
                // Make a few standard mutations
                newArray.push("Delta");
                newArray.remove("Beta");
                newArray.splice(2, 1);

                // Peek to ensure we really had the intended effect
                expect(newArray.peek()).toEqual(["Alpha", "Gamma"]);

                // Also make use of the KO delete/destroy functions to check they don't cause subscriptions
                newArray([{ someProp: 123 }]);
                newArray.destroyAll();
                expect(newArray.peek()[0]._destroy).toEqual(true);
                newArray.removeAll();
                expect(newArray.peek()).toEqual([]);

                timesEvaluated++;
            });

            // Verify that we haven't caused a subscription
            expect(timesEvaluated).toEqual(1);
            expect(newArray.getSubscriptionsCount()).toEqual(0);

            // Don't just trust getSubscriptionsCount - directly verify that mutating newArray doesn't cause a re-eval
            newArray.push("Another");
            expect(timesEvaluated).toEqual(1);
        });
    });
});
