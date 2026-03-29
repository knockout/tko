import { expect } from 'chai'
import sinon from 'sinon'

import { tasks, options } from '@tko/utils'

import {
  observable as koObservable,
  observableArray as koObservableArray,
  subscribable as koSubscribable
} from '@tko/observable'

import { computed as koComputed, pureComputed as koPureComputed, when } from '../dist'

import { restoreAfter, useMockForTasks } from '../../utils/helpers/mocha-test-helpers'

describe('Throttled observables', function () {
  let clock: sinon.SinonFakeTimers

  beforeEach(function () {
    clock = sinon.useFakeTimers()
  })

  afterEach(function () {
    clock.restore()
  })

  it('Should notify subscribers asynchronously after writes stop for the specified timeout duration', function () {
    const observable = koObservable('A').extend({ throttle: 100 })
    const notifiedValues = new Array()
    observable.subscribe(function (value) {
      notifiedValues.push(value)
    })

    observable('B')
    observable('C')
    observable('D')
    expect(notifiedValues.length).to.equal(0) // Should not notify synchronously

    clock.tick(10)

    observable('E')
    observable('F')
    expect(notifiedValues.length).to.equal(0) // Should not notify until end of throttle timeout

    clock.tick(300)
    expect(notifiedValues.length).to.equal(1)
    expect(notifiedValues[0]).to.equal('F')
  })
})

describe('Throttled dependent observables', function () {
  let clock: sinon.SinonFakeTimers

  beforeEach(function () {
    clock = sinon.useFakeTimers()
  })

  afterEach(function () {
    clock.restore()
  })

  it('Should notify subscribers asynchronously after dependencies stop updating for the specified timeout duration', function () {
    const underlying = koObservable()
    const asyncDepObs = koComputed(function () {
      return underlying()
    }).extend({ throttle: 100 })
    const notifiedValues = new Array()
    asyncDepObs.subscribe(function (value) {
      notifiedValues.push(value)
    })

    // Check initial state
    expect(asyncDepObs()).to.equal(undefined)

    underlying('New value')
    expect(asyncDepObs()).to.equal(undefined) // Should not update synchronously
    expect(notifiedValues.length).to.equal(0)

    clock.tick(10)
    expect(asyncDepObs()).to.equal(undefined) // Should not update until throttle timeout
    expect(notifiedValues.length).to.equal(0)

    clock.tick(300)
    expect(asyncDepObs()).to.deep.equal('New value')
    expect(notifiedValues.length).to.equal(1)
    expect(notifiedValues[0]).to.deep.equal('New value')
  })

  it('Should run evaluator only once when dependencies stop updating for the specified timeout duration', function () {
    let evaluationCount = 0
    const someDependency = koObservable()
    const asyncDepObs = koComputed(function () {
      evaluationCount++
      return someDependency()
    }).extend({ throttle: 100 })

    // Mutate a few times synchronously
    expect(evaluationCount).to.equal(1) // Evaluates synchronously when first created, like all dependent observables
    someDependency('A')
    someDependency('B')
    someDependency('C')
    expect(evaluationCount).to.equal(1) // Should not re-evaluate synchronously when dependencies update

    // Also mutate async
    clock.tick(10)
    someDependency('D')
    expect(evaluationCount).to.equal(1)

    // Now wait for throttle timeout
    clock.tick(300)
    expect(evaluationCount).to.equal(2) // Finally, it's evaluated
    expect(asyncDepObs()).to.deep.equal('D')
  })
})

