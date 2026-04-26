import { expect } from 'chai'

import { isSubscribable, subscribable } from '../dist'

const browserSupportsProtoAssignment = typeof Object.setPrototypeOf === 'function'

describe('Subscribable', function () {
  it('Should declare that it is subscribable', function () {
    const instance = new subscribable()
    expect(isSubscribable(instance)).to.equal(true)
  })

  it('subscribable has limit', function () {
    const instance = new subscribable()
    expect(instance.limit).to.not.equal(undefined)
  })

  it('isSubscribable should return false for undefined', function () {
    expect(isSubscribable(undefined)).to.equal(false)
  })

  it('isSubscribable should return false for null', function () {
    expect(isSubscribable(null)).to.equal(false)
  })

  it('creates/has a Symbol.observable', () => {
    const sub = new subscribable()
    expect(Symbol.observable).to.equal(Symbol.for('@tko/Symbol.observable'))
    expect(sub[Symbol.observable]()).to.equal(sub)
  })

  it('Should be able to notify subscribers', function () {
    const instance = new subscribable()
    let notifiedValue
    instance.subscribe(function (value) {
      notifiedValue = value
    })
    instance.notifySubscribers(123)
    expect(notifiedValue).to.equal(123)
  })

  it('Should be able to unsubscribe', function () {
    const instance = new subscribable()
    let notifiedValue
    const subscription = instance.subscribe(function (value) {
      notifiedValue = value
    })
    subscription.dispose()
    instance.notifySubscribers(123)
    expect(notifiedValue).to.equal(undefined)
  })

  it("Should be able to specify a 'this' pointer for the callback", function () {
    const model = {
      someProperty: 123,
      myCallback: function (arg) {
        expect(arg).to.equal('notifiedValue')
        expect(this.someProperty).to.equal(123)
      }
    }
    const instance = new subscribable()
    instance.subscribe(model.myCallback, model)
    instance.notifySubscribers('notifiedValue')
  })

  it('Should not notify subscribers after unsubscription, even if the unsubscription occurs midway through a notification cycle', function () {
    const instance = new subscribable()
    instance.subscribe(function () {
      subscription2.dispose()
    })
    let subscription2wasNotified = false
    const subscription2 = instance.subscribe(function () {
      subscription2wasNotified = true
    })

    instance.notifySubscribers('ignored')
    expect(subscription2wasNotified).to.equal(false)
  })

  it("Should be able to notify subscribers for a specific 'event'", function () {
    const instance = new subscribable()
    let notifiedValue
    instance.subscribe(
      function (value) {
        notifiedValue = value
      },
      null,
      'myEvent'
    )

    instance.notifySubscribers(123, 'unrelatedEvent')
    expect(notifiedValue).to.equal(undefined)

    instance.notifySubscribers(456, 'myEvent')
    expect(notifiedValue).to.equal(456)
  })

  it("Should be able to unsubscribe for a specific 'event'", function () {
    const instance = new subscribable()
    let notifiedValue
    const subscription = instance.subscribe(
      function (value) {
        notifiedValue = value
      },
      null,
      'myEvent'
    )
    subscription.dispose()
    instance.notifySubscribers(123, 'myEvent')
    expect(notifiedValue).to.equal(undefined)
  })

  it("Should be able to subscribe for a specific 'event' without being notified for the default event", function () {
    const instance = new subscribable()
    let notifiedValue
    instance.subscribe(
      function (value) {
        notifiedValue = value
      },
      null,
      'myEvent'
    )
    instance.notifySubscribers(123)
    expect(notifiedValue).to.equal(undefined)
  })

  it('Should be able to retrieve the number of active subscribers', function () {
    const instance = new subscribable()
    const sub1 = instance.subscribe(function () {})
    const sub2 = instance.subscribe(function () {}, null, 'someSpecificEvent')

    expect(instance.getSubscriptionsCount()).to.equal(2)
    expect(instance.getSubscriptionsCount('change')).to.equal(1)
    expect(instance.getSubscriptionsCount('someSpecificEvent')).to.equal(1)
    expect(instance.getSubscriptionsCount('nonexistentEvent')).to.equal(0)

    sub1.dispose()
    expect(instance.getSubscriptionsCount()).to.equal(1)
    expect(instance.getSubscriptionsCount('change')).to.equal(0)
    expect(instance.getSubscriptionsCount('someSpecificEvent')).to.equal(1)

    sub2.dispose()
    expect(instance.getSubscriptionsCount()).to.equal(0)
    expect(instance.getSubscriptionsCount('change')).to.equal(0)
    expect(instance.getSubscriptionsCount('someSpecificEvent')).to.equal(0)
  })

  it('Should be possible to replace notifySubscribers with a custom handler', function () {
    const instance = new subscribable()
    const interceptedNotifications = new Array()
    instance.subscribe(function () {
      throw new Error('Should not notify subscribers by default once notifySubscribers is overridden')
    })
    instance.notifySubscribers = function (newValue, eventName) {
      interceptedNotifications.push({ eventName: eventName, value: newValue })
    }
    instance.notifySubscribers(123, 'myEvent')

    expect(interceptedNotifications.length).to.equal(1)
    expect(interceptedNotifications[0].eventName).to.equal('myEvent')
    expect(interceptedNotifications[0].value).to.equal(123)
  })

  it('Should inherit any properties defined on subscribable.fn', function () {
    subscribable.fn.customProp = 'some value'
    subscribable.fn.customFunc = function () {
      return this
    }

    try {
      const instance = new subscribable()
      expect(instance.customProp).to.equal('some value')
      expect(instance.customFunc()).to.equal(instance)
    } finally {
      delete subscribable.fn.customProp
      delete subscribable.fn.customFunc
    }
  })

  it('Should have access to functions added to "fn" on existing instances on supported browsers', function () {
    if (!browserSupportsProtoAssignment) {
      return
    }

    const sub = new subscribable()
    const customFunction = function () {}

    try {
      subscribable.fn.customFunction = customFunction
      expect(sub.customFunction).to.equal(customFunction)
    } finally {
      delete subscribable.fn.customFunction
    }
  })

  it('the `once` callback is called one time', () => {
    const s = new subscribable()
    let nv = null
    s.once(v => {
      expect(nv).to.equal(null)
      nv = v
    })
    expect(nv).to.equal(null)
    s.notifySubscribers('123')
    expect(nv).to.equal('123')
    s.notifySubscribers('55')
    expect(nv).to.equal('123')
  })

  it('Should return "[object Object]" with .toString', function () {
    expect(new subscribable().toString()).to.equal('[object Object]')
  })

  it('subscribes with TC39 Observable {next: () =>}', function () {
    const instance = new subscribable()
    let notifiedValue
    instance.subscribe({
      next(value) {
        notifiedValue = value
      }
    })
    instance.notifySubscribers(123)
    expect(notifiedValue).to.equal(123)
  })
})
