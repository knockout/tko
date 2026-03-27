//
// TODO/FIXME:
// The following is a combination of observable and comptued behavior.  In
// future the Observable-only parts ought to be moved to tko.observable tests.
//

import { afterEach, beforeEach, describe, expect, it, jest, mock } from 'bun:test'

import { tasks, options } from '@tko/utils'

import {
  observable as koObservable,
  observableArray as koObservableArray,
  subscribable as koSubscribable
} from '@tko/observable'

import { computed as koComputed, pureComputed as koPureComputed, when } from '../dist'

let cleanup: DisposableStack

beforeEach(() => {
  cleanup = new DisposableStack()
  jest.useFakeTimers()
})

afterEach(() => {
  cleanup.dispose()
  jest.clearAllMocks()
  jest.clearAllTimers()
  jest.useRealTimers()
})

function restoreAfter<T extends object, K extends keyof T>(object: T, propertyName: K) {
  const originalValue = object[propertyName]
  cleanup.defer(() => {
    object[propertyName] = originalValue
  })
}

function useFakeTaskScheduler() {
  restoreAfter(options, 'taskScheduler')
  options.taskScheduler = callback => setTimeout(callback, 0)
}


describe('Throttled observables', function () {

  it('Should notify subscribers asynchronously after writes stop for the specified timeout duration', function () {
    const observable = koObservable('A').extend({ throttle: 100 })
    const notifiedValues: string[] = []
    observable.subscribe(function (value) {
      notifiedValues.push(value)
    })

    observable('B')
    observable('C')
    observable('D')
    expect(notifiedValues.length).toEqual(0)

    jest.advanceTimersByTime(10)
    observable('E')
    observable('F')
    expect(notifiedValues.length).toEqual(0)

    jest.advanceTimersByTime(300)
    expect(notifiedValues.length).toEqual(1)
    expect(notifiedValues[0]).toEqual('F')
  })
})

describe('Throttled dependent observables', function () {

  it('Should notify subscribers asynchronously after dependencies stop updating for the specified timeout duration', function () {
    const underlying = koObservable()
    const asyncDepObs = koComputed(function () {
      return underlying()
    }).extend({ throttle: 100 })
    const notifiedValues: Array<string | undefined> = []
    asyncDepObs.subscribe(function (value) {
      notifiedValues.push(value)
    })

    expect(asyncDepObs()).toBeUndefined()
    underlying('New value')
    expect(asyncDepObs()).toBeUndefined()
    expect(notifiedValues.length).toEqual(0)

    jest.advanceTimersByTime(10)
    expect(asyncDepObs()).toBeUndefined()
    expect(notifiedValues.length).toEqual(0)

    jest.advanceTimersByTime(300)
    expect(asyncDepObs()).toEqual('New value')
    expect(notifiedValues.length).toEqual(1)
    expect(notifiedValues[0]).toEqual('New value')
  })

  it('Should run evaluator only once when dependencies stop updating for the specified timeout duration', function () {
    let evaluationCount = 0
    const someDependency = koObservable()
    const asyncDepObs = koComputed(function () {
      evaluationCount++
      return someDependency()
    }).extend({ throttle: 100 })

    expect(evaluationCount).toEqual(1)
    someDependency('A')
    someDependency('B')
    someDependency('C')
    expect(evaluationCount).toEqual(1)

    jest.advanceTimersByTime(10)
    someDependency('D')
    expect(evaluationCount).toEqual(1)

    jest.advanceTimersByTime(300)
    expect(evaluationCount).toEqual(2)
    expect(asyncDepObs()).toEqual('D')
  })
})

