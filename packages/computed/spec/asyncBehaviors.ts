/* globals waits, runs, waitsFor */

//
// TODO/FIXME:
// The following is a combination of observable and comptued behavior.  In
// future the Observable-only parts ought to be moved to tko.observable tests.
//

import {
    tasks, options
} from '@tko/utils'

import {
    observable as koObservable,
    observableArray as koObservableArray,
    subscribable as koSubscribable
} from '@tko/observable'

import {
    computed as koComputed,
    pureComputed as koPureComputed,
    when
} from '../dist'

import {
    useMockForTasks
} from '@tko/utils/helpers/jasmine-13-helper'

describe('Throttled observables', function () {
  beforeEach(function () { waits(1) }) // Workaround for spurious timing-related failures on IE8 (issue #736)

  it('Should notify subscribers asynchronously after writes stop for the specified timeout duration', function () {
    var observable = koObservable('A').extend({ throttle: 100 })
    var notifiedValues = new Array()
    observable.subscribe(function (value) {
      notifiedValues.push(value)
    })

    runs(function () {
            // Mutate a few times
      observable('B')
      observable('C')
      observable('D')
      expect(notifiedValues.length).toEqual(0) // Should not notify synchronously
    })

        // Wait
    waits(10)
    runs(function () {
            // Mutate more
      observable('E')
      observable('F')
      expect(notifiedValues.length).toEqual(0) // Should not notify until end of throttle timeout
    })

        // Wait until after timeout
    waitsFor(function () {
      return notifiedValues.length > 0
    }, "Timeout", 300)
    runs(function () {
      expect(notifiedValues.length).toEqual(1)
      expect(notifiedValues[0]).toEqual('F')
    })
  })
})

describe('Throttled dependent observables', function () {
  beforeEach(function () { waits(1) }) // Workaround for spurious timing-related failures on IE8 (issue #736)

  it('Should notify subscribers asynchronously after dependencies stop updating for the specified timeout duration', function () {
    var underlying = koObservable()
    var asyncDepObs = koComputed(function () {
      return underlying()
    }).extend({ throttle: 100 })
    var notifiedValues = new Array()
    asyncDepObs.subscribe(function (value) {
      notifiedValues.push(value)
    })

        // Check initial state
    expect(asyncDepObs()).toBeUndefined()
    runs(function () {
            // Mutate
      underlying('New value')
      expect(asyncDepObs()).toBeUndefined() // Should not update synchronously
      expect(notifiedValues.length).toEqual(0)
    })

        // Still shouldn't have evaluated
    waits(10)
    runs(function () {
      expect(asyncDepObs()).toBeUndefined() // Should not update until throttle timeout
      expect(notifiedValues.length).toEqual(0)
    })

        // Now wait for throttle timeout
    waitsFor(function () {
      return notifiedValues.length > 0
    }, "Timeout", 300)
    runs(function () {
      expect(asyncDepObs()).toEqual('New value')
      expect(notifiedValues.length).toEqual(1)
      expect(notifiedValues[0]).toEqual('New value')
    })
  })

  it('Should run evaluator only once when dependencies stop updating for the specified timeout duration', function () {
    var evaluationCount = 0
    var someDependency = koObservable()
    var asyncDepObs = koComputed(function () {
      evaluationCount++
      return someDependency()
    }).extend({ throttle: 100 })

    runs(function () {
            // Mutate a few times synchronously
      expect(evaluationCount).toEqual(1) // Evaluates synchronously when first created, like all dependent observables
      someDependency('A')
      someDependency('B')
      someDependency('C')
      expect(evaluationCount).toEqual(1) // Should not re-evaluate synchronously when dependencies update
    })

        // Also mutate async
    waits(10)
    runs(function () {
      someDependency('D')
      expect(evaluationCount).toEqual(1)
    })

        // Now wait for throttle timeout
    waitsFor(function () {
      return evaluationCount > 1
    }, "Timeout", 300)
    runs(function () {
      expect(evaluationCount).toEqual(2) // Finally, it's evaluated
      expect(asyncDepObs()).toEqual('D')
    })
  })
})

