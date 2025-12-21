import { isSubscribable, subscribable } from '../dist'

describe('Subscribable', function () {
  it('Should declare that it is subscribable', function () {
    let instance = new subscribable()
    expect(isSubscribable(instance)).toEqual(true)
  })

  it('subscribable has limit', function () {
    let instance = new subscribable()
    expect(instance.limit).not.toBeUndefined()
  })

  it('isSubscribable should return false for undefined', function () {
    expect(isSubscribable(undefined)).toEqual(false)
  })

  it('isSubscribable should return false for null', function () {
    expect(isSubscribable(null)).toEqual(false)
  })

  it('creates/has a Symbol.observable', () => {
    const sub = new subscribable()
    expect(Symbol.observable).toEqual(Symbol.for('@tko/Symbol.observable'))
    expect(sub[Symbol.observable]()).toBe(sub)
  })

  it('Should be able to notify subscribers', function () {
    let instance = new subscribable()
    let notifiedValue
    instance.subscribe(function (value) {
      notifiedValue = value
    })
    instance.notifySubscribers(123)
    expect(notifiedValue).toEqual(123)
  })

  it('Should be able to unsubscribe', function () {
    let instance = new subscribable()
    let notifiedValue
    let subscription = instance.subscribe(function (value) {
      notifiedValue = value
    })
    subscription.dispose()
    instance.notifySubscribers(123)
    expect(notifiedValue).toEqual(undefined)
  })

  it("Should be able to specify a 'this' pointer for the callback", function () {
    let model = {
      someProperty: 123,
      myCallback: function (arg) {
        expect(arg).toEqual('notifiedValue')
        expect(this.someProperty).toEqual(123)
      }
    }
    let instance = new subscribable()
    instance.subscribe(model.myCallback, model)
    instance.notifySubscribers('notifiedValue')
  })

  it('Should not notify subscribers after unsubscription, even if the unsubscription occurs midway through a notification cycle', function () {
    // This spec represents the unusual case where during notification, subscription1's callback causes subscription2 to be disposed.
    // Since subscription2 was still active at the start of the cycle, it is scheduled to be notified. This spec verifies that
    // even though it is scheduled to be notified, it does not get notified, because the unsubscription just happened.
    let instance = new subscribable()
    instance.subscribe(function () {
      subscription2.dispose()
    })
    let subscription2wasNotified = false
    let subscription2 = instance.subscribe(function () {
      subscription2wasNotified = true
    })

    instance.notifySubscribers('ignored')
    expect(subscription2wasNotified).toEqual(false)
  })

  it("Should be able to notify subscribers for a specific 'event'", function () {
    let instance = new subscribable()
    let notifiedValue
    instance.subscribe(
      function (value) {
        notifiedValue = value
      },
      null,
      'myEvent'
    )

    instance.notifySubscribers(123, 'unrelatedEvent')
    expect(notifiedValue).toEqual(undefined)

    instance.notifySubscribers(456, 'myEvent')
    expect(notifiedValue).toEqual(456)
  })

  it("Should be able to unsubscribe for a specific 'event'", function () {
    let instance = new subscribable()
    let notifiedValue
    let subscription = instance.subscribe(
      function (value) {
        notifiedValue = value
      },
      null,
      'myEvent'
    )
    subscription.dispose()
    instance.notifySubscribers(123, 'myEvent')
    expect(notifiedValue).toEqual(undefined)
  })

  it("Should be able to subscribe for a specific 'event' without being notified for the default event", function () {
    let instance = new subscribable()
    let notifiedValue
    instance.subscribe(
      function (value) {
        notifiedValue = value
      },
      null,
      'myEvent'
    )
    instance.notifySubscribers(123)
    expect(notifiedValue).toEqual(undefined)
  })

  it('Should be able to retrieve the number of active subscribers', function () {
    let instance = new subscribable()
    let sub1 = instance.subscribe(function () {})
    let sub2 = instance.subscribe(function () {}, null, 'someSpecificEvent')

    expect(instance.getSubscriptionsCount()).toEqual(2)
    expect(instance.getSubscriptionsCount('change')).toEqual(1)
    expect(instance.getSubscriptionsCount('someSpecificEvent')).toEqual(1)
    expect(instance.getSubscriptionsCount('nonexistentEvent')).toEqual(0)

    sub1.dispose()
    expect(instance.getSubscriptionsCount()).toEqual(1)
    expect(instance.getSubscriptionsCount('change')).toEqual(0)
    expect(instance.getSubscriptionsCount('someSpecificEvent')).toEqual(1)

    sub2.dispose()
    expect(instance.getSubscriptionsCount()).toEqual(0)
    expect(instance.getSubscriptionsCount('change')).toEqual(0)
    expect(instance.getSubscriptionsCount('someSpecificEvent')).toEqual(0)
  })

  it('Should be possible to replace notifySubscribers with a custom handler', function () {
    let instance = new subscribable()
    let interceptedNotifications = new Array()
    instance.subscribe(function () {
      throw new Error('Should not notify subscribers by default once notifySubscribers is overridden')
    })
    instance.notifySubscribers = function (newValue, eventName) {
      interceptedNotifications.push({ eventName: eventName, value: newValue })
    }
    instance.notifySubscribers(123, 'myEvent')

    expect(interceptedNotifications.length).toEqual(1)
    expect(interceptedNotifications[0].eventName).toEqual('myEvent')
    expect(interceptedNotifications[0].value).toEqual(123)
  })

  it('Should inherit any properties defined on subscribable.fn', function () {
    this.after(function () {
      delete subscribable.fn.customProp
      delete subscribable.fn.customFunc
    })

    subscribable.fn.customProp = 'some value'
    subscribable.fn.customFunc = function () {
      return this
    }

    let instance = new subscribable()
    expect(instance.customProp).toEqual('some value')
    expect(instance.customFunc()).toEqual(instance)
  })

  it('Should have access to functions added to "fn" on existing instances on supported browsers', function () {
    // On unsupported browsers, there's nothing to test
    if (!jasmine.browserSupportsProtoAssignment) {
      return
    }

    this.after(function () {
      delete subscribable.fn.customFunction
    })

    const sub = new subscribable()

    let customFunction = function () {}

    sub.fn.customFunction = customFunction

    expect(sub.customFunction).toBe(customFunction)
  })

  it('the `once` callback is called one time', () => {
    const s = new subscribable()
    let nv = null
    s.once(v => {
      expect(nv).toEqual(null)
      nv = v
    })
    expect(nv).toEqual(null)
    s.notifySubscribers('123')
    expect(nv).toEqual('123')
    s.notifySubscribers('55')
    expect(nv).toEqual('123')
  })

  it('Should return "[object Object]" with .toString', function () {
    // Issue #2252: make sure .toString method does not throw error
    expect(new subscribable().toString()).toBe('[object Object]')
  })

  it('subscribes with TC39 Observable {next: () =>}', function () {
    let instance = new subscribable()
    let notifiedValue
    instance.subscribe({
      next(value) {
        notifiedValue = value
      }
    })
    instance.notifySubscribers(123)
    expect(notifiedValue).toEqual(123)
  })
})
