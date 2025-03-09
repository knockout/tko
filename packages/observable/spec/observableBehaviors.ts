
import {
  arrayForEach
} from '@tko/utils'

import {
    observable, isSubscribable, isObservable,
    isWriteableObservable, isWritableObservable, subscribable,
    unwrap
} from '../dist'

describe('Observable', function () {
  it('Should be subscribable', function () {
    var instance = observable()
    expect(isSubscribable(instance)).toEqual(true)
  })

  it('observable has limit', function () {
    var instance = observable()
    expect(instance.limit).not.toBeUndefined()
  })

  it('should have an `undefined` length', function () {
    expect(observable().length).toEqual(undefined)
  })

  it('Should advertise that instances are observable', function () {
    var instance = observable()
    expect(isObservable(instance)).toEqual(true)
  })

  it('Should not advertise that ko.observable is observable', function () {
    expect(isObservable(observable)).toEqual(false)
  })

  it('ko.isObservable should return false for non-observable values', function () {
    arrayForEach([
      undefined,
      null,
      'x',
             {},
      function () {},
      new subscribable()
    ], function (value) {
      expect(isObservable(value)).toEqual(false)
    })
  })

  it('ko.isObservable should throw exception for value that has fake observable pointer', function () {
    var x = observable()
    x.__ko_proto__ = {}
    expect(() => isObservable(x)).toThrow()
  })

  it('Should be able to write values to it', function () {
    var instance = observable()
    instance(123)
  })

  it('Should be able to write to multiple observable properties on a model object using chaining syntax', function () {
    var model = {
      prop1: observable(),
      prop2: observable()
    }
    model.prop1('A').prop2('B')

    expect(model.prop1()).toEqual('A')
    expect(model.prop2()).toEqual('B')
  })

  it('Should be able to use Function.prototype methods to access/update', function () {
    var instance = observable('A')
    var obj = {}

    expect(instance.call(null)).toEqual('A')
    expect(instance.call(obj, 'B')).toBe(obj)
    expect(instance.apply(null, [])).toBe('B')
  })

  it('Should advertise that instances can have values written to them', function () {
    var instance = observable(function () { })
    expect(isWriteableObservable(instance)).toEqual(true)
    expect(isWritableObservable(instance)).toEqual(true)
  })

  it('Should be able to read back most recent value', function () {
    var instance = observable()
    instance(123)
    instance(234)
    expect(instance()).toEqual(234)
  })

  it('Should initially have undefined value', function () {
    var instance = observable()
    expect(instance()).toEqual(undefined)
  })

  it('Should be able to set initial value as constructor param', function () {
    var instance = observable('Hi!')
    expect(instance()).toEqual('Hi!')
  })

  it('Should notify subscribers about each new value', function () {
    var instance = observable()
    var notifiedValues = new Array()
    instance.subscribe(function (value) {
      notifiedValues.push(value)
    })

    instance('A')
    instance('B')

    expect(notifiedValues).toEqual([ 'A', 'B' ])
  })

  it('Should notify "spectator" subscribers about each new value', function () {
    var instance = observable()
    var notifiedValues = new Array()
    instance.subscribe(function (value) {
      notifiedValues.push(value)
    }, null, 'spectate')

    instance('A')
    instance('B')
    expect(notifiedValues).toEqual([ 'A', 'B' ])
  })

  it('Should be able to tell it that its value has mutated, at which point it notifies subscribers', function () {
    var instance = observable()
    var notifiedValues = new Array()
    instance.subscribe(function (value) {
      notifiedValues.push(value.childProperty)
    })

    var someUnderlyingObject = { childProperty: 'A' }
    instance(someUnderlyingObject)
    expect(notifiedValues.length).toEqual(1)
    expect(notifiedValues[0]).toEqual('A')

    someUnderlyingObject.childProperty = 'B'
    instance.valueHasMutated()
    expect(notifiedValues.length).toEqual(2)
    expect(notifiedValues[1]).toEqual('B')
  })

  it('Should notify "beforeChange" subscribers before each new value', function () {
    var instance = observable()
    var notifiedValues = new Array()
    instance.subscribe(function (value) {
      notifiedValues.push(value)
    }, null, 'beforeChange')

    instance('A')
    instance('B')

    expect(notifiedValues.length).toEqual(2)
    expect(notifiedValues[0]).toEqual(undefined)
    expect(notifiedValues[1]).toEqual('A')
  })

  it('Should be able to tell it that its value will mutate, at which point it notifies "beforeChange" subscribers', function () {
    var instance = observable()
    var notifiedValues = new Array()
    instance.subscribe(function (value) {
      notifiedValues.push(value ? value.childProperty : value)
    }, null, 'beforeChange')

    var someUnderlyingObject = { childProperty: 'A' }
    instance(someUnderlyingObject)
    expect(notifiedValues.length).toEqual(1)
    expect(notifiedValues[0]).toEqual(undefined)

    instance.valueWillMutate()
    expect(notifiedValues.length).toEqual(2)
    expect(notifiedValues[1]).toEqual('A')

    someUnderlyingObject.childProperty = 'B'
    instance.valueHasMutated()
    expect(notifiedValues.length).toEqual(2)
    expect(notifiedValues[1]).toEqual('A')
  })

  it('Should ignore writes when the new value is primitive and strictly equals the old value', function () {
    var instance = observable()
    var notifiedValues = new Array()
    instance.subscribe(notifiedValues.push, notifiedValues)

    for (var i = 0; i < 3; i++) {
      instance('A')
      expect(instance()).toEqual('A')
      expect(notifiedValues).toEqual(['A'])
    }

    instance('B')
    expect(instance()).toEqual('B')
    expect(notifiedValues).toEqual(['A', 'B'])
  })

  it('Should ignore writes when both the old and new values are strictly null', function () {
    var instance = observable(null)
    var notifiedValues = new Array()
    instance.subscribe(notifiedValues.push, notifiedValues)
    instance(null)
    expect(notifiedValues).toEqual([])
  })

  it('Should ignore writes when both the old and new values are strictly undefined', function () {
    var instance = observable(undefined)
    var notifiedValues = new Array()
    instance.subscribe(notifiedValues.push, notifiedValues)
    instance(undefined)
    expect(notifiedValues).toEqual([])
  })

  it('Should notify subscribers of a change when an object value is written, even if it is identical to the old value', function () {
        // Because we can't tell whether something further down the object graph has changed, we regard
        // all objects as new values. To override this, set an "equalityComparer" callback
    var constantObject = {}
    var instance = observable(constantObject)
    var notifiedValues = new Array()
    instance.subscribe(notifiedValues.push, notifiedValues)
    instance(constantObject)
    expect(notifiedValues).toEqual([constantObject])
  })

  it('Should notify subscribers of a change even when an identical primitive is written if you\'ve set the equality comparer to null', function () {
    var instance = observable('A')
    var notifiedValues = new Array()
    instance.subscribe(notifiedValues.push, notifiedValues)

        // No notification by default
    instance('A')
    expect(notifiedValues).toEqual([])

        // But there is a notification if we null out the equality comparer
    instance.equalityComparer = null
    instance('A')
    expect(notifiedValues).toEqual(['A'])
  })

  it('Should ignore writes when the equalityComparer callback states that the values are equal', function () {
    var instance = observable()
    instance.equalityComparer = function (a, b) {
      return !(a && b) ? a === b : a.id == b.id
    }

    var notifiedValues = new Array()
    instance.subscribe(notifiedValues.push, notifiedValues)

    instance({ id: 1 })
    expect(notifiedValues.length).toEqual(1)

        // Same key - no change
    instance({ id: 1, ignoredProp: 'abc' })
    expect(notifiedValues.length).toEqual(1)

        // Different key - change
    instance({ id: 2, ignoredProp: 'abc' })
    expect(notifiedValues.length).toEqual(2)

        // Null vs not-null - change
    instance(null)
    expect(notifiedValues.length).toEqual(3)

        // Null vs null - no change
    instance(null)
    expect(notifiedValues.length).toEqual(3)

        // Null vs undefined - change
    instance(undefined)
    expect(notifiedValues.length).toEqual(4)

        // undefined vs object - change
    instance({ id: 1 })
    expect(notifiedValues.length).toEqual(5)
  })

  it('Should expose a "notify" extender that can configure the observable to notify on all writes, even if the value is unchanged', function () {
    var instance = observable()
    var notifiedValues = new Array()
    instance.subscribe(notifiedValues.push, notifiedValues)

    instance(123)
    expect(notifiedValues.length).toEqual(1)

        // Typically, unchanged values don't trigger a notification
    instance(123)
    expect(notifiedValues.length).toEqual(1)

        // ... but you can enable notifications regardless of change
    instance.extend({ notify: 'always' })
    instance(123)
    expect(notifiedValues.length).toEqual(2)

        // ... or later disable that
    instance.extend({ notify: null })
    instance(123)
    expect(notifiedValues.length).toEqual(2)
  })

  it('Should be possible to replace notifySubscribers with a custom handler', function () {
    var instance = observable(123)
    var interceptedNotifications = new Array()
    instance.subscribe(function () { throw new Error('Should not notify subscribers by default once notifySubscribers is overridden') })
    instance.notifySubscribers = function (newValue, eventName) {
      interceptedNotifications.push({ eventName: eventName || 'None', value: newValue })
    }
    instance(456)
    // This represents the current set of events that are generated for an observable. This set might
           // expand in the future.
    expect(interceptedNotifications).toEqual([
               { eventName: 'beforeChange', value: 123 },
               { eventName: 'spectate', value: 456 },
               { eventName: 'None', value: 456 }
    ])
  })

  it('Should inherit any properties defined on subscribable.fn or observable.fn', function () {
    this.after(function () {
      delete subscribable.fn.customProp       // Will be able to reach this
      delete subscribable.fn.customFunc       // Overridden on observable.fn
      delete observable.fn.customFunc         // Will be able to reach this
    })

    subscribable.fn.customProp = 'subscribable value'
    subscribable.fn.customFunc = function () { throw new Error('Shouldn\'t be reachable') }
    observable.fn.customFunc = function () { return this() }

    var instance = observable(123)
    expect(instance.customProp).toEqual('subscribable value')
    expect(instance.customFunc()).toEqual(123)
  })

  it('Should have access to functions added to "fn" on existing instances on supported browsers', function () {
        // On unsupported browsers, there's nothing to test
    if (!jasmine.browserSupportsProtoAssignment) {
      return
    }

    this.after(function () {
      delete subscribable.fn.customFunction1
      delete observable.fn.customFunction2
    })

    var myObservable = observable()

    var customFunction1 = function () {}
    var customFunction2 = function () {}

    subscribable.fn.customFunction1 = customFunction1
    myObservable.fn.customFunction2 = customFunction2

    expect(myObservable.customFunction1).toBe(customFunction1)
    expect(myObservable.customFunction2).toBe(customFunction2)
  })

  it('immediately emits any value when called with {next: ...}', function () {
    const instance = observable(1)
    let x
    instance.subscribe({next: v => (x = v)})
    expect(x).toEqual(1)
    observable(2)
    expect(x).toEqual(1)
  })
})


describe('unwrap', function () {
  it('Should return the supplied value for non-observables', function () {
    var someObject = { abc: 123 }

    expect(unwrap(123)).toBe(123)
    expect(unwrap(someObject)).toBe(someObject)
    expect(unwrap(null)).toBe(null)
    expect(unwrap(undefined)).toBe(undefined)
  })
})