describe('Rate-limited', function () {
  beforeEach(function () {
    jasmine.Clock.useMock()
  })

  describe('Subscribable', function () {
    it('Should delay change notifications', function () {
      var subscribable = new koSubscribable().extend({rateLimit: 500})
      var notifySpy = jasmine.createSpy('notifySpy')
      subscribable.subscribe(notifySpy)
      subscribable.subscribe(notifySpy, null, 'custom')

            // "change" notification is delayed
      subscribable.notifySubscribers('a', 'change')
      expect(notifySpy).not.toHaveBeenCalled()

            // Default notification is delayed
      subscribable.notifySubscribers('b')
      expect(notifySpy).not.toHaveBeenCalled()

            // Other notifications happen immediately
      subscribable.notifySubscribers('c', 'custom')
      expect(notifySpy).toHaveBeenCalledWith('c')

            // Advance clock; Change notification happens now using the latest value notified
      notifySpy.reset()
      jasmine.Clock.tick(500)
      expect(notifySpy).toHaveBeenCalledWith('b')
    })

    it('Should notify every timeout interval using notifyAtFixedRate method ', function () {
      var subscribable = new koSubscribable().extend({rateLimit: {method: 'notifyAtFixedRate', timeout: 50}})
      var notifySpy = jasmine.createSpy('notifySpy')
      subscribable.subscribe(notifySpy)

            // Push 10 changes every 25 ms
      for (var i = 0; i < 10; ++i) {
        subscribable.notifySubscribers(i + 1)
        jasmine.Clock.tick(25)
      }

            // Notification happens every 50 ms, so every other number is notified
      expect(notifySpy.calls.length).toBe(5)
      expect(notifySpy.argsForCall).toEqual([ [2], [4], [6], [8], [10] ])

            // No more notifications happen
      notifySpy.reset()
      jasmine.Clock.tick(50)
      expect(notifySpy).not.toHaveBeenCalled()
    })

    it('Should notify after nothing happens for the timeout period using notifyWhenChangesStop method', function () {
      var subscribable = new koSubscribable().extend({rateLimit: {method: 'notifyWhenChangesStop', timeout: 50}})
      var notifySpy = jasmine.createSpy('notifySpy')
      subscribable.subscribe(notifySpy)

            // Push 10 changes every 25 ms
      for (var i = 0; i < 10; ++i) {
        subscribable.notifySubscribers(i + 1)
        jasmine.Clock.tick(25)
      }

            // No notifications happen yet
      expect(notifySpy).not.toHaveBeenCalled()

            // Notification happens after the timeout period
      jasmine.Clock.tick(50)
      expect(notifySpy.calls.length).toBe(1)
      expect(notifySpy).toHaveBeenCalledWith(10)
    })

    it('Should use latest settings when applied multiple times', function () {
      var subscribable = new koSubscribable().extend({rateLimit: 250}).extend({rateLimit: 500})
      var notifySpy = jasmine.createSpy('notifySpy')
      subscribable.subscribe(notifySpy)

      subscribable.notifySubscribers('a')

      jasmine.Clock.tick(250)
      expect(notifySpy).not.toHaveBeenCalled()

      jasmine.Clock.tick(250)
      expect(notifySpy).toHaveBeenCalledWith('a')
    })

    it('Uses latest settings for future notification and previous settings for pending notification', function () {
            // This test describes the current behavior for the given scenario but is not a contract for that
            // behavior, which could change in the future if convenient.
      var subscribable = new koSubscribable().extend({rateLimit: 250})
      var notifySpy = jasmine.createSpy('notifySpy')
      subscribable.subscribe(notifySpy)

      subscribable.notifySubscribers('a')  // Pending notification

            // Apply new setting and schedule new notification
      subscribable = subscribable.extend({rateLimit: 500})
      subscribable.notifySubscribers('b')

            // First notification happens using original settings
      jasmine.Clock.tick(250)
      expect(notifySpy).toHaveBeenCalledWith('a')

            // Second notification happends using later settings
      notifySpy.reset()
      jasmine.Clock.tick(250)
      expect(notifySpy).toHaveBeenCalledWith('b')
    })
  })

  describe('Observable', function () {
    it('Should delay change notifications', function () {
      var observable = koObservable().extend({rateLimit: 500})
      var notifySpy = jasmine.createSpy('notifySpy')
      observable.subscribe(notifySpy)
      var beforeChangeSpy = jasmine.createSpy('beforeChangeSpy')
                .andCallFake(function (value) { expect(observable()).toBe(value) })
      observable.subscribe(beforeChangeSpy, null, 'beforeChange')

            // Observable is changed, but notification is delayed
      observable('a')
      expect(observable()).toEqual('a')
      expect(notifySpy).not.toHaveBeenCalled()
      expect(beforeChangeSpy).toHaveBeenCalledWith(undefined)    // beforeChange notification happens right away

            // Second change notification is also delayed
      observable('b')
      expect(notifySpy).not.toHaveBeenCalled()

            // Advance clock; Change notification happens now using the latest value notified
      jasmine.Clock.tick(500)
      expect(notifySpy).toHaveBeenCalledWith('b')
      expect(beforeChangeSpy.calls.length).toBe(1)   // Only one beforeChange notification
    })

    it('Should notify "spectator" subscribers whenever the value changes', function () {
      var observable = koObservable('A').extend({rateLimit: 500}),
        spectateSpy = jasmine.createSpy('notifySpy'),
        notifySpy = jasmine.createSpy('notifySpy')

      observable.subscribe(spectateSpy, null, 'spectate')
      observable.subscribe(notifySpy)

      expect(spectateSpy).not.toHaveBeenCalled()
      expect(notifySpy).not.toHaveBeenCalled()

      observable('B')
      expect(spectateSpy).toHaveBeenCalledWith('B')
      observable('C')
      expect(spectateSpy).toHaveBeenCalledWith('C')

      expect(notifySpy).not.toHaveBeenCalled()
      jasmine.Clock.tick(500)

    // "spectate" was called for each new value
      expect(spectateSpy.argsForCall).toEqual([ ['B'], ['C'] ])
    // whereas "change" was only called for the final value
      expect(notifySpy.argsForCall).toEqual([ ['C'] ])
    })

    it('Should suppress change notification when value is changed/reverted', function () {
      var observable = koObservable('original').extend({rateLimit: 500})
      var notifySpy = jasmine.createSpy('notifySpy')
      observable.subscribe(notifySpy)
      var beforeChangeSpy = jasmine.createSpy('beforeChangeSpy')
      observable.subscribe(beforeChangeSpy, null, 'beforeChange')

      observable('new')                      // change value
      expect(observable()).toEqual('new')    // access observable to make sure it really has the changed value
      observable('original')                 // but then change it back
      expect(notifySpy).not.toHaveBeenCalled()
      jasmine.Clock.tick(500)
      expect(notifySpy).not.toHaveBeenCalled()

            // Check that value is correct and notification hasn't happened
      expect(observable()).toEqual('original')
      expect(notifySpy).not.toHaveBeenCalled()

            // Changing observable to a new value still works as expected
      observable('new')
      jasmine.Clock.tick(500)
      expect(notifySpy).toHaveBeenCalledWith('new')
      expect(beforeChangeSpy).toHaveBeenCalledWith('original')
      expect(beforeChangeSpy).not.toHaveBeenCalledWith('new')
    })

    it('Should support notifications from nested update', function () {
      var observable = koObservable('a').extend({rateLimit: 500})
      var notifySpy = jasmine.createSpy('notifySpy')
      observable.subscribe(notifySpy)

            // Create a one-time subscription that will modify the observable
      var updateSub = observable.subscribe(function () {
        updateSub.dispose()
        observable('z')
      })

      observable('b')
      expect(notifySpy).not.toHaveBeenCalled()
      expect(observable()).toEqual('b')

      notifySpy.reset()
      jasmine.Clock.tick(500)
      expect(notifySpy).toHaveBeenCalledWith('b')
      expect(observable()).toEqual('z')

      notifySpy.reset()
      jasmine.Clock.tick(500)
      expect(notifySpy).toHaveBeenCalledWith('z')
    })

    it('Should suppress notifications when value is changed/reverted from nested update', function () {
      var observable = koObservable('a').extend({rateLimit: 500})
      var notifySpy = jasmine.createSpy('notifySpy')
      observable.subscribe(notifySpy)

            // Create a one-time subscription that will modify the observable and then revert the change
      var updateSub = observable.subscribe(function (newValue) {
        updateSub.dispose()
        observable('z')
        observable(newValue)
      })

      observable('b')
      expect(notifySpy).not.toHaveBeenCalled()
      expect(observable()).toEqual('b')

      notifySpy.reset()
      jasmine.Clock.tick(500)
      expect(notifySpy).toHaveBeenCalledWith('b')
      expect(observable()).toEqual('b')

      notifySpy.reset()
      jasmine.Clock.tick(500)
      expect(notifySpy).not.toHaveBeenCalled()
    })

    it('Should not notify future subscribers', function () {
      var observable = koObservable('a').extend({rateLimit: 500}),
        notifySpy1 = jasmine.createSpy('notifySpy1'),
        notifySpy2 = jasmine.createSpy('notifySpy2'),
        notifySpy3 = jasmine.createSpy('notifySpy3')

      observable.subscribe(notifySpy1)
      observable('b')
      observable.subscribe(notifySpy2)
      observable('c')
      observable.subscribe(notifySpy3)

      expect(notifySpy1).not.toHaveBeenCalled()
      expect(notifySpy2).not.toHaveBeenCalled()
      expect(notifySpy3).not.toHaveBeenCalled()

      jasmine.Clock.tick(500)
      expect(notifySpy1).toHaveBeenCalledWith('c')
      expect(notifySpy2).toHaveBeenCalledWith('c')
      expect(notifySpy3).not.toHaveBeenCalled()
    })

    it('Should delay update of dependent computed observable', function () {
      var observable = koObservable().extend({rateLimit: 500})
      var computed = koComputed(observable)

            // Check initial value
      expect(computed()).toBeUndefined()

            // Observable is changed, but computed is not
      observable('a')
      expect(observable()).toEqual('a')
      expect(computed()).toBeUndefined()

            // Second change also
      observable('b')
      expect(computed()).toBeUndefined()

            // Advance clock; Change notification happens now using the latest value notified
      jasmine.Clock.tick(500)
      expect(computed()).toEqual('b')
    })

    it('Should delay update of dependent pure computed observable', function () {
      var observable = koObservable().extend({rateLimit: 500})
      var computed = koPureComputed(observable)

            // Check initial value
      expect(computed()).toBeUndefined()

            // Observable is changed, but computed is not
      observable('a')
      expect(observable()).toEqual('a')
      expect(computed()).toBeUndefined()

            // Second change also
      observable('b')
      expect(computed()).toBeUndefined()

            // Advance clock; Change notification happens now using the latest value notified
      jasmine.Clock.tick(500)
      expect(computed()).toEqual('b')
    })

    it('Should not update dependent computed created after last update', function () {
      var observable = koObservable('a').extend({rateLimit: 500})
      observable('b')

      var evalSpy = jasmine.createSpy('evalSpy')
      var computed = koComputed(function () {
        return evalSpy(observable())
      })
      expect(evalSpy).toHaveBeenCalledWith('b')
      evalSpy.reset()

      jasmine.Clock.tick(500)
      expect(evalSpy).not.toHaveBeenCalled()
    })
  })

  describe('Observable Array change tracking', function () {
    it('Should provide correct changelist when multiple updates are merged into one notification', function () {
      var myArray = koObservableArray(['Alpha', 'Beta']).extend({rateLimit: 1}),
        changelist

      myArray.subscribe(function (changes) {
        changelist = changes
      }, null, 'arrayChange')

      myArray.push('Gamma')
      myArray.push('Delta')
      jasmine.Clock.tick(10)
      expect(changelist).toEqual([
                { status: 'added', value: 'Gamma', index: 2 },
                { status: 'added', value: 'Delta', index: 3 }
      ])

      changelist = undefined
      myArray.shift()
      myArray.shift()
      jasmine.Clock.tick(10)
      expect(changelist).toEqual([
                { status: 'deleted', value: 'Alpha', index: 0 },
                { status: 'deleted', value: 'Beta', index: 1 }
      ])

      changelist = undefined
      myArray.push('Epsilon')
      myArray.pop()
      jasmine.Clock.tick(10)
      expect(changelist).toEqual(undefined)
    })
  })

  describe('Computed Observable', function () {
    it('Should delay running evaluator where there are no subscribers', function () {
      var observable = koObservable()
      var evalSpy = jasmine.createSpy('evalSpy')
      koComputed(function () { evalSpy(observable()); return observable() }).extend({rateLimit: 500})

            // Observable is changed, but evaluation is delayed
      evalSpy.reset()
      observable('a')
      observable('b')
      expect(evalSpy).not.toHaveBeenCalled()

            // Advance clock; Change notification happens now using the latest value notified
      evalSpy.reset()
      jasmine.Clock.tick(500)
      expect(evalSpy).toHaveBeenCalledWith('b')
    })

    it('Should delay change notifications and evaluation', function () {
      var observable = koObservable()
      var evalSpy = jasmine.createSpy('evalSpy')
      var computed = koComputed(function () { evalSpy(observable()); return observable() }).extend({rateLimit: 500})
      var notifySpy = jasmine.createSpy('notifySpy')
      computed.subscribe(notifySpy)
      var beforeChangeSpy = jasmine.createSpy('beforeChangeSpy')
                .andCallFake(function (value) { expect(computed()).toBe(value) })
      computed.subscribe(beforeChangeSpy, null, 'beforeChange')

            // Observable is changed, but notification is delayed
      evalSpy.reset()
      observable('a')
      expect(evalSpy).not.toHaveBeenCalled()
      expect(computed()).toEqual('a')
      expect(evalSpy).toHaveBeenCalledWith('a')      // evaluation happens when computed is accessed
      expect(notifySpy).not.toHaveBeenCalled()       // but notification is still delayed
      expect(beforeChangeSpy).toHaveBeenCalledWith(undefined)    // beforeChange notification happens right away

            // Second change notification is also delayed
      evalSpy.reset()
      observable('b')
      expect(computed.peek()).toEqual('a')           // peek returns previously evaluated value
      expect(evalSpy).not.toHaveBeenCalled()
      expect(notifySpy).not.toHaveBeenCalled()

            // Advance clock; Change notification happens now using the latest value notified
      evalSpy.reset()
      jasmine.Clock.tick(500)
      expect(evalSpy).toHaveBeenCalledWith('b')
      expect(notifySpy).toHaveBeenCalledWith('b')
      expect(beforeChangeSpy.calls.length).toBe(1)   // Only one beforeChange notification
    })

    it('Should run initial evaluation at first subscribe when using deferEvaluation', function () {
            // This behavior means that code using rate-limited computeds doesn't need to care if the
            // computed also has deferEvaluation. For example, the preceding test ('Should delay change
            // notifications and evaluation') will pass just as well if using deferEvaluation.
      var observable = koObservable('a')
      var evalSpy = jasmine.createSpy('evalSpy')
      var computed = koComputed({
        read: function () {
          evalSpy(observable())
          return observable()
        },
        deferEvaluation: true
      }).extend({rateLimit: 500})
      expect(evalSpy).not.toHaveBeenCalled()

      var notifySpy = jasmine.createSpy('notifySpy')
      computed.subscribe(notifySpy)
      expect(evalSpy).toHaveBeenCalledWith('a')
      expect(notifySpy).not.toHaveBeenCalled()
    })

    it('Should run initial evaluation when observable is accessed when using deferEvaluation', function () {
      var observable = koObservable('a')
      var evalSpy = jasmine.createSpy('evalSpy')
      var computed = koComputed({
        read: function () {
          evalSpy(observable())
          return observable()
        },
        deferEvaluation: true
      }).extend({rateLimit: 500})
      expect(evalSpy).not.toHaveBeenCalled()

      expect(computed()).toEqual('a')
      expect(evalSpy).toHaveBeenCalledWith('a')
    })

    it('Should suppress change notifications when value is changed/reverted', function () {
      var observable = koObservable('original')
      var computed = koComputed(function () { return observable() }).extend({rateLimit: 500})
      var notifySpy = jasmine.createSpy('notifySpy')
      computed.subscribe(notifySpy)
      var beforeChangeSpy = jasmine.createSpy('beforeChangeSpy')
      computed.subscribe(beforeChangeSpy, null, 'beforeChange')

      observable('new')                      // change value
      expect(computed()).toEqual('new')      // access computed to make sure it really has the changed value
      observable('original')                 // and then change the value back
      expect(notifySpy).not.toHaveBeenCalled()
      jasmine.Clock.tick(500)
      expect(notifySpy).not.toHaveBeenCalled()

            // Check that value is correct and notification hasn't happened
      expect(computed()).toEqual('original')
      expect(notifySpy).not.toHaveBeenCalled()

            // Changing observable to a new value still works as expected
      observable('new')
      jasmine.Clock.tick(500)
      expect(notifySpy).toHaveBeenCalledWith('new')
      expect(beforeChangeSpy).toHaveBeenCalledWith('original')
      expect(beforeChangeSpy).not.toHaveBeenCalledWith('new')
    })

    it('Should not re-evaluate if computed is disposed before timeout', function () {
      var observable = koObservable('a')
      var evalSpy = jasmine.createSpy('evalSpy')
      var computed = koComputed(function () { evalSpy(observable()); return observable() }).extend({rateLimit: 500})

      expect(computed()).toEqual('a')
      expect(evalSpy.calls.length).toBe(1)
      expect(evalSpy).toHaveBeenCalledWith('a')

      evalSpy.reset()
      observable('b')
      computed.dispose()

      jasmine.Clock.tick(500)
      expect(computed()).toEqual('a')
      expect(evalSpy).not.toHaveBeenCalled()
    })

    it('Should be able to re-evaluate a computed that previously threw an exception', function () {
      var observableSwitch = koObservable(true), observableValue = koObservable(1),
        computed = koComputed(function () {
          if (!observableSwitch()) {
            throw Error('Error during computed evaluation')
          } else {
            return observableValue()
          }
        }).extend({rateLimit: 500})

            // Initially the computed evaluated successfully
      expect(computed()).toEqual(1)

      expect(function () {
                // Update observable to cause computed to throw an exception
        observableSwitch(false)
        computed()
      }).toThrow('Error during computed evaluation')

            // The value of the computed is now undefined, although currently it keeps the previous value
            // This should not try to re-evaluate and thus shouldn't throw an exception
      expect(computed()).toEqual(1)
      expect(computed.getDependencies()).toEqual([observableSwitch])

            // The computed should not be dependent on the second observable
      expect(computed.getDependenciesCount()).toEqual(1)

            // Updating the second observable shouldn't re-evaluate computed
      observableValue(2)
      expect(computed()).toEqual(1)

            // Update the first observable to cause computed to re-evaluate
      observableSwitch(1)
      expect(computed()).toEqual(2)
    })

    it('Should delay update of dependent computed observable', function () {
      var observable = koObservable()
      var rateLimitComputed = koComputed(observable).extend({rateLimit: 500})
      var dependentComputed = koComputed(rateLimitComputed)

            // Check initial value
      expect(dependentComputed()).toBeUndefined()

            // Rate-limited computed is changed, but dependent computed is not
      observable('a')
      expect(rateLimitComputed()).toEqual('a')
      expect(dependentComputed()).toBeUndefined()

            // Second change also
      observable('b')
      expect(dependentComputed()).toBeUndefined()

            // Advance clock; Change notification happens now using the latest value notified
      jasmine.Clock.tick(500)
      expect(dependentComputed()).toEqual('b')
    })

    it('Should delay update of dependent pure computed observable', function () {
      var observable = koObservable()
      var rateLimitComputed = koComputed(observable).extend({rateLimit: 500})
      var dependentComputed = koPureComputed(rateLimitComputed)

            // Check initial value
      expect(dependentComputed()).toBeUndefined()

            // Rate-limited computed is changed, but dependent computed is not
      observable('a')
      expect(rateLimitComputed()).toEqual('a')
      expect(dependentComputed()).toBeUndefined()

            // Second change also
      observable('b')
      expect(dependentComputed()).toBeUndefined()

            // Advance clock; Change notification happens now using the latest value notified
      jasmine.Clock.tick(500)
      expect(dependentComputed()).toEqual('b')
    })

    it('Should not cause loss of updates when an intermediate value is read by a dependent computed observable', function () {
    // From https://github.com/knockout/knockout/issues/1835
      var one = koObservable(false),
        onePointOne = koComputed(one).extend({rateLimit: 100}),
        two = koObservable(false),
        three = koComputed(function () { return onePointOne() || two() }),
        threeNotifications = new Array()

      three.subscribe(function (val) {
        threeNotifications.push(val)
      })

    // The loop shows that the same steps work continuously
      for (var i = 0; i < 3; i++) {
        expect(onePointOne() || two() || three()).toEqual(false)
        threeNotifications = new Array()

        one(true)
        expect(threeNotifications).toEqual([])
        two(true)
        expect(threeNotifications).toEqual([true])
        two(false)
        expect(threeNotifications).toEqual([true])
        one(false)
        expect(threeNotifications).toEqual([true])

        jasmine.Clock.tick(100)
        expect(threeNotifications).toEqual([true, false])
      }
    })
  })
})