describe('Rate-limited', function () {

  describe('Subscribable', function () {
    it('Should delay change notifications', function () {
      const subscribable = new koSubscribable().extend({ rateLimit: 500 })
      const notifySpy = mock(() => {})
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
      notifySpy.mockClear()
      jest.advanceTimersByTime(500)
      expect(notifySpy).toHaveBeenCalledWith('b')
    })

    it('Should notify every timeout interval using notifyAtFixedRate method ', function () {
      const subscribable = new koSubscribable().extend({ rateLimit: { method: 'notifyAtFixedRate', timeout: 50 } })
      const notifySpy = mock(() => {})
      subscribable.subscribe(notifySpy)

      // Push 10 changes every 25 ms
      for (let i = 0; i < 10; ++i) {
        subscribable.notifySubscribers(i + 1)
        jest.advanceTimersByTime(25)
      }

      // Notification happens every 50 ms, so every other number is notified
      expect(notifySpy.mock.calls.length).toBe(5)
      expect(notifySpy.mock.calls).toEqual([[2], [4], [6], [8], [10]])

      // No more notifications happen
      notifySpy.mockClear()
      jest.advanceTimersByTime(50)
      expect(notifySpy).not.toHaveBeenCalled()
    })

    it('Should notify after nothing happens for the timeout period using notifyWhenChangesStop method', function () {
      const subscribable = new koSubscribable().extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 50 } })
      const notifySpy = mock(() => {})
      subscribable.subscribe(notifySpy)

      // Push 10 changes every 25 ms
      for (let i = 0; i < 10; ++i) {
        subscribable.notifySubscribers(i + 1)
        jest.advanceTimersByTime(25)
      }

      // No notifications happen yet
      expect(notifySpy).not.toHaveBeenCalled()

      // Notification happens after the timeout period
      jest.advanceTimersByTime(50)
      expect(notifySpy.mock.calls.length).toBe(1)
      expect(notifySpy).toHaveBeenCalledWith(10)
    })

    it('Should use latest settings when applied multiple times', function () {
      const subscribable = new koSubscribable().extend({ rateLimit: 250 }).extend({ rateLimit: 500 })
      const notifySpy = mock(() => {})
      subscribable.subscribe(notifySpy)

      subscribable.notifySubscribers('a')

      jest.advanceTimersByTime(250)
      expect(notifySpy).not.toHaveBeenCalled()

      jest.advanceTimersByTime(250)
      expect(notifySpy).toHaveBeenCalledWith('a')
    })

    it('Uses latest settings for future notification and previous settings for pending notification', function () {
      // This test describes the current behavior for the given scenario but is not a contract for that
      // behavior, which could change in the future if convenient.
      let subscribable = new koSubscribable().extend({ rateLimit: 250 })
      const notifySpy = mock(() => {})
      subscribable.subscribe(notifySpy)

      subscribable.notifySubscribers('a') // Pending notification

      // Apply new setting and schedule new notification
      subscribable = subscribable.extend({ rateLimit: 500 })
      subscribable.notifySubscribers('b')

      // First notification happens using original settings
      jest.advanceTimersByTime(250)
      expect(notifySpy).toHaveBeenCalledWith('a')

      // Second notification happends using later settings
      notifySpy.mockClear()
      jest.advanceTimersByTime(250)
      expect(notifySpy).toHaveBeenCalledWith('b')
    })
  })

  describe('Observable', function () {
    it('Should delay change notifications', function () {
      const observable = koObservable().extend({ rateLimit: 500 })
      const notifySpy = mock(() => {})
      observable.subscribe(notifySpy)
      const beforeChangeSpy = mock(function (value) {
        expect(observable()).toBe(value)
      })
      observable.subscribe(beforeChangeSpy, null, 'beforeChange')

      // Observable is changed, but notification is delayed
      observable('a')
      expect(observable()).toEqual('a')
      expect(notifySpy).not.toHaveBeenCalled()
      expect(beforeChangeSpy).toHaveBeenCalledWith(undefined) // beforeChange notification happens right away

      // Second change notification is also delayed
      observable('b')
      expect(notifySpy).not.toHaveBeenCalled()

      // Advance clock; Change notification happens now using the latest value notified
      jest.advanceTimersByTime(500)
      expect(notifySpy).toHaveBeenCalledWith('b')
      expect(beforeChangeSpy.mock.calls.length).toBe(1) // Only one beforeChange notification
    })

    it('Should notify "spectator" subscribers whenever the value changes', function () {
      const observable = koObservable('A').extend({ rateLimit: 500 }),
        spectateSpy = mock(() => {}),
        notifySpy = mock(() => {})

      observable.subscribe(spectateSpy, null, 'spectate')
      observable.subscribe(notifySpy)

      expect(spectateSpy).not.toHaveBeenCalled()
      expect(notifySpy).not.toHaveBeenCalled()

      observable('B')
      expect(spectateSpy).toHaveBeenCalledWith('B')
      observable('C')
      expect(spectateSpy).toHaveBeenCalledWith('C')

      expect(notifySpy).not.toHaveBeenCalled()
      jest.advanceTimersByTime(500)

      // "spectate" was called for each new value
      expect(spectateSpy.mock.calls).toEqual([['B'], ['C']])
      // whereas "change" was only called for the final value
      expect(notifySpy.mock.calls).toEqual([['C']])
    })

    it('Should suppress change notification when value is changed/reverted', function () {
      const observable = koObservable('original').extend({ rateLimit: 500 })
      const notifySpy = mock(() => {})
      observable.subscribe(notifySpy)
      const beforeChangeSpy = mock(() => {})
      observable.subscribe(beforeChangeSpy, null, 'beforeChange')

      observable('new') // change value
      expect(observable()).toEqual('new') // access observable to make sure it really has the changed value
      observable('original') // but then change it back
      expect(notifySpy).not.toHaveBeenCalled()
      jest.advanceTimersByTime(500)
      expect(notifySpy).not.toHaveBeenCalled()

      // Check that value is correct and notification hasn't happened
      expect(observable()).toEqual('original')
      expect(notifySpy).not.toHaveBeenCalled()

      // Changing observable to a new value still works as expected
      observable('new')
      jest.advanceTimersByTime(500)
      expect(notifySpy).toHaveBeenCalledWith('new')
      expect(beforeChangeSpy).toHaveBeenCalledWith('original')
      expect(beforeChangeSpy).not.toHaveBeenCalledWith('new')
    })

    it('Should support notifications from nested update', function () {
      const observable = koObservable('a').extend({ rateLimit: 500 })
      const notifySpy = mock(() => {})
      observable.subscribe(notifySpy)

      // Create a one-time subscription that will modify the observable
      const updateSub = observable.subscribe(function () {
        updateSub.dispose()
        observable('z')
      })

      observable('b')
      expect(notifySpy).not.toHaveBeenCalled()
      expect(observable()).toEqual('b')

      notifySpy.mockClear()
      jest.advanceTimersByTime(500)
      expect(notifySpy).toHaveBeenCalledWith('b')
      expect(observable()).toEqual('z')

      notifySpy.mockClear()
      jest.advanceTimersByTime(500)
      expect(notifySpy).toHaveBeenCalledWith('z')
    })

    it('Should suppress notifications when value is changed/reverted from nested update', function () {
      const observable = koObservable('a').extend({ rateLimit: 500 })
      const notifySpy = mock(() => {})
      observable.subscribe(notifySpy)

      // Create a one-time subscription that will modify the observable and then revert the change
      const updateSub = observable.subscribe(function (newValue) {
        updateSub.dispose()
        observable('z')
        observable(newValue)
      })

      observable('b')
      expect(notifySpy).not.toHaveBeenCalled()
      expect(observable()).toEqual('b')

      notifySpy.mockClear()
      jest.advanceTimersByTime(500)
      expect(notifySpy).toHaveBeenCalledWith('b')
      expect(observable()).toEqual('b')

      notifySpy.mockClear()
      jest.advanceTimersByTime(500)
      expect(notifySpy).not.toHaveBeenCalled()
    })

    it('Should not notify future subscribers', function () {
      const observable = koObservable('a').extend({ rateLimit: 500 }),
        notifySpy1 = mock(() => {}),
        notifySpy2 = mock(() => {}),
        notifySpy3 = mock(() => {})

      observable.subscribe(notifySpy1)
      observable('b')
      observable.subscribe(notifySpy2)
      observable('c')
      observable.subscribe(notifySpy3)

      expect(notifySpy1).not.toHaveBeenCalled()
      expect(notifySpy2).not.toHaveBeenCalled()
      expect(notifySpy3).not.toHaveBeenCalled()

      jest.advanceTimersByTime(500)
      expect(notifySpy1).toHaveBeenCalledWith('c')
      expect(notifySpy2).toHaveBeenCalledWith('c')
      expect(notifySpy3).not.toHaveBeenCalled()
    })

    it('Should delay update of dependent computed observable', function () {
      const observable = koObservable().extend({ rateLimit: 500 })
      const computed = koComputed(observable)

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
      jest.advanceTimersByTime(500)
      expect(computed()).toEqual('b')
    })

    it('Should delay update of dependent pure computed observable', function () {
      const observable = koObservable().extend({ rateLimit: 500 })
      const computed = koPureComputed(observable)

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
      jest.advanceTimersByTime(500)
      expect(computed()).toEqual('b')
    })

    it('Should not update dependent computed created after last update', function () {
      const observable = koObservable('a').extend({ rateLimit: 500 })
      observable('b')

      const evalSpy = mock(() => {})
      const computed = koComputed(function () {
        return evalSpy(observable())
      })
      expect(evalSpy).toHaveBeenCalledWith('b')
      evalSpy.mockClear()

      jest.advanceTimersByTime(500)
      expect(evalSpy).not.toHaveBeenCalled()
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
      jest.advanceTimersByTime(10)
      expect(changelist).toEqual([
        { status: 'added', value: 'Gamma', index: 2 },
        { status: 'added', value: 'Delta', index: 3 }
      ])

      changelist = undefined
      myArray.shift()
      myArray.shift()
      jest.advanceTimersByTime(10)
      expect(changelist).toEqual([
        { status: 'deleted', value: 'Alpha', index: 0 },
        { status: 'deleted', value: 'Beta', index: 1 }
      ])

      changelist = undefined
      myArray.push('Epsilon')
      myArray.pop()
      jest.advanceTimersByTime(10)
      expect(changelist).toEqual(undefined)
    })
  })

  describe('Computed Observable', function () {
    it('Should delay running evaluator where there are no subscribers', function () {
      const observable = koObservable()
      const evalSpy = mock(() => {})
      koComputed(function () {
        evalSpy(observable())
        return observable()
      }).extend({ rateLimit: 500 })

      // Observable is changed, but evaluation is delayed
      evalSpy.mockClear()
      observable('a')
      observable('b')
      expect(evalSpy).not.toHaveBeenCalled()

      // Advance clock; Change notification happens now using the latest value notified
      evalSpy.mockClear()
      jest.advanceTimersByTime(500)
      expect(evalSpy).toHaveBeenCalledWith('b')
    })

    it('Should delay change notifications and evaluation', function () {
      const observable = koObservable()
      const evalSpy = mock(() => {})
      const computed = koComputed(function () {
        evalSpy(observable())
        return observable()
      }).extend({ rateLimit: 500 })
      const notifySpy = mock(() => {})
      computed.subscribe(notifySpy)
      const beforeChangeSpy = mock(function (value) {
        expect(computed()).toBe(value)
      })
      computed.subscribe(beforeChangeSpy, null, 'beforeChange')

      // Observable is changed, but notification is delayed
      evalSpy.mockClear()
      observable('a')
      expect(evalSpy).not.toHaveBeenCalled()
      expect(computed()).toEqual('a')
      expect(evalSpy).toHaveBeenCalledWith('a') // evaluation happens when computed is accessed
      expect(notifySpy).not.toHaveBeenCalled() // but notification is still delayed
      expect(beforeChangeSpy).toHaveBeenCalledWith(undefined) // beforeChange notification happens right away

      // Second change notification is also delayed
      evalSpy.mockClear()
      observable('b')
      expect(computed.peek()).toEqual('a') // peek returns previously evaluated value
      expect(evalSpy).not.toHaveBeenCalled()
      expect(notifySpy).not.toHaveBeenCalled()

      // Advance clock; Change notification happens now using the latest value notified
      evalSpy.mockClear()
      jest.advanceTimersByTime(500)
      expect(evalSpy).toHaveBeenCalledWith('b')
      expect(notifySpy).toHaveBeenCalledWith('b')
      expect(beforeChangeSpy.mock.calls.length).toBe(1) // Only one beforeChange notification
    })

    it('Should run initial evaluation at first subscribe when using deferEvaluation', function () {
      // This behavior means that code using rate-limited computeds doesn't need to care if the
      // computed also has deferEvaluation. For example, the preceding test ('Should delay change
      // notifications and evaluation') will pass just as well if using deferEvaluation.
      const observable = koObservable('a')
      const evalSpy = mock(() => {})
      const computed = koComputed({
        read: function () {
          evalSpy(observable())
          return observable()
        },
        deferEvaluation: true
      }).extend({ rateLimit: 500 })
      expect(evalSpy).not.toHaveBeenCalled()

      const notifySpy = mock(() => {})
      computed.subscribe(notifySpy)
      expect(evalSpy).toHaveBeenCalledWith('a')
      expect(notifySpy).not.toHaveBeenCalled()
    })

    it('Should run initial evaluation when observable is accessed when using deferEvaluation', function () {
      const observable = koObservable('a')
      const evalSpy = mock(() => {})
      const computed = koComputed({
        read: function () {
          evalSpy(observable())
          return observable()
        },
        deferEvaluation: true
      }).extend({ rateLimit: 500 })
      expect(evalSpy).not.toHaveBeenCalled()

      expect(computed()).toEqual('a')
      expect(evalSpy).toHaveBeenCalledWith('a')
    })

    it('Should suppress change notifications when value is changed/reverted', function () {
      const observable = koObservable('original')
      const computed = koComputed(function () {
        return observable()
      }).extend({ rateLimit: 500 })
      const notifySpy = mock(() => {})
      computed.subscribe(notifySpy)
      const beforeChangeSpy = mock(() => {})
      computed.subscribe(beforeChangeSpy, null, 'beforeChange')

      observable('new') // change value
      expect(computed()).toEqual('new') // access computed to make sure it really has the changed value
      observable('original') // and then change the value back
      expect(notifySpy).not.toHaveBeenCalled()
      jest.advanceTimersByTime(500)
      expect(notifySpy).not.toHaveBeenCalled()

      // Check that value is correct and notification hasn't happened
      expect(computed()).toEqual('original')
      expect(notifySpy).not.toHaveBeenCalled()

      // Changing observable to a new value still works as expected
      observable('new')
      jest.advanceTimersByTime(500)
      expect(notifySpy).toHaveBeenCalledWith('new')
      expect(beforeChangeSpy).toHaveBeenCalledWith('original')
      expect(beforeChangeSpy).not.toHaveBeenCalledWith('new')
    })

    it('Should not re-evaluate if computed is disposed before timeout', function () {
      const observable = koObservable('a')
      const evalSpy = mock(() => {})
      const computed = koComputed(function () {
        evalSpy(observable())
        return observable()
      }).extend({ rateLimit: 500 })

      expect(computed()).toEqual('a')
      expect(evalSpy.mock.calls.length).toBe(1)
      expect(evalSpy).toHaveBeenCalledWith('a')

      evalSpy.mockClear()
      observable('b')
      computed.dispose()

      jest.advanceTimersByTime(500)
      expect(computed()).toEqual('a')
      expect(evalSpy).not.toHaveBeenCalled()
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
      const observable = koObservable()
      const rateLimitComputed = koComputed(observable).extend({ rateLimit: 500 })
      const dependentComputed = koComputed(rateLimitComputed)

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
      jest.advanceTimersByTime(500)
      expect(dependentComputed()).toEqual('b')
    })

    it('Should delay update of dependent pure computed observable', function () {
      const observable = koObservable()
      const rateLimitComputed = koComputed(observable).extend({ rateLimit: 500 })
      const dependentComputed = koPureComputed(rateLimitComputed)

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
      jest.advanceTimersByTime(500)
      expect(dependentComputed()).toEqual('b')
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

        jest.advanceTimersByTime(100)
        expect(threeNotifications).toEqual([true, false])
      }
    })
  })
})