describe('Rate-limited', function () {
  let clock: sinon.SinonFakeTimers

  beforeEach(function () {
    clock = sinon.useFakeTimers()
  })

  afterEach(function () {
    clock.restore()
  })

  describe('Subscribable', function () {
    it('Should delay change notifications', function () {
      const subscribable = new koSubscribable().extend({ rateLimit: 500 })
      const notifySpy = sinon.spy()
      subscribable.subscribe(notifySpy)
      subscribable.subscribe(notifySpy, null, 'custom')

      // "change" notification is delayed
      subscribable.notifySubscribers('a', 'change')
      sinon.assert.notCalled(notifySpy)

      // Default notification is delayed
      subscribable.notifySubscribers('b')
      sinon.assert.notCalled(notifySpy)

      // Other notifications happen immediately
      subscribable.notifySubscribers('c', 'custom')
      sinon.assert.calledWith(notifySpy, 'c')

      // Advance clock; Change notification happens now using the latest value notified
      notifySpy.resetHistory()
      clock.tick(500)
      sinon.assert.calledWith(notifySpy, 'b')
    })

    it('Should notify every timeout interval using notifyAtFixedRate method ', function () {
      const subscribable = new koSubscribable().extend({ rateLimit: { method: 'notifyAtFixedRate', timeout: 50 } })
      const notifySpy = sinon.spy()
      subscribable.subscribe(notifySpy)

      // Push 10 changes every 25 ms
      for (let i = 0; i < 10; ++i) {
        subscribable.notifySubscribers(i + 1)
        clock.tick(25)
      }

      // Notification happens every 50 ms, so every other number is notified
      expect(notifySpy.callCount).to.equal(5)
      expect(notifySpy.args).to.deep.equal([[2], [4], [6], [8], [10]])

      // No more notifications happen
      notifySpy.resetHistory()
      clock.tick(50)
      sinon.assert.notCalled(notifySpy)
    })

    it('Should notify after nothing happens for the timeout period using notifyWhenChangesStop method', function () {
      const subscribable = new koSubscribable().extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 50 } })
      const notifySpy = sinon.spy()
      subscribable.subscribe(notifySpy)

      // Push 10 changes every 25 ms
      for (let i = 0; i < 10; ++i) {
        subscribable.notifySubscribers(i + 1)
        clock.tick(25)
      }

      // No notifications happen yet
      sinon.assert.notCalled(notifySpy)

      // Notification happens after the timeout period
      clock.tick(50)
      expect(notifySpy.callCount).to.equal(1)
      sinon.assert.calledWith(notifySpy, 10)
    })

    it('Should use latest settings when applied multiple times', function () {
      const subscribable = new koSubscribable().extend({ rateLimit: 250 }).extend({ rateLimit: 500 })
      const notifySpy = sinon.spy()
      subscribable.subscribe(notifySpy)

      subscribable.notifySubscribers('a')

      clock.tick(250)
      sinon.assert.notCalled(notifySpy)

      clock.tick(250)
      sinon.assert.calledWith(notifySpy, 'a')
    })

    it('Uses latest settings for future notification and previous settings for pending notification', function () {
      // This test describes the current behavior for the given scenario but is not a contract for that
      // behavior, which could change in the future if convenient.
      let subscribable = new koSubscribable().extend({ rateLimit: 250 })
      const notifySpy = sinon.spy()
      subscribable.subscribe(notifySpy)

      subscribable.notifySubscribers('a') // Pending notification

      // Apply new setting and schedule new notification
      subscribable = subscribable.extend({ rateLimit: 500 })
      subscribable.notifySubscribers('b')

      // First notification happens using original settings
      clock.tick(250)
      sinon.assert.calledWith(notifySpy, 'a')

      // Second notification happends using later settings
      notifySpy.resetHistory()
      clock.tick(250)
      sinon.assert.calledWith(notifySpy, 'b')
    })
  })

  describe('Observable', function () {
    it('Should delay change notifications', function () {
      const observable = koObservable().extend({ rateLimit: 500 })
      const notifySpy = sinon.spy()
      observable.subscribe(notifySpy)
      const beforeChangeSpy = sinon.spy(function (value) {
        expect(observable()).to.equal(value)
      })
      observable.subscribe(beforeChangeSpy, null, 'beforeChange')

      // Observable is changed, but notification is delayed
      observable('a')
      expect(observable()).to.deep.equal('a')
      sinon.assert.notCalled(notifySpy)
      sinon.assert.calledWith(beforeChangeSpy, undefined) // beforeChange notification happens right away

      // Second change notification is also delayed
      observable('b')
      sinon.assert.notCalled(notifySpy)

      // Advance clock; Change notification happens now using the latest value notified
      clock.tick(500)
      sinon.assert.calledWith(notifySpy, 'b')
      expect(beforeChangeSpy.callCount).to.equal(1) // Only one beforeChange notification
    })

    it('Should notify "spectator" subscribers whenever the value changes', function () {
      const observable = koObservable('A').extend({ rateLimit: 500 }),
        spectateSpy = sinon.spy(),
        notifySpy = sinon.spy()

      observable.subscribe(spectateSpy, null, 'spectate')
      observable.subscribe(notifySpy)

      sinon.assert.notCalled(spectateSpy)
      sinon.assert.notCalled(notifySpy)

      observable('B')
      sinon.assert.calledWith(spectateSpy, 'B')
      observable('C')
      sinon.assert.calledWith(spectateSpy, 'C')

      sinon.assert.notCalled(notifySpy)
      clock.tick(500)

      // "spectate" was called for each new value
      expect(spectateSpy.args).to.deep.equal([['B'], ['C']])
      // whereas "change" was only called for the final value
      expect(notifySpy.args).to.deep.equal([['C']])
    })

    it('Should suppress change notification when value is changed/reverted', function () {
      const observable = koObservable('original').extend({ rateLimit: 500 })
      const notifySpy = sinon.spy()
      observable.subscribe(notifySpy)
      const beforeChangeSpy = sinon.spy()
      observable.subscribe(beforeChangeSpy, null, 'beforeChange')

      observable('new') // change value
      expect(observable()).to.deep.equal('new') // access observable to make sure it really has the changed value
      observable('original') // but then change it back
      sinon.assert.notCalled(notifySpy)
      clock.tick(500)
      sinon.assert.notCalled(notifySpy)

      // Check that value is correct and notification hasn't happened
      expect(observable()).to.deep.equal('original')
      sinon.assert.notCalled(notifySpy)

      // Changing observable to a new value still works as expected
      observable('new')
      clock.tick(500)
      sinon.assert.calledWith(notifySpy, 'new')
      sinon.assert.calledWith(beforeChangeSpy, 'original')
      sinon.assert.neverCalledWith(beforeChangeSpy, 'new')
    })

    it('Should support notifications from nested update', function () {
      const observable = koObservable('a').extend({ rateLimit: 500 })
      const notifySpy = sinon.spy()
      observable.subscribe(notifySpy)

      // Create a one-time subscription that will modify the observable
      const updateSub = observable.subscribe(function () {
        updateSub.dispose()
        observable('z')
      })

      observable('b')
      sinon.assert.notCalled(notifySpy)
      expect(observable()).to.deep.equal('b')

      notifySpy.resetHistory()
      clock.tick(500)
      sinon.assert.calledWith(notifySpy, 'b')
      expect(observable()).to.deep.equal('z')

      notifySpy.resetHistory()
      clock.tick(500)
      sinon.assert.calledWith(notifySpy, 'z')
    })

    it('Should suppress notifications when value is changed/reverted from nested update', function () {
      const observable = koObservable('a').extend({ rateLimit: 500 })
      const notifySpy = sinon.spy()
      observable.subscribe(notifySpy)

      // Create a one-time subscription that will modify the observable and then revert the change
      const updateSub = observable.subscribe(function (newValue) {
        updateSub.dispose()
        observable('z')
        observable(newValue)
      })

      observable('b')
      sinon.assert.notCalled(notifySpy)
      expect(observable()).to.deep.equal('b')

      notifySpy.resetHistory()
      clock.tick(500)
      sinon.assert.calledWith(notifySpy, 'b')
      expect(observable()).to.deep.equal('b')

      notifySpy.resetHistory()
      clock.tick(500)
      sinon.assert.notCalled(notifySpy)
    })

    it('Should not notify future subscribers', function () {
      const observable = koObservable('a').extend({ rateLimit: 500 }),
        notifySpy1 = sinon.spy(),
        notifySpy2 = sinon.spy(),
        notifySpy3 = sinon.spy()

      observable.subscribe(notifySpy1)
      observable('b')
      observable.subscribe(notifySpy2)
      observable('c')
      observable.subscribe(notifySpy3)

      sinon.assert.notCalled(notifySpy1)
      sinon.assert.notCalled(notifySpy2)
      sinon.assert.notCalled(notifySpy3)

      clock.tick(500)
      sinon.assert.calledWith(notifySpy1, 'c')
      sinon.assert.calledWith(notifySpy2, 'c')
      sinon.assert.notCalled(notifySpy3)
    })

    it('Should delay update of dependent computed observable', function () {
      const observable = koObservable().extend({ rateLimit: 500 })
      const computed = koComputed(observable)

      // Check initial value
      expect(computed()).to.equal(undefined)

      // Observable is changed, but computed is not
      observable('a')
      expect(observable()).to.deep.equal('a')
      expect(computed()).to.equal(undefined)

      // Second change also
      observable('b')
      expect(computed()).to.equal(undefined)

      // Advance clock; Change notification happens now using the latest value notified
      clock.tick(500)
      expect(computed()).to.deep.equal('b')
    })

    it('Should delay update of dependent pure computed observable', function () {
      const observable = koObservable().extend({ rateLimit: 500 })
      const computed = koPureComputed(observable)

      // Check initial value
      expect(computed()).to.equal(undefined)

      // Observable is changed, but computed is not
      observable('a')
      expect(observable()).to.deep.equal('a')
      expect(computed()).to.equal(undefined)

      // Second change also
      observable('b')
      expect(computed()).to.equal(undefined)

      // Advance clock; Change notification happens now using the latest value notified
      clock.tick(500)
      expect(computed()).to.deep.equal('b')
    })

    it('Should not update dependent computed created after last update', function () {
      const observable = koObservable('a').extend({ rateLimit: 500 })
      observable('b')

      const evalSpy = sinon.spy()
      const computed = koComputed(function () {
        return evalSpy(observable())
      })
      sinon.assert.calledWith(evalSpy, 'b')
      evalSpy.resetHistory()

      clock.tick(500)
      sinon.assert.notCalled(evalSpy)
    })
  })

  describe('Observable Array change tracking', function () {
    it('Should provide correct changelist when multiple updates are merged into one notification', function () {
      let myArray = koObservableArray(['Alpha', 'Beta']).extend({ rateLimit: 1 }),
        changelist

      myArray.subscribe(
        function (changes) {
          changelist = changes
        },
        null,
        'arrayChange'
      )

      myArray.push('Gamma')
      myArray.push('Delta')
      clock.tick(10)
      expect(changelist).to.deep.equal([
        { status: 'added', value: 'Gamma', index: 2 },
        { status: 'added', value: 'Delta', index: 3 }
      ])

      changelist = undefined
      myArray.shift()
      myArray.shift()
      clock.tick(10)
      expect(changelist).to.deep.equal([
        { status: 'deleted', value: 'Alpha', index: 0 },
        { status: 'deleted', value: 'Beta', index: 1 }
      ])

      changelist = undefined
      myArray.push('Epsilon')
      myArray.pop()
      clock.tick(10)
      expect(changelist).to.deep.equal(undefined)
    })
  })

  describe('Computed Observable', function () {
    it('Should delay running evaluator where there are no subscribers', function () {
      const observable = koObservable()
      const evalSpy = sinon.spy()
      koComputed(function () {
        evalSpy(observable())
        return observable()
      }).extend({ rateLimit: 500 })

      // Observable is changed, but evaluation is delayed
      evalSpy.resetHistory()
      observable('a')
      observable('b')
      sinon.assert.notCalled(evalSpy)

      // Advance clock; Change notification happens now using the latest value notified
      evalSpy.resetHistory()
      clock.tick(500)
      sinon.assert.calledWith(evalSpy, 'b')
    })

    it('Should delay change notifications and evaluation', function () {
      const observable = koObservable()
      const evalSpy = sinon.spy()
      const computed = koComputed(function () {
        evalSpy(observable())
        return observable()
      }).extend({ rateLimit: 500 })
      const notifySpy = sinon.spy()
      computed.subscribe(notifySpy)
      const beforeChangeSpy = sinon.spy(function (value) {
        expect(computed()).to.equal(value)
      })
      computed.subscribe(beforeChangeSpy, null, 'beforeChange')

      // Observable is changed, but notification is delayed
      evalSpy.resetHistory()
      observable('a')
      sinon.assert.notCalled(evalSpy)
      expect(computed()).to.deep.equal('a')
      sinon.assert.calledWith(evalSpy, 'a') // evaluation happens when computed is accessed
      sinon.assert.notCalled(notifySpy) // but notification is still delayed
      sinon.assert.calledWith(beforeChangeSpy, undefined) // beforeChange notification happens right away

      // Second change notification is also delayed
      evalSpy.resetHistory()
      observable('b')
      expect(computed.peek()).to.deep.equal('a') // peek returns previously evaluated value
      sinon.assert.notCalled(evalSpy)
      sinon.assert.notCalled(notifySpy)

      // Advance clock; Change notification happens now using the latest value notified
      evalSpy.resetHistory()
      clock.tick(500)
      sinon.assert.calledWith(evalSpy, 'b')
      sinon.assert.calledWith(notifySpy, 'b')
      expect(beforeChangeSpy.callCount).to.equal(1) // Only one beforeChange notification
    })

    it('Should run initial evaluation at first subscribe when using deferEvaluation', function () {
      // This behavior means that code using rate-limited computeds doesn't need to care if the
      // computed also has deferEvaluation. For example, the preceding test ('Should delay change
      // notifications and evaluation') will pass just as well if using deferEvaluation.
      const observable = koObservable('a')
      const evalSpy = sinon.spy()
      const computed = koComputed({
        read: function () {
          evalSpy(observable())
          return observable()
        },
        deferEvaluation: true
      }).extend({ rateLimit: 500 })
      sinon.assert.notCalled(evalSpy)

      const notifySpy = sinon.spy()
      computed.subscribe(notifySpy)
      sinon.assert.calledWith(evalSpy, 'a')
      sinon.assert.notCalled(notifySpy)
    })

    it('Should run initial evaluation when observable is accessed when using deferEvaluation', function () {
      const observable = koObservable('a')
      const evalSpy = sinon.spy()
      const computed = koComputed({
        read: function () {
          evalSpy(observable())
          return observable()
        },
        deferEvaluation: true
      }).extend({ rateLimit: 500 })
      sinon.assert.notCalled(evalSpy)

      expect(computed()).to.deep.equal('a')
      sinon.assert.calledWith(evalSpy, 'a')
    })

    it('Should suppress change notifications when value is changed/reverted', function () {
      const observable = koObservable('original')
      const computed = koComputed(function () {
        return observable()
      }).extend({ rateLimit: 500 })
      const notifySpy = sinon.spy()
      computed.subscribe(notifySpy)
      const beforeChangeSpy = sinon.spy()
      computed.subscribe(beforeChangeSpy, null, 'beforeChange')

      observable('new') // change value
      expect(computed()).to.deep.equal('new') // access computed to make sure it really has the changed value
      observable('original') // and then change the value back
      sinon.assert.notCalled(notifySpy)
      clock.tick(500)
      sinon.assert.notCalled(notifySpy)

      // Check that value is correct and notification hasn't happened
      expect(computed()).to.deep.equal('original')
      sinon.assert.notCalled(notifySpy)

      // Changing observable to a new value still works as expected
      observable('new')
      clock.tick(500)
      sinon.assert.calledWith(notifySpy, 'new')
      sinon.assert.calledWith(beforeChangeSpy, 'original')
      sinon.assert.neverCalledWith(beforeChangeSpy, 'new')
    })

    it('Should not re-evaluate if computed is disposed before timeout', function () {
      const observable = koObservable('a')
      const evalSpy = sinon.spy()
      const computed = koComputed(function () {
        evalSpy(observable())
        return observable()
      }).extend({ rateLimit: 500 })

      expect(computed()).to.deep.equal('a')
      expect(evalSpy.callCount).to.equal(1)
      sinon.assert.calledWith(evalSpy, 'a')

      evalSpy.resetHistory()
      observable('b')
      computed.dispose()

      clock.tick(500)
      expect(computed()).to.deep.equal('a')
      sinon.assert.notCalled(evalSpy)
    })

    it('Should be able to re-evaluate a computed that previously threw an exception', function () {
      const observableSwitch = koObservable(true),
        observableValue = koObservable(1),
        computed = koComputed(function () {
          if (!observableSwitch()) {
            throw Error('Error during computed evaluation')
          } else {
            return observableValue()
          }
        }).extend({ rateLimit: 500 })

      // Initially the computed evaluated successfully
      expect(computed()).to.deep.equal(1)

      expect(function () {
        // Update observable to cause computed to throw an exception
        observableSwitch(false)
        computed()
      }).to.throw('Error during computed evaluation')

      // The value of the computed is now undefined, although currently it keeps the previous value
      // This should not try to re-evaluate and thus shouldn't throw an exception
      expect(computed()).to.deep.equal(1)
      expect(computed.getDependencies()).to.deep.equal([observableSwitch])

      // The computed should not be dependent on the second observable
      expect(computed.getDependenciesCount()).to.deep.equal(1)

      // Updating the second observable shouldn't re-evaluate computed
      observableValue(2)
      expect(computed()).to.deep.equal(1)

      // Update the first observable to cause computed to re-evaluate
      observableSwitch(1)
      expect(computed()).to.deep.equal(2)
    })

    it('Should delay update of dependent computed observable', function () {
      const observable = koObservable()
      const rateLimitComputed = koComputed(observable).extend({ rateLimit: 500 })
      const dependentComputed = koComputed(rateLimitComputed)

      // Check initial value
      expect(dependentComputed()).to.equal(undefined)

      // Rate-limited computed is changed, but dependent computed is not
      observable('a')
      expect(rateLimitComputed()).to.deep.equal('a')
      expect(dependentComputed()).to.equal(undefined)

      // Second change also
      observable('b')
      expect(dependentComputed()).to.equal(undefined)

      // Advance clock; Change notification happens now using the latest value notified
      clock.tick(500)
      expect(dependentComputed()).to.deep.equal('b')
    })

    it('Should delay update of dependent pure computed observable', function () {
      const observable = koObservable()
      const rateLimitComputed = koComputed(observable).extend({ rateLimit: 500 })
      const dependentComputed = koPureComputed(rateLimitComputed)

      // Check initial value
      expect(dependentComputed()).to.equal(undefined)

      // Rate-limited computed is changed, but dependent computed is not
      observable('a')
      expect(rateLimitComputed()).to.deep.equal('a')
      expect(dependentComputed()).to.equal(undefined)

      // Second change also
      observable('b')
      expect(dependentComputed()).to.equal(undefined)

      // Advance clock; Change notification happens now using the latest value notified
      clock.tick(500)
      expect(dependentComputed()).to.deep.equal('b')
    })

    it('Should not cause loss of updates when an intermediate value is read by a dependent computed observable', function () {
      // From https://github.com/knockout/knockout/issues/1835
      let one = koObservable(false),
        onePointOne = koComputed(one).extend({ rateLimit: 100 }),
        two = koObservable(false),
        three = koComputed(function () {
          return onePointOne() || two()
        }),
        threeNotifications = new Array()

      three.subscribe(function (val) {
        threeNotifications.push(val)
      })

      // The loop shows that the same steps work continuously
      for (let i = 0; i < 3; i++) {
        expect(onePointOne() || two() || three()).to.deep.equal(false)
        threeNotifications = new Array()

        one(true)
        expect(threeNotifications).to.deep.equal([])
        two(true)
        expect(threeNotifications).to.deep.equal([true])
        two(false)
        expect(threeNotifications).to.deep.equal([true])
        one(false)
        expect(threeNotifications).to.deep.equal([true])

        clock.tick(100)
        expect(threeNotifications).to.deep.equal([true, false])
      }
    })
  })
})