describe('Deferred', function () {
  beforeEach(function () {
    useMockForTasks(options)
  })

  afterEach(function () {
    expect(tasks.resetForTesting()).toEqual(0)
    jasmine.Clock.reset()
  })

  describe('Observable', function () {
    it('Should delay notifications', function () {
      var observable = koObservable().extend({deferred: true})
      var notifySpy = jasmine.createSpy('notifySpy')
      observable.subscribe(notifySpy)

      observable('A')
      expect(notifySpy).not.toHaveBeenCalled()

      jasmine.Clock.tick(1)
      expect(notifySpy.argsForCall).toEqual([ ['A'] ])
    })

    it('Should throw if you attempt to turn off deferred', function () {
            // As of commit 6d5d786, the 'deferred' option cannot be deactivated (once activated for
            // a given observable).
      var observable = koObservable()

      observable.extend({deferred: true});
      expect(function () {
        observable.extend(Object.assign({deferred: false}))
      }).toThrow('The \'deferred\' extender only accepts the value \'true\', because it is not supported to turn deferral off once enabled.')
    })

    it('Should notify subscribers about only latest value', function () {
      var observable = koObservable().extend({notify: 'always', deferred: true})  // include notify:'always' to ensure notifications weren't suppressed by some other means
      var notifySpy = jasmine.createSpy('notifySpy')
      observable.subscribe(notifySpy)

      observable('A')
      observable('B')

      jasmine.Clock.tick(1)
      expect(notifySpy.argsForCall).toEqual([ ['B'] ])
    })

    it('Should suppress notification when value is changed/reverted', function () {
      var observable = koObservable('original').extend({deferred: true})
      var notifySpy = jasmine.createSpy('notifySpy')
      observable.subscribe(notifySpy)

      observable('new')
      expect(observable()).toEqual('new')
      observable('original')

      jasmine.Clock.tick(1)
      expect(notifySpy).not.toHaveBeenCalled()
      expect(observable()).toEqual('original')
    })

    it('Should not notify future subscribers', function () {
      var observable = koObservable('a').extend({deferred: true}),
        notifySpy1 = jasmine.createSpy('notifySpy1'),
        notifySpy2 = jasmine.createSpy('notifySpy2'),
        notifySpy3 = jasmine.createSpy('notifySpy3')

      observable.subscribe(notifySpy1)
      observable('b')
      observable.subscribe(notifySpy2)
      observable('c')
      observable.subscribe(notifySpy3)

      expect(notifySpy1).not.toHaveBeenCalled()
      expect(notifySpy2).not.toHaveBeenCalled()
      expect(notifySpy3).not.toHaveBeenCalled()

      jasmine.Clock.tick(1)
      expect(notifySpy1).toHaveBeenCalledWith('c')
      expect(notifySpy2).toHaveBeenCalledWith('c')
      expect(notifySpy3).not.toHaveBeenCalled()
    })

    it('Should not update dependent computed created after last update', function () {
      var observable = koObservable('a').extend({deferred: true})
      observable('b')

      var evalSpy = jasmine.createSpy('evalSpy')
      var computed = koComputed(function () {
        return evalSpy(observable())
      })
      expect(evalSpy).toHaveBeenCalledWith('b')
      evalSpy.reset()

      jasmine.Clock.tick(1)
      expect(evalSpy).not.toHaveBeenCalled()
    })

    it('Is default behavior when "options.deferUpdates" is "true"', function () {
      this.restoreAfter(options, 'deferUpdates')
      options.deferUpdates = true

      var observable = koObservable()
      var notifySpy = jasmine.createSpy('notifySpy')
      observable.subscribe(notifySpy)

      observable('A')
      expect(notifySpy).not.toHaveBeenCalled()

      jasmine.Clock.tick(1)
      expect(notifySpy.argsForCall).toEqual([ ['A'] ])
    })

    it('Should not cause loss of updates when an intermediate value is read by a dependent computed observable', function () {
            // From https://github.com/knockout/knockout/issues/1835
      var one = koObservable(false).extend({rateLimit: 100}),
        two = koObservable(false),
        three = koComputed(function () { return one() || two() }),
        threeNotifications = new Array()

      three.subscribe(function (val) {
        threeNotifications.push(val)
      })

            // The loop shows that the same steps work continuously
      for (var i = 0; i < 3; i++) {
        expect(one() || two() || three()).toEqual(false)
        threeNotifications = new Array()

        one(true)
        expect(threeNotifications).toEqual([])
        two(true)
        expect(threeNotifications).toEqual([true])
        two(false)
        expect(threeNotifications).toEqual([true])
        one(false)
        expect(threeNotifications).toEqual([true])

        jasmine.Clock.tick(100)
        expect(threeNotifications).toEqual([true, false])
      }
    })
  })

  describe('Observable Array change tracking', function () {
    it('Should provide correct changelist when multiple updates are merged into one notification', function () {
      var myArray = koObservableArray(['Alpha', 'Beta']).extend({deferred: true}),
        changelist

      myArray.subscribe(function (changes) {
        changelist = changes
      }, null, 'arrayChange')

      myArray.push('Gamma')
      myArray.push('Delta')
      jasmine.Clock.tick(1)
      expect(changelist).toEqual([
                { status: 'added', value: 'Gamma', index: 2 },
                { status: 'added', value: 'Delta', index: 3 }
      ])

      changelist = undefined
      myArray.shift()
      myArray.shift()
      jasmine.Clock.tick(1)
      expect(changelist).toEqual([
                { status: 'deleted', value: 'Alpha', index: 0 },
                { status: 'deleted', value: 'Beta', index: 1 }
      ])

      changelist = undefined
      myArray.push('Epsilon')
      myArray.pop()
      jasmine.Clock.tick(1)
      expect(changelist).toEqual(undefined)
    })
  })

  describe('Computed Observable', function () {
    it('Should defer notification of changes and minimize evaluation', function () {
      var timesEvaluated = 0,
        data = koObservable('A'),
        computed = koComputed(function () { ++timesEvaluated; return data() }).extend({deferred: true}),
        notifySpy = jasmine.createSpy('notifySpy')

      computed.subscribe(notifySpy)

      expect(computed()).toEqual('A')
      expect(timesEvaluated).toEqual(1)
      jasmine.Clock.tick(1)
      expect(notifySpy).not.toHaveBeenCalled()

      data('B')
      expect(timesEvaluated).toEqual(1)  // not immediately evaluated
      expect(computed()).toEqual('B')
      expect(timesEvaluated).toEqual(2)
      expect(notifySpy).not.toHaveBeenCalled()

      jasmine.Clock.tick(1)
      expect(notifySpy.calls.length).toEqual(1)
      expect(notifySpy.argsForCall).toEqual([ ['B'] ])
    })

    it('Should notify first change of computed with deferEvaluation if value is changed to undefined', function () {
      var data = koObservable('A'),
        computed = koComputed(data, null, {deferEvaluation: true}).extend({deferred: true}),
        notifySpy = jasmine.createSpy('notifySpy')

      computed.subscribe(notifySpy)

      expect(computed()).toEqual('A')

      data(undefined)
      expect(computed()).toEqual(undefined)
      expect(notifySpy).not.toHaveBeenCalled()

      jasmine.Clock.tick(1)
      expect(notifySpy.calls.length).toEqual(1)
      expect(notifySpy.argsForCall).toEqual([ [undefined] ])
    })

    it('Should notify first change to pure computed after awakening if value changed to last notified value', function () {
      var data = koObservable('A'),
        computed = koPureComputed(data).extend({deferred: true}),
        notifySpy = jasmine.createSpy('notifySpy'),
        subscription = computed.subscribe(notifySpy)

      data('B')
      expect(computed()).toEqual('B')
      expect(notifySpy).not.toHaveBeenCalled()
      jasmine.Clock.tick(1)
      expect(notifySpy.argsForCall).toEqual([ ['B'] ])

      subscription.dispose()
      notifySpy.reset()
      data('C')
      expect(computed()).toEqual('C')
      jasmine.Clock.tick(1)
      expect(notifySpy).not.toHaveBeenCalled()

      subscription = computed.subscribe(notifySpy)
      data('B')
      expect(computed()).toEqual('B')
      expect(notifySpy).not.toHaveBeenCalled()
      jasmine.Clock.tick(1)
      expect(notifySpy.argsForCall).toEqual([ ['B'] ])
    })

    it('Should delay update of dependent computed observable', function () {
      var data = koObservable('A'),
        deferredComputed = koComputed(data).extend({deferred: true}),
        dependentComputed = koComputed(deferredComputed)

      expect(dependentComputed()).toEqual('A')

      data('B')
      expect(deferredComputed()).toEqual('B')
      expect(dependentComputed()).toEqual('A')

      data('C')
      expect(dependentComputed()).toEqual('A')

      jasmine.Clock.tick(1)
      expect(dependentComputed()).toEqual('C')
    })

    it('Should delay update of dependent pure computed observable', function () {
      var data = koObservable('A'),
        deferredComputed = koComputed(data).extend({deferred: true}),
        dependentComputed = koPureComputed(deferredComputed)

      expect(dependentComputed()).toEqual('A')

      data('B')
      expect(deferredComputed()).toEqual('B')
      expect(dependentComputed()).toEqual('A')

      data('C')
      expect(dependentComputed()).toEqual('A')

      jasmine.Clock.tick(1)
      expect(dependentComputed()).toEqual('C')
    })

    it('Should *not* delay update of dependent deferred pure computed observable', function () {
      var data = koObservable('A').extend({deferred: true}),
        timesEvaluated = 0,
        computed1 = koPureComputed(function () { return data() + 'X' }).extend({deferred: true}),
        computed2 = koPureComputed(function () { timesEvaluated++; return computed1() + 'Y' }).extend({deferred: true})

      expect(computed2()).toEqual('AXY')
      expect(timesEvaluated).toEqual(1)

      data('B')
      expect(computed2()).toEqual('BXY')
      expect(timesEvaluated).toEqual(2)

      jasmine.Clock.tick(1)
      expect(computed2()).toEqual('BXY')
      expect(timesEvaluated).toEqual(2)      // Verify that the computed wasn't evaluated again unnecessarily
    })

    it('Should *not* delay update of dependent deferred computed observable', function () {
      var data = koObservable('A').extend({ deferred: true }),
        timesEvaluated = 0,
        computed1 = koComputed(function () { return data() + 'X' }).extend({deferred: true}),
        computed2 = koComputed(function () { timesEvaluated++; return computed1() + 'Y' }).extend({deferred: true}),
        notifySpy = jasmine.createSpy('notifySpy')

      computed2.subscribe(notifySpy)

      expect(computed2()).toEqual('AXY')
      expect(timesEvaluated).toEqual(1)

      data('B')
      expect(computed2()).toEqual('BXY')
      expect(timesEvaluated).toEqual(2)
      expect(notifySpy).not.toHaveBeenCalled()

      jasmine.Clock.tick(1)
      expect(computed2()).toEqual('BXY')
      expect(timesEvaluated).toEqual(2)      // Verify that the computed wasn't evaluated again unnecessarily
      expect(notifySpy.argsForCall).toEqual([ ['BXY'] ])
    })

    it('Should *not* delay update of dependent rate-limited computed observable', function () {
      var data = koObservable('A'),
        deferredComputed = koComputed(data).extend({deferred: true}),
        dependentComputed = koComputed(deferredComputed).extend({rateLimit: 500}),
        notifySpy = jasmine.createSpy('notifySpy')

      dependentComputed.subscribe(notifySpy)

      expect(dependentComputed()).toEqual('A')

      data('B')
      expect(deferredComputed()).toEqual('B')
      expect(dependentComputed()).toEqual('B')

      data('C')
      expect(dependentComputed()).toEqual('C')
      expect(notifySpy).not.toHaveBeenCalled()

      jasmine.Clock.tick(500)
      expect(dependentComputed()).toEqual('C')
      expect(notifySpy.argsForCall).toEqual([ ['C'] ])
    })

    it('Is default behavior when "options.deferUpdates" is "true"', function () {
      this.restoreAfter(options, 'deferUpdates')
      options.deferUpdates = true

      var data = koObservable('A'),
        computed = koComputed(data),
        notifySpy = jasmine.createSpy('notifySpy')

      computed.subscribe(notifySpy)

            // Notification is deferred
      data('B')
      expect(notifySpy).not.toHaveBeenCalled()

      jasmine.Clock.tick(1)
      expect(notifySpy.argsForCall).toEqual([ ['B'] ])
    })

    it('Is superseded by rate-limit', function () {
      this.restoreAfter(options, 'deferUpdates')
      options.deferUpdates = true

      var data = koObservable('A'),
        deferredComputed = koComputed(data),
        dependentComputed = koComputed(function () { return 'R' + deferredComputed() }).extend({rateLimit: 500}),
        notifySpy = jasmine.createSpy('notifySpy')

      deferredComputed.subscribe(notifySpy)
      dependentComputed.subscribe(notifySpy)

      expect(dependentComputed()).toEqual('RA')

      data('B')
      expect(deferredComputed()).toEqual('B')
      expect(dependentComputed()).toEqual('RB')
      expect(notifySpy).not.toHaveBeenCalled()       // no notifications yet

      jasmine.Clock.tick(1)
      expect(notifySpy.argsForCall).toEqual([ ['B'] ])   // only the deferred computed notifies initially

      jasmine.Clock.tick(499)
      expect(notifySpy.argsForCall).toEqual([ ['B'], [ 'RB' ] ]) // the rate-limited computed notifies after the specified timeout
    })

    it('Should minimize evaluation at the end of a complex graph', function () {
      this.restoreAfter(options, 'deferUpdates')
      options.deferUpdates = true

      var a = koObservable('a'),
        b = koPureComputed(function b () {
          return 'b' + a()
        }),
        c = koPureComputed(function c () {
          return 'c' + a()
        }),
        d = koPureComputed(function d () {
          return 'd(' + b() + ',' + c() + ')'
        }),
        e = koPureComputed(function e () {
          return 'e' + a()
        }),
        f = koPureComputed(function f () {
          return 'f' + a()
        }),
        g = koPureComputed(function g () {
          return 'g(' + e() + ',' + f() + ')'
        }),
        h = koPureComputed(function h () {
          return 'h(' + c() + ',' + g() + ',' + d() + ')'
        }),
        i = koPureComputed(function i () {
          return 'i(' + a() + ',' + h() + ',' + b() + ',' + f() + ')'
        }).extend({notify: 'always'}),   // ensure we get a notification for each evaluation
        notifySpy = jasmine.createSpy('callback')

      i.subscribe(notifySpy)

      a('x')
      jasmine.Clock.tick(1)
      expect(notifySpy.argsForCall).toEqual([['i(x,h(cx,g(ex,fx),d(bx,cx)),bx,fx)']])    // only one evaluation and notification
    })

    it('Should minimize evaluation when dependent computed doesn\'t actually change', function () {
            // From https://github.com/knockout/knockout/issues/2174
      this.restoreAfter(options, 'deferUpdates')
      options.deferUpdates = true

      const source = koObservable({ key: 'value' })
      const c1 = koComputed(() => source()['key'])
      let countEval = 0
      const c2 = koComputed(() => ++countEval && c1())

      source({ key: 'value' })
      jasmine.Clock.tick(1)
      expect(countEval).toEqual(1)

      // Reading it again shouldn't cause an update
      expect(c2()).toEqual(c1())
      expect(countEval).toEqual(1)
    })

    it('Should ignore recursive dirty events', function () {
            // From https://github.com/knockout/knockout/issues/1943
      this.restoreAfter(options, 'deferUpdates')
      options.deferUpdates = true

      var a = koObservable(),
        b = koComputed({ read: function () { a(); return d() }, deferEvaluation: true }),
        d = koComputed({ read: function () { a(); return b() }, deferEvaluation: true }),
        bSpy = jasmine.createSpy('bSpy'),
        dSpy = jasmine.createSpy('dSpy')

      b.subscribe(bSpy, null, 'dirty')
      d.subscribe(dSpy, null, 'dirty')

      d()
      expect(bSpy).not.toHaveBeenCalled()
      expect(dSpy).not.toHaveBeenCalled()

      a('something')
      expect(bSpy.calls.length).toBe(2)  // 1 for a, and 1 for d
      expect(dSpy.calls.length).toBe(2)  // 1 for a, and 1 for b

      jasmine.Clock.tick(1)
    })

    it('Should only notify changes if computed was evaluated', function () {
        // See https://github.com/knockout/knockout/issues/2240
        // Set up a scenario where a computed will be marked as dirty but won't get marked as
        // stale and so won't be re-evaluated
      this.restoreAfter(options, 'deferUpdates')
      options.deferUpdates = true

      var obs = koObservable('somevalue'),
        isTruthy = koPureComputed(function () { return !!obs() }),
        objIfTruthy = koPureComputed(function () { return isTruthy() }).extend({ notify: 'always' }),
        notifySpy = jasmine.createSpy('callback'),
        subscription = objIfTruthy.subscribe(notifySpy)

      obs('someothervalue')
      jasmine.Clock.tick(1)
      expect(notifySpy).not.toHaveBeenCalled()

      obs('')
      jasmine.Clock.tick(1)
      expect(notifySpy).toHaveBeenCalled()
      expect(notifySpy.argsForCall).toEqual([[false]])
      notifySpy.reset()

      obs(undefined)
      jasmine.Clock.tick(1)
      expect(notifySpy).not.toHaveBeenCalled()
    })
  })

  describe('ko.when', function () {
    it('Runs callback in a sepearate task when predicate function becomes true, but only once', function () {
      this.restoreAfter(options, 'deferUpdates')
      options.deferUpdates = true

      var x = koObservable(3),
        called = 0

      when(() => x() === 4, () => called++)

      x(5)
      expect(called).toBe(0)
      expect(x.getSubscriptionsCount()).toBe(1)

      x(4)
      expect(called).toBe(0)

      jasmine.Clock.tick(1)
      expect(called).toBe(1)
      expect(x.getSubscriptionsCount()).toBe(0)

      x(3)
      x(4)
      jasmine.Clock.tick(1)
      expect(called).toBe(1)
      expect(x.getSubscriptionsCount()).toBe(0)
    })

    it('Runs callback in a sepearate task if predicate function is already true', function () {
      this.restoreAfter(options, 'deferUpdates')
      options.deferUpdates = true

      var x = koObservable(4),
        called = 0

      when(() => x() === 4, () => called++)

      expect(called).toBe(0)
      expect(x.getSubscriptionsCount()).toBe(1)

      jasmine.Clock.tick(1)
      expect(called).toBe(1)
      expect(x.getSubscriptionsCount()).toBe(0)

      x(3)
      x(4)
      jasmine.Clock.tick(1)
      expect(called).toBe(1)
      expect(x.getSubscriptionsCount()).toBe(0)
    })
  })
})