describe('Deferred', function () {
  beforeEach(function () {
    useFakeTaskScheduler()
  })

  afterEach(function () {
    expect(tasks.resetForTesting()).toEqual(0)
  })

  describe('Observable', function () {
    it('Should delay notifications', function () {
      const observable = koObservable().extend({ deferred: true })
      const notifySpy = mock(() => {})
      observable.subscribe(notifySpy)

      observable('A')
      expect(notifySpy).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1)
      expect(notifySpy.mock.calls).toEqual([['A']])
    })

    it('Should throw if you attempt to turn off deferred', function () {
      // As of commit 6d5d786, the 'deferred' option cannot be deactivated (once activated for
      // a given observable).
      const observable = koObservable()

      observable.extend({ deferred: true })
      expect(function () {
        observable.extend({ deferred: false })
      }).toThrow(
        "The 'deferred' extender only accepts the value 'true', because it is not supported to turn deferral off once enabled."
      )
    })

    it('Should notify subscribers about only latest value', function () {
      const observable = koObservable().extend({ notify: 'always', deferred: true }) // include notify:'always' to ensure notifications weren't suppressed by some other means
      const notifySpy = mock(() => {})
      observable.subscribe(notifySpy)

      observable('A')
      observable('B')

      jest.advanceTimersByTime(1)
      expect(notifySpy.mock.calls).toEqual([['B']])
    })

    it('Should suppress notification when value is changed/reverted', function () {
      const observable = koObservable('original').extend({ deferred: true })
      const notifySpy = mock(() => {})
      observable.subscribe(notifySpy)

      observable('new')
      expect(observable()).toEqual('new')
      observable('original')

      jest.advanceTimersByTime(1)
      expect(notifySpy).not.toHaveBeenCalled()
      expect(observable()).toEqual('original')
    })

    it('Should not notify future subscribers', function () {
      const observable = koObservable('a').extend({ deferred: true }),
        notifySpy1 = mock(() => {}),
        notifySpy2 = mock(() => {}),
        notifySpy3 = mock(() => {})

      observable.subscribe(notifySpy1)
      observable('b')
      observable.subscribe(notifySpy2)
      observable('c')
      observable.subscribe(notifySpy3)

      expect(notifySpy1).not.toHaveBeenCalled()
      expect(notifySpy2).not.toHaveBeenCalled()
      expect(notifySpy3).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1)
      expect(notifySpy1).toHaveBeenCalledWith('c')
      expect(notifySpy2).toHaveBeenCalledWith('c')
      expect(notifySpy3).not.toHaveBeenCalled()
    })

    it('Should not update dependent computed created after last update', function () {
      const observable = koObservable('a').extend({ deferred: true })
      observable('b')

      const evalSpy = mock(() => {})
      const computed = koComputed(function () {
        return evalSpy(observable())
      })
      expect(evalSpy).toHaveBeenCalledWith('b')
      evalSpy.mockClear()

      jest.advanceTimersByTime(1)
      expect(evalSpy).not.toHaveBeenCalled()
    })

    it('Is default behavior when "options.deferUpdates" is "true"', function () {
      restoreAfter(options, 'deferUpdates')
      options.deferUpdates = true

      const observable = koObservable()
      const notifySpy = mock(() => {})
      observable.subscribe(notifySpy)

      observable('A')
      expect(notifySpy).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1)
      expect(notifySpy.mock.calls).toEqual([['A']])
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

        jest.advanceTimersByTime(100)
        expect(threeNotifications).toEqual([true, false])
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
      jest.advanceTimersByTime(1)
      expect(changelist).toEqual([
        { status: 'added', value: 'Gamma', index: 2 },
        { status: 'added', value: 'Delta', index: 3 }
      ])

      changelist = undefined
      myArray.shift()
      myArray.shift()
      jest.advanceTimersByTime(1)
      expect(changelist).toEqual([
        { status: 'deleted', value: 'Alpha', index: 0 },
        { status: 'deleted', value: 'Beta', index: 1 }
      ])

      changelist = undefined
      myArray.push('Epsilon')
      myArray.pop()
      jest.advanceTimersByTime(1)
      expect(changelist).toEqual(undefined)
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
        notifySpy = mock(() => {})

      computed.subscribe(notifySpy)

      expect(computed()).toEqual('A')
      expect(timesEvaluated).toEqual(1)
      jest.advanceTimersByTime(1)
      expect(notifySpy).not.toHaveBeenCalled()

      data('B')
      expect(timesEvaluated).toEqual(1) // not immediately evaluated
      expect(computed()).toEqual('B')
      expect(timesEvaluated).toEqual(2)
      expect(notifySpy).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1)
      expect(notifySpy.mock.calls.length).toEqual(1)
      expect(notifySpy.mock.calls).toEqual([['B']])
    })

    it('Should notify first change of computed with deferEvaluation if value is changed to undefined', function () {
      const data = koObservable('A'),
        computed = koComputed(data, null, { deferEvaluation: true }).extend({ deferred: true }),
        notifySpy = mock(() => {})

      computed.subscribe(notifySpy)

      expect(computed()).toEqual('A')

      data(undefined)
      expect(computed()).toEqual(undefined)
      expect(notifySpy).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1)
      expect(notifySpy.mock.calls.length).toEqual(1)
      expect(notifySpy.mock.calls).toEqual([[undefined]])
    })

    it('Should notify first change to pure computed after awakening if value changed to last notified value', function () {
      let data = koObservable('A'),
        computed = koPureComputed(data).extend({ deferred: true }),
        notifySpy = mock(() => {}),
        subscription = computed.subscribe(notifySpy)

      data('B')
      expect(computed()).toEqual('B')
      expect(notifySpy).not.toHaveBeenCalled()
      jest.advanceTimersByTime(1)
      expect(notifySpy.mock.calls).toEqual([['B']])

      subscription.dispose()
      notifySpy.mockClear()
      data('C')
      expect(computed()).toEqual('C')
      jest.advanceTimersByTime(1)
      expect(notifySpy).not.toHaveBeenCalled()

      subscription = computed.subscribe(notifySpy)
      data('B')
      expect(computed()).toEqual('B')
      expect(notifySpy).not.toHaveBeenCalled()
      jest.advanceTimersByTime(1)
      expect(notifySpy.mock.calls).toEqual([['B']])
    })

    it('Should delay update of dependent computed observable', function () {
      const data = koObservable('A'),
        deferredComputed = koComputed(data).extend({ deferred: true }),
        dependentComputed = koComputed(deferredComputed)

      expect(dependentComputed()).toEqual('A')

      data('B')
      expect(deferredComputed()).toEqual('B')
      expect(dependentComputed()).toEqual('A')

      data('C')
      expect(dependentComputed()).toEqual('A')

      jest.advanceTimersByTime(1)
      expect(dependentComputed()).toEqual('C')
    })

    it('Should delay update of dependent pure computed observable', function () {
      const data = koObservable('A'),
        deferredComputed = koComputed(data).extend({ deferred: true }),
        dependentComputed = koPureComputed(deferredComputed)

      expect(dependentComputed()).toEqual('A')

      data('B')
      expect(deferredComputed()).toEqual('B')
      expect(dependentComputed()).toEqual('A')

      data('C')
      expect(dependentComputed()).toEqual('A')

      jest.advanceTimersByTime(1)
      expect(dependentComputed()).toEqual('C')
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

      expect(computed2()).toEqual('AXY')
      expect(timesEvaluated).toEqual(1)

      data('B')
      expect(computed2()).toEqual('BXY')
      expect(timesEvaluated).toEqual(2)

      jest.advanceTimersByTime(1)
      expect(computed2()).toEqual('BXY')
      expect(timesEvaluated).toEqual(2) // Verify that the computed wasn't evaluated again unnecessarily
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
        notifySpy = mock(() => {})

      computed2.subscribe(notifySpy)

      expect(computed2()).toEqual('AXY')
      expect(timesEvaluated).toEqual(1)

      data('B')
      expect(computed2()).toEqual('BXY')
      expect(timesEvaluated).toEqual(2)
      expect(notifySpy).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1)
      expect(computed2()).toEqual('BXY')
      expect(timesEvaluated).toEqual(2) // Verify that the computed wasn't evaluated again unnecessarily
      expect(notifySpy.mock.calls).toEqual([['BXY']])
    })

    it('Should *not* delay update of dependent rate-limited computed observable', function () {
      const data = koObservable('A'),
        deferredComputed = koComputed(data).extend({ deferred: true }),
        dependentComputed = koComputed(deferredComputed).extend({ rateLimit: 500 }),
        notifySpy = mock(() => {})

      dependentComputed.subscribe(notifySpy)

      expect(dependentComputed()).toEqual('A')

      data('B')
      expect(deferredComputed()).toEqual('B')
      expect(dependentComputed()).toEqual('B')

      data('C')
      expect(dependentComputed()).toEqual('C')
      expect(notifySpy).not.toHaveBeenCalled()

      jest.advanceTimersByTime(500)
      expect(dependentComputed()).toEqual('C')
      expect(notifySpy.mock.calls).toEqual([['C']])
    })

    it('Is default behavior when "options.deferUpdates" is "true"', function () {
      restoreAfter(options, 'deferUpdates')
      options.deferUpdates = true

      const data = koObservable('A'),
        computed = koComputed(data),
        notifySpy = mock(() => {})

      computed.subscribe(notifySpy)

      // Notification is deferred
      data('B')
      expect(notifySpy).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1)
      expect(notifySpy.mock.calls).toEqual([['B']])
    })

    it('Is superseded by rate-limit', function () {
      restoreAfter(options, 'deferUpdates')
      options.deferUpdates = true

      const data = koObservable('A'),
        deferredComputed = koComputed(data),
        dependentComputed = koComputed(function () {
          return 'R' + deferredComputed()
        }).extend({ rateLimit: 500 }),
        notifySpy = mock(() => {})

      deferredComputed.subscribe(notifySpy)
      dependentComputed.subscribe(notifySpy)

      expect(dependentComputed()).toEqual('RA')

      data('B')
      expect(deferredComputed()).toEqual('B')
      expect(dependentComputed()).toEqual('RB')
      expect(notifySpy).not.toHaveBeenCalled() // no notifications yet

      jest.advanceTimersByTime(1)
      expect(notifySpy.mock.calls).toEqual([['B']]) // only the deferred computed notifies initially

      jest.advanceTimersByTime(499)
      expect(notifySpy.mock.calls).toEqual([['B'], ['RB']]) // the rate-limited computed notifies after the specified timeout
    })

    it('Should minimize evaluation at the end of a complex graph', function () {
      restoreAfter(options, 'deferUpdates')
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
        notifySpy = mock(() => {})

      i.subscribe(notifySpy)

      a('x')
      jest.advanceTimersByTime(1)
      expect(notifySpy.mock.calls).toEqual([['i(x,h(cx,g(ex,fx),d(bx,cx)),bx,fx)']]) // only one evaluation and notification
    })

    it("Should minimize evaluation when dependent computed doesn't actually change", function () {
      // From https://github.com/knockout/knockout/issues/2174
      restoreAfter(options, 'deferUpdates')
      options.deferUpdates = true

      const source = koObservable({ key: 'value' })
      const c1 = koComputed(() => source()['key'])
      let countEval = 0
      const c2 = koComputed(() => ++countEval && c1())

      source({ key: 'value' })
      jest.advanceTimersByTime(1)
      expect(countEval).toEqual(1)

      // Reading it again shouldn't cause an update
      expect(c2()).toEqual(c1())
      expect(countEval).toEqual(1)
    })

    it('Should ignore recursive dirty events', function () {
      // From https://github.com/knockout/knockout/issues/1943
      restoreAfter(options, 'deferUpdates')
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
        bSpy = mock(() => {}),
        dSpy = mock(() => {})

      b.subscribe(bSpy, null, 'dirty')
      d.subscribe(dSpy, null, 'dirty')

      d()
      expect(bSpy).not.toHaveBeenCalled()
      expect(dSpy).not.toHaveBeenCalled()

      a('something')
      expect(bSpy.mock.calls.length).toBe(2) // 1 for a, and 1 for d
      expect(dSpy.mock.calls.length).toBe(2) // 1 for a, and 1 for b

      jest.advanceTimersByTime(1)
    })

    it('Should only notify changes if computed was evaluated', function () {
      // See https://github.com/knockout/knockout/issues/2240
      // Set up a scenario where a computed will be marked as dirty but won't get marked as
      // stale and so won't be re-evaluated
      restoreAfter(options, 'deferUpdates')
      options.deferUpdates = true

      const obs = koObservable('somevalue'),
        isTruthy = koPureComputed(function () {
          return !!obs()
        }),
        objIfTruthy = koPureComputed(function () {
          return isTruthy()
        }).extend({ notify: 'always' }),
        notifySpy = mock(() => {}),
        subscription = objIfTruthy.subscribe(notifySpy)

      obs('someothervalue')
      jest.advanceTimersByTime(1)
      expect(notifySpy).not.toHaveBeenCalled()

      obs('')
      jest.advanceTimersByTime(1)
      expect(notifySpy).toHaveBeenCalled()
      expect(notifySpy.mock.calls).toEqual([[false]])
      notifySpy.mockClear()

      obs(undefined)
      jest.advanceTimersByTime(1)
      expect(notifySpy).not.toHaveBeenCalled()
    })
  })

  describe('ko.when', function () {
    it('Runs callback in a sepearate task when predicate function becomes true, but only once', function () {
      restoreAfter(options, 'deferUpdates')
      options.deferUpdates = true

      let x = koObservable(3),
        called = 0

      when(
        () => x() === 4,
        () => called++
      )

      x(5)
      expect(called).toBe(0)
      expect(x.getSubscriptionsCount()).toBe(1)

      x(4)
      expect(called).toBe(0)

      jest.advanceTimersByTime(1)
      expect(called).toBe(1)
      expect(x.getSubscriptionsCount()).toBe(0)

      x(3)
      x(4)
      jest.advanceTimersByTime(1)
      expect(called).toBe(1)
      expect(x.getSubscriptionsCount()).toBe(0)
    })

    it('Runs callback in a sepearate task if predicate function is already true', function () {
      restoreAfter(options, 'deferUpdates')
      options.deferUpdates = true

      let x = koObservable(4),
        called = 0

      when(
        () => x() === 4,
        () => called++
      )

      expect(called).toBe(0)
      expect(x.getSubscriptionsCount()).toBe(1)

      jest.advanceTimersByTime(1)
      expect(called).toBe(1)
      expect(x.getSubscriptionsCount()).toBe(0)

      x(3)
      x(4)
      jest.advanceTimersByTime(1)
      expect(called).toBe(1)
      expect(x.getSubscriptionsCount()).toBe(0)
    })
  })
})