describe('Deferred', function () {
  let cleanups: Array<() => void>
  let clock: sinon.SinonFakeTimers

  beforeEach(function () {
    cleanups = []
    clock = sinon.useFakeTimers()
    useMockForTasks(cleanups)
  })

  afterEach(function () {
    expect(tasks.resetForTesting()).to.equal(0)
    while (cleanups.length) {
      cleanups.pop()?.()
    }
    clock.restore()
  })

  describe('Observable', function () {
    it('Should delay notifications', function () {
      const observable = koObservable().extend({ deferred: true })
      const notifySpy = sinon.spy()
      observable.subscribe(notifySpy)

      observable('A')
      sinon.assert.notCalled(notifySpy)

      clock.tick(1)
      expect(notifySpy.args).to.deep.equal([['A']])
    })

    it('Should throw if you attempt to turn off deferred', function () {
      // As of commit 6d5d786, the 'deferred' option cannot be deactivated (once activated for
      // a given observable).
      const observable = koObservable()

      observable.extend({ deferred: true })
      expect(function () {
        observable.extend({ deferred: false })
      }).to.throw(
        "The 'deferred' extender only accepts the value 'true', because it is not supported to turn deferral off once enabled."
      )
    })

    it('Should notify subscribers about only latest value', function () {
      const observable = koObservable().extend({ notify: 'always', deferred: true }) // include notify:'always' to ensure notifications weren't suppressed by some other means
      const notifySpy = sinon.spy()
      observable.subscribe(notifySpy)

      observable('A')
      observable('B')

      clock.tick(1)
      expect(notifySpy.args).to.deep.equal([['B']])
    })

    it('Should suppress notification when value is changed/reverted', function () {
      const observable = koObservable('original').extend({ deferred: true })
      const notifySpy = sinon.spy()
      observable.subscribe(notifySpy)

      observable('new')
      expect(observable()).to.deep.equal('new')
      observable('original')

      clock.tick(1)
      sinon.assert.notCalled(notifySpy)
      expect(observable()).to.deep.equal('original')
    })

    it('Should not notify future subscribers', function () {
      const observable = koObservable('a').extend({ deferred: true }),
        notifySpy1 = sinon.spy(),
        notifySpy2 = sinon.spy(),
        notifySpy3 = sinon.spy()

      observable.subscribe(notifySpy1)
      observable('b')
      observable.subscribe(notifySpy2)
      observable('c')
      observable.subscribe(notifySpy3)

      sinon.assert.notCalled(notifySpy1)
      sinon.assert.notCalled(notifySpy2)
      sinon.assert.notCalled(notifySpy3)

      clock.tick(1)
      sinon.assert.calledWith(notifySpy1, 'c')
      sinon.assert.calledWith(notifySpy2, 'c')
      sinon.assert.notCalled(notifySpy3)
    })

    it('Should not update dependent computed created after last update', function () {
      const observable = koObservable('a').extend({ deferred: true })
      observable('b')

      const evalSpy = sinon.spy()
      const computed = koComputed(function () {
        return evalSpy(observable())
      })
      sinon.assert.calledWith(evalSpy, 'b')
      evalSpy.resetHistory()

      clock.tick(1)
      sinon.assert.notCalled(evalSpy)
    })

    it('Is default behavior when "options.deferUpdates" is "true"', function () {
      restoreAfter(cleanups, options, 'deferUpdates')
      options.deferUpdates = true

      const observable = koObservable()
      const notifySpy = sinon.spy()
      observable.subscribe(notifySpy)

      observable('A')
      sinon.assert.notCalled(notifySpy)

      clock.tick(1)
      expect(notifySpy.args).to.deep.equal([['A']])
    })

    it('Should not cause loss of updates when an intermediate value is read by a dependent computed observable', function () {
      // From https://github.com/knockout/knockout/issues/1835
      let one = koObservable(false).extend({ rateLimit: 100 }),
        two = koObservable(false),
        three = koComputed(function () {
          return one() || two()
        }),
        threeNotifications = new Array()

      three.subscribe(function (val) {
        threeNotifications.push(val)
      })

      // The loop shows that the same steps work continuously
      for (let i = 0; i < 3; i++) {
        expect(one() || two() || three()).to.deep.equal(false)
        threeNotifications = new Array()

        one(true)
        expect(threeNotifications).to.deep.equal([])
        two(true)
        expect(threeNotifications).to.deep.equal([true])
        two(false)
        expect(threeNotifications).to.deep.equal([true])
        one(false)
        expect(threeNotifications).to.deep.equal([true])

        clock.tick(100)
        expect(threeNotifications).to.deep.equal([true, false])
      }
    })
  })

  describe('Observable Array change tracking', function () {
    it('Should provide correct changelist when multiple updates are merged into one notification', function () {
      let myArray = koObservableArray(['Alpha', 'Beta']).extend({ deferred: true }),
        changelist

      myArray.subscribe(
        function (changes) {
          changelist = changes
        },
        null,
        'arrayChange'
      )

      myArray.push('Gamma')
      myArray.push('Delta')
      clock.tick(1)
      expect(changelist).to.deep.equal([
        { status: 'added', value: 'Gamma', index: 2 },
        { status: 'added', value: 'Delta', index: 3 }
      ])

      changelist = undefined
      myArray.shift()
      myArray.shift()
      clock.tick(1)
      expect(changelist).to.deep.equal([
        { status: 'deleted', value: 'Alpha', index: 0 },
        { status: 'deleted', value: 'Beta', index: 1 }
      ])

      changelist = undefined
      myArray.push('Epsilon')
      myArray.pop()
      clock.tick(1)
      expect(changelist).to.deep.equal(undefined)
    })
  })

  describe('Computed Observable', function () {
    it('Should defer notification of changes and minimize evaluation', function () {
      let timesEvaluated = 0,
        data = koObservable('A'),
        computed = koComputed(function () {
          ++timesEvaluated
          return data()
        }).extend({ deferred: true }),
        notifySpy = sinon.spy()

      computed.subscribe(notifySpy)

      expect(computed()).to.deep.equal('A')
      expect(timesEvaluated).to.deep.equal(1)
      clock.tick(1)
      sinon.assert.notCalled(notifySpy)

      data('B')
      expect(timesEvaluated).to.deep.equal(1) // not immediately evaluated
      expect(computed()).to.deep.equal('B')
      expect(timesEvaluated).to.deep.equal(2)
      sinon.assert.notCalled(notifySpy)

      clock.tick(1)
      expect(notifySpy.callCount).to.deep.equal(1)
      expect(notifySpy.args).to.deep.equal([['B']])
    })

    it('Should notify first change of computed with deferEvaluation if value is changed to undefined', function () {
      const data = koObservable('A'),
        computed = koComputed(data, null, { deferEvaluation: true }).extend({ deferred: true }),
        notifySpy = sinon.spy()

      computed.subscribe(notifySpy)

      expect(computed()).to.deep.equal('A')

      data(undefined)
      expect(computed()).to.deep.equal(undefined)
      sinon.assert.notCalled(notifySpy)

      clock.tick(1)
      expect(notifySpy.callCount).to.deep.equal(1)
      expect(notifySpy.args).to.deep.equal([[undefined]])
    })

    it('Should notify first change to pure computed after awakening if value changed to last notified value', function () {
      let data = koObservable('A'),
        computed = koPureComputed(data).extend({ deferred: true }),
        notifySpy = sinon.spy(),
        subscription = computed.subscribe(notifySpy)

      data('B')
      expect(computed()).to.deep.equal('B')
      sinon.assert.notCalled(notifySpy)
      clock.tick(1)
      expect(notifySpy.args).to.deep.equal([['B']])

      subscription.dispose()
      notifySpy.resetHistory()
      data('C')
      expect(computed()).to.deep.equal('C')
      clock.tick(1)
      sinon.assert.notCalled(notifySpy)

      subscription = computed.subscribe(notifySpy)
      data('B')
      expect(computed()).to.deep.equal('B')
      sinon.assert.notCalled(notifySpy)
      clock.tick(1)
      expect(notifySpy.args).to.deep.equal([['B']])
    })

    it('Should delay update of dependent computed observable', function () {
      const data = koObservable('A'),
        deferredComputed = koComputed(data).extend({ deferred: true }),
        dependentComputed = koComputed(deferredComputed)

      expect(dependentComputed()).to.deep.equal('A')

      data('B')
      expect(deferredComputed()).to.deep.equal('B')
      expect(dependentComputed()).to.deep.equal('A')

      data('C')
      expect(dependentComputed()).to.deep.equal('A')

      clock.tick(1)
      expect(dependentComputed()).to.deep.equal('C')
    })

    it('Should delay update of dependent pure computed observable', function () {
      const data = koObservable('A'),
        deferredComputed = koComputed(data).extend({ deferred: true }),
        dependentComputed = koPureComputed(deferredComputed)

      expect(dependentComputed()).to.deep.equal('A')

      data('B')
      expect(deferredComputed()).to.deep.equal('B')
      expect(dependentComputed()).to.deep.equal('A')

      data('C')
      expect(dependentComputed()).to.deep.equal('A')

      clock.tick(1)
      expect(dependentComputed()).to.deep.equal('C')
    })

    it('Should *not* delay update of dependent deferred pure computed observable', function () {
      let data = koObservable('A').extend({ deferred: true }),
        timesEvaluated = 0,
        computed1 = koPureComputed(function () {
          return data() + 'X'
        }).extend({ deferred: true }),
        computed2 = koPureComputed(function () {
          timesEvaluated++
          return computed1() + 'Y'
        }).extend({ deferred: true })

      expect(computed2()).to.deep.equal('AXY')
      expect(timesEvaluated).to.deep.equal(1)

      data('B')
      expect(computed2()).to.deep.equal('BXY')
      expect(timesEvaluated).to.deep.equal(2)

      clock.tick(1)
      expect(computed2()).to.deep.equal('BXY')
      expect(timesEvaluated).to.deep.equal(2) // Verify that the computed wasn't evaluated again unnecessarily
    })

    it('Should *not* delay update of dependent deferred computed observable', function () {
      let data = koObservable('A').extend({ deferred: true }),
        timesEvaluated = 0,
        computed1 = koComputed(function () {
          return data() + 'X'
        }).extend({ deferred: true }),
        computed2 = koComputed(function () {
          timesEvaluated++
          return computed1() + 'Y'
        }).extend({ deferred: true }),
        notifySpy = sinon.spy()

      computed2.subscribe(notifySpy)

      expect(computed2()).to.deep.equal('AXY')
      expect(timesEvaluated).to.deep.equal(1)

      data('B')
      expect(computed2()).to.deep.equal('BXY')
      expect(timesEvaluated).to.deep.equal(2)
      sinon.assert.notCalled(notifySpy)

      clock.tick(1)
      expect(computed2()).to.deep.equal('BXY')
      expect(timesEvaluated).to.deep.equal(2) // Verify that the computed wasn't evaluated again unnecessarily
      expect(notifySpy.args).to.deep.equal([['BXY']])
    })

    it('Should *not* delay update of dependent rate-limited computed observable', function () {
      const data = koObservable('A'),
        deferredComputed = koComputed(data).extend({ deferred: true }),
        dependentComputed = koComputed(deferredComputed).extend({ rateLimit: 500 }),
        notifySpy = sinon.spy()

      dependentComputed.subscribe(notifySpy)

      expect(dependentComputed()).to.deep.equal('A')

      data('B')
      expect(deferredComputed()).to.deep.equal('B')
      expect(dependentComputed()).to.deep.equal('B')

      data('C')
      expect(dependentComputed()).to.deep.equal('C')
      sinon.assert.notCalled(notifySpy)

      clock.tick(500)
      expect(dependentComputed()).to.deep.equal('C')
      expect(notifySpy.args).to.deep.equal([['C']])
    })

    it('Is default behavior when "options.deferUpdates" is "true"', function () {
      restoreAfter(cleanups, options, 'deferUpdates')
      options.deferUpdates = true

      const data = koObservable('A'),
        computed = koComputed(data),
        notifySpy = sinon.spy()

      computed.subscribe(notifySpy)

      // Notification is deferred
      data('B')
      sinon.assert.notCalled(notifySpy)

      clock.tick(1)
      expect(notifySpy.args).to.deep.equal([['B']])
    })

    it('Is superseded by rate-limit', function () {
      restoreAfter(cleanups, options, 'deferUpdates')
      options.deferUpdates = true

      const data = koObservable('A'),
        deferredComputed = koComputed(data),
        dependentComputed = koComputed(function () {
          return 'R' + deferredComputed()
        }).extend({ rateLimit: 500 }),
        notifySpy = sinon.spy()

      deferredComputed.subscribe(notifySpy)
      dependentComputed.subscribe(notifySpy)

      expect(dependentComputed()).to.deep.equal('RA')

      data('B')
      expect(deferredComputed()).to.deep.equal('B')
      expect(dependentComputed()).to.deep.equal('RB')
      sinon.assert.notCalled(notifySpy) // no notifications yet

      clock.tick(1)
      expect(notifySpy.args).to.deep.equal([['B']]) // only the deferred computed notifies initially

      clock.tick(499)
      expect(notifySpy.args).to.deep.equal([['B'], ['RB']]) // the rate-limited computed notifies after the specified timeout
    })

    it('Should minimize evaluation at the end of a complex graph', function () {
      restoreAfter(cleanups, options, 'deferUpdates')
      options.deferUpdates = true

      const a = koObservable('a'),
        b = koPureComputed(function b() {
          return 'b' + a()
        }),
        c = koPureComputed(function c() {
          return 'c' + a()
        }),
        d = koPureComputed(function d() {
          return 'd(' + b() + ',' + c() + ')'
        }),
        e = koPureComputed(function e() {
          return 'e' + a()
        }),
        f = koPureComputed(function f() {
          return 'f' + a()
        }),
        g = koPureComputed(function g() {
          return 'g(' + e() + ',' + f() + ')'
        }),
        h = koPureComputed(function h() {
          return 'h(' + c() + ',' + g() + ',' + d() + ')'
        }),
        i = koPureComputed(function i() {
          return 'i(' + a() + ',' + h() + ',' + b() + ',' + f() + ')'
        }).extend({ notify: 'always' }), // ensure we get a notification for each evaluation
        notifySpy = sinon.spy()

      i.subscribe(notifySpy)

      a('x')
      clock.tick(1)
      expect(notifySpy.args).to.deep.equal([['i(x,h(cx,g(ex,fx),d(bx,cx)),bx,fx)']]) // only one evaluation and notification
    })

    it("Should minimize evaluation when dependent computed doesn't actually change", function () {
      // From https://github.com/knockout/knockout/issues/2174
      restoreAfter(cleanups, options, 'deferUpdates')
      options.deferUpdates = true

      const source = koObservable({ key: 'value' })
      const c1 = koComputed(() => source()['key'])
      let countEval = 0
      const c2 = koComputed(() => ++countEval && c1())

      source({ key: 'value' })
      clock.tick(1)
      expect(countEval).to.deep.equal(1)

      // Reading it again shouldn't cause an update
      expect(c2()).to.deep.equal(c1())
      expect(countEval).to.deep.equal(1)
    })

    it('Should ignore recursive dirty events', function () {
      // From https://github.com/knockout/knockout/issues/1943
      restoreAfter(cleanups, options, 'deferUpdates')
      options.deferUpdates = true

      const a = koObservable(),
        b = koComputed({
          read: function () {
            a()
            return d()
          },
          deferEvaluation: true
        }),
        d = koComputed({
          read: function () {
            a()
            return b()
          },
          deferEvaluation: true
        }),
        bSpy = sinon.spy(),
        dSpy = sinon.spy()

      b.subscribe(bSpy, null, 'dirty')
      d.subscribe(dSpy, null, 'dirty')

      d()
      sinon.assert.notCalled(bSpy)
      sinon.assert.notCalled(dSpy)

      a('something')
      expect(bSpy.callCount).to.equal(2) // 1 for a, and 1 for d
      expect(dSpy.callCount).to.equal(2) // 1 for a, and 1 for b

      clock.tick(1)
    })

    it('Should only notify changes if computed was evaluated', function () {
      // See https://github.com/knockout/knockout/issues/2240
      // Set up a scenario where a computed will be marked as dirty but won't get marked as
      // stale and so won't be re-evaluated
      restoreAfter(cleanups, options, 'deferUpdates')
      options.deferUpdates = true

      const obs = koObservable('somevalue'),
        isTruthy = koPureComputed(function () {
          return !!obs()
        }),
        objIfTruthy = koPureComputed(function () {
          return isTruthy()
        }).extend({ notify: 'always' }),
        notifySpy = sinon.spy(),
        subscription = objIfTruthy.subscribe(notifySpy)

      obs('someothervalue')
      clock.tick(1)
      sinon.assert.notCalled(notifySpy)

      obs('')
      clock.tick(1)
      sinon.assert.called(notifySpy)
      expect(notifySpy.args).to.deep.equal([[false]])
      notifySpy.resetHistory()

      obs(undefined)
      clock.tick(1)
      sinon.assert.notCalled(notifySpy)
    })
  })

  describe('ko.when', function () {
    it('Runs callback in a sepearate task when predicate function becomes true, but only once', function () {
      restoreAfter(cleanups, options, 'deferUpdates')
      options.deferUpdates = true

      let x = koObservable(3),
        called = 0

      when(
        () => x() === 4,
        () => called++
      )

      x(5)
      expect(called).to.equal(0)
      expect(x.getSubscriptionsCount()).to.equal(1)

      x(4)
      expect(called).to.equal(0)

      clock.tick(1)
      expect(called).to.equal(1)
      expect(x.getSubscriptionsCount()).to.equal(0)

      x(3)
      x(4)
      clock.tick(1)
      expect(called).to.equal(1)
      expect(x.getSubscriptionsCount()).to.equal(0)
    })

    it('Runs callback in a sepearate task if predicate function is already true', function () {
      restoreAfter(cleanups, options, 'deferUpdates')
      options.deferUpdates = true

      let x = koObservable(4),
        called = 0

      when(
        () => x() === 4,
        () => called++
      )

      expect(called).to.equal(0)
      expect(x.getSubscriptionsCount()).to.equal(1)

      clock.tick(1)
      expect(called).to.equal(1)
      expect(x.getSubscriptionsCount()).to.equal(0)

      x(3)
      x(4)
      clock.tick(1)
      expect(called).to.equal(1)
      expect(x.getSubscriptionsCount()).to.equal(0)
    })
  })
})
