import { expect } from 'chai'

import { arrayForEach } from '@tko/utils'

import {
  observable,
  isSubscribable,
  isObservable,
  isWriteableObservable,
  isWritableObservable,
  subscribable,
  unwrap
} from '../dist'

const browserSupportsProtoAssignment = typeof Object.setPrototypeOf === 'function'

describe('Observable', function () {
  it('Should be subscribable', function () {
    const instance = observable()
    expect(isSubscribable(instance)).to.equal(true)
  })

  it('observable has limit', function () {
    const instance = observable()
    expect(instance.limit).to.not.equal(undefined)
  })

  it('should have an `undefined` length', function () {
    expect(observable().length).to.equal(undefined)
  })

  it('Should advertise that instances are observable', function () {
    const instance = observable()
    expect(isObservable(instance)).to.equal(true)
  })

  it('Should not advertise that ko.observable is observable', function () {
    expect(isObservable(observable)).to.equal(false)
  })

  it('ko.isObservable should return false for non-observable values', function () {
    arrayForEach([undefined, null, 'x', {}, function () {}, new subscribable()], function (value) {
      expect(isObservable(value)).to.equal(false)
    })
  })

  it('ko.isObservable should throw exception for value that has fake observable pointer', function () {
    const x = observable()
    x.__ko_proto__ = {}
    expect(() => isObservable(x)).to.throw()
  })

  it('Should be able to write values to it', function () {
    const instance = observable()
    instance(123)
  })

  it('Should be able to write to multiple observable properties on a model object using chaining syntax', function () {
    const model = { prop1: observable(), prop2: observable() }
    model.prop1('A').prop2('B')

    expect(model.prop1()).to.equal('A')
    expect(model.prop2()).to.equal('B')
  })

  it('Should be able to use Function.prototype methods to access/update', function () {
    const instance = observable('A')
    const obj = {}

    expect(instance.call(null)).to.equal('A')
    expect(instance.call(obj, 'B')).to.equal(obj)
    expect(instance.apply(null, [])).to.equal('B')
  })

  it('Should advertise that instances can have values written to them', function () {
    const instance = observable(function () {})
    expect(isWriteableObservable(instance)).to.equal(true)
    expect(isWritableObservable(instance)).to.equal(true)
  })

  it('Should be able to read back most recent value', function () {
    const instance = observable()
    instance(123)
    instance(234)
    expect(instance()).to.equal(234)
  })

  it('Should initially have undefined value', function () {
    const instance = observable()
    expect(instance()).to.equal(undefined)
  })

  it('Should be able to set initial value as constructor param', function () {
    const instance = observable('Hi!')
    expect(instance()).to.equal('Hi!')
  })

  it('Should notify subscribers about each new value', function () {
    const instance = observable()
    const notifiedValues = new Array()
    instance.subscribe(function (value) {
      notifiedValues.push(value)
    })

    instance('A')
    instance('B')

    expect(notifiedValues).to.deep.equal(['A', 'B'])
  })

  it('Should notify "spectator" subscribers about each new value', function () {
    const instance = observable()
    const notifiedValues = new Array()
    instance.subscribe(
      function (value) {
        notifiedValues.push(value)
      },
      null,
      'spectate'
    )

    instance('A')
    instance('B')
    expect(notifiedValues).to.deep.equal(['A', 'B'])
  })

  it('Should be able to tell it that its value has mutated, at which point it notifies subscribers', function () {
    const instance = observable()
    const notifiedValues = new Array()
    instance.subscribe(function (value) {
      notifiedValues.push(value.childProperty)
    })

    const someUnderlyingObject = { childProperty: 'A' }
    instance(someUnderlyingObject)
    expect(notifiedValues.length).to.equal(1)
    expect(notifiedValues[0]).to.equal('A')

    someUnderlyingObject.childProperty = 'B'
    instance.valueHasMutated()
    expect(notifiedValues.length).to.equal(2)
    expect(notifiedValues[1]).to.equal('B')
  })

  it('Should notify "beforeChange" subscribers before each new value', function () {
    const instance = observable()
    const notifiedValues = new Array()
    instance.subscribe(
      function (value) {
        notifiedValues.push(value)
      },
      null,
      'beforeChange'
    )

    instance('A')
    instance('B')

    expect(notifiedValues.length).to.equal(2)
    expect(notifiedValues[0]).to.equal(undefined)
    expect(notifiedValues[1]).to.equal('A')
  })

  it('Should be able to tell it that its value will mutate, at which point it notifies "beforeChange" subscribers', function () {
    const instance = observable()
    const notifiedValues = new Array()
    instance.subscribe(
      function (value) {
        notifiedValues.push(value ? value.childProperty : value)
      },
      null,
      'beforeChange'
    )

    const someUnderlyingObject = { childProperty: 'A' }
    instance(someUnderlyingObject)
    expect(notifiedValues.length).to.equal(1)
    expect(notifiedValues[0]).to.equal(undefined)

    instance.valueWillMutate()
    expect(notifiedValues.length).to.equal(2)
    expect(notifiedValues[1]).to.equal('A')

    someUnderlyingObject.childProperty = 'B'
    instance.valueHasMutated()
    expect(notifiedValues.length).to.equal(2)
    expect(notifiedValues[1]).to.equal('A')
  })

  it('Should ignore writes when the new value is primitive and strictly equals the old value', function () {
    const instance = observable()
    const notifiedValues = new Array()
    instance.subscribe(notifiedValues.push, notifiedValues)

    for (let i = 0; i < 3; i++) {
      instance('A')
      expect(instance()).to.equal('A')
      expect(notifiedValues).to.deep.equal(['A'])
    }

    instance('B')
    expect(instance()).to.equal('B')
    expect(notifiedValues).to.deep.equal(['A', 'B'])
  })

  it('Should ignore writes when both the old and new values are strictly null', function () {
    const instance = observable(null)
    const notifiedValues = new Array()
    instance.subscribe(notifiedValues.push, notifiedValues)
    instance(null)
    expect(notifiedValues).to.deep.equal([])
  })

  it('Should ignore writes when both the old and new values are strictly undefined', function () {
    const instance = observable(undefined)
    const notifiedValues = new Array()
    instance.subscribe(notifiedValues.push, notifiedValues)
    instance(undefined)
    expect(notifiedValues).to.deep.equal([])
  })

  it('Should notify subscribers of a change when an object value is written, even if it is identical to the old value', function () {
    // Because we can't tell whether something further down the object graph has changed, we regard
    // all objects as new values. To override this, set an "equalityComparer" callback
    const constantObject = {}
    const instance = observable(constantObject)
    const notifiedValues = new Array()
    instance.subscribe(notifiedValues.push, notifiedValues)
    instance(constantObject)
    expect(notifiedValues).to.deep.equal([constantObject])
  })

  it("Should notify subscribers of a change even when an identical primitive is written if you've set the equality comparer to null", function () {
    const instance = observable('A')
    const notifiedValues = new Array()
    instance.subscribe(notifiedValues.push, notifiedValues)

    // No notification by default
    instance('A')
    expect(notifiedValues).to.deep.equal([])

    // But there is a notification if we null out the equality comparer
    instance.equalityComparer = null
    instance('A')
    expect(notifiedValues).to.deep.equal(['A'])
  })

  it('Should ignore writes when the equalityComparer callback states that the values are equal', function () {
    const instance = observable()
    instance.equalityComparer = function (a, b) {
      return !(a && b) ? a === b : a.id == b.id
    }

    const notifiedValues = new Array()
    instance.subscribe(notifiedValues.push, notifiedValues)

    instance({ id: 1 })
    expect(notifiedValues.length).to.equal(1)

    // Same key - no change
    instance({ id: 1, ignoredProp: 'abc' })
    expect(notifiedValues.length).to.equal(1)

    // Different key - change
    instance({ id: 2, ignoredProp: 'abc' })
    expect(notifiedValues.length).to.equal(2)

    // Null vs not-null - change
    instance(null)
    expect(notifiedValues.length).to.equal(3)

    // Null vs null - no change
    instance(null)
    expect(notifiedValues.length).to.equal(3)

    // Null vs undefined - change
    instance(undefined)
    expect(notifiedValues.length).to.equal(4)

    // undefined vs object - change
    instance({ id: 1 })
    expect(notifiedValues.length).to.equal(5)
  })

  it('Should expose a "notify" extender that can configure the observable to notify on all writes, even if the value is unchanged', function () {
    const instance = observable()
    const notifiedValues = new Array()
    instance.subscribe(notifiedValues.push, notifiedValues)

    instance(123)
    expect(notifiedValues.length).to.equal(1)

    // Typically, unchanged values don't trigger a notification
    instance(123)
    expect(notifiedValues.length).to.equal(1)

    // ... but you can enable notifications regardless of change
    instance.extend({ notify: 'always' })
    instance(123)
    expect(notifiedValues.length).to.equal(2)

    // ... or later disable that
    instance.extend({ notify: null })
    instance(123)
    expect(notifiedValues.length).to.equal(2)
  })

  it('Should be possible to replace notifySubscribers with a custom handler', function () {
    const instance = observable(123)
    const interceptedNotifications = new Array()
    instance.subscribe(function () {
      throw new Error('Should not notify subscribers by default once notifySubscribers is overridden')
    })
    instance.notifySubscribers = function (newValue, eventName) {
      interceptedNotifications.push({ eventName: eventName || 'None', value: newValue })
    }
    instance(456)
    // This represents the current set of events that are generated for an observable. This set might
    // expand in the future.
    expect(interceptedNotifications).to.deep.equal([
      { eventName: 'beforeChange', value: 123 },
      { eventName: 'spectate', value: 456 },
      { eventName: 'None', value: 456 }
    ])
  })

  it('Should inherit any properties defined on subscribable.fn or observable.fn', function () {
    subscribable.fn.customProp = 'subscribable value'
    subscribable.fn.customFunc = function () {
      throw new Error("Shouldn't be reachable")
    }
    observable.fn.customFunc = function () {
      return this()
    }

    try {
      const instance = observable(123)
      expect(instance.customProp).to.equal('subscribable value')
      expect(instance.customFunc()).to.equal(123)
    } finally {
      delete subscribable.fn.customProp
      delete subscribable.fn.customFunc
      delete observable.fn.customFunc
    }
  })

  it('Should have access to functions added to "fn" on existing instances on supported browsers', function () {
    if (!browserSupportsProtoAssignment) {
      return
    }

    const myObservable = observable()

    const customFunction1 = function () {}
    const customFunction2 = function () {}

    try {
      subscribable.fn.customFunction1 = customFunction1
      observable.fn.customFunction2 = customFunction2

      expect(myObservable.customFunction1).to.equal(customFunction1)
      expect(myObservable.customFunction2).to.equal(customFunction2)
    } finally {
      delete subscribable.fn.customFunction1
      delete observable.fn.customFunction2
    }
  })

  it('immediately emits any value when called with {next: ...}', function () {
    const instance = observable(1)
    let x
    instance.subscribe({ next: v => (x = v) })
    expect(x).to.equal(1)
    observable(2)
    expect(x).to.equal(1)
  })
})

describe('unwrap', function () {
  it('Should return the supplied value for non-observables', function () {
    const someObject = { abc: 123 }

    expect(unwrap(123)).to.equal(123)
    expect(unwrap(someObject)).to.equal(someObject)
    expect(unwrap(null)).to.equal(null)
    expect(unwrap(undefined)).to.equal(undefined)
  })
})
