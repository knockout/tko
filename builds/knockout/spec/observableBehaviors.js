describe('Observable', function () {
  it('Should be subscribable', function () {
    var instance = new ko.observable()
    expect(ko.isSubscribable(instance)).to.deep.equal(true)
  })

  it('Should advertise that instances are observable', function () {
    var instance = new ko.observable()
    expect(ko.isObservable(instance)).to.deep.equal(true)
  })

  it('Should not advertise that ko.observable is observable', function () {
    expect(ko.isObservable(ko.observable)).to.deep.equal(false)
  })

  it('Should advertise that instances are not computed', function () {
    var instance = ko.observable()
    expect(ko.isComputed(instance)).to.deep.equal(false)
  })

  it('Should advertise that instances are not pure computed', function () {
    var instance = ko.observable()
    expect(ko.isPureComputed(instance)).to.deep.equal(false)
  })

  it('ko.isObservable should return false for non-observable values', function () {
    ko.utils.arrayForEach([undefined, null, 'x', {}, function () {}, new ko.subscribable()], function (value) {
      expect(ko.isObservable(value)).to.deep.equal(false)
    })
  })

  it('ko.isObservable should throw exception for value that has fake observable pointer', function () {
    var x = ko.observable()
    x.__ko_proto__ = {}
    expect(function () {
      ko.isObservable(x)
    }).to.throw()
  })

  it('Should be able to write values to it', function () {
    var instance = new ko.observable()
    instance(123)
  })

  it('Should be able to write to multiple observable properties on a model object using chaining syntax', function () {
    var model = {
      prop1: new ko.observable(),
      prop2: new ko.observable()
    }
    model.prop1('A').prop2('B')

    expect(model.prop1()).to.deep.equal('A')
    expect(model.prop2()).to.deep.equal('B')
  })

  it('Should be able to use Function.prototype methods to access/update', function () {
    var instance = ko.observable('A')
    var obj = {}

    expect(instance.call(null)).to.deep.equal('A')
    expect(instance.call(obj, 'B')).to.equal(obj)
    expect(instance.apply(null, [])).to.equal('B')
  })

  it('Should advertise that instances can have values written to them', function () {
    var instance = new ko.observable(function () {})
    expect(ko.isWriteableObservable(instance)).to.deep.equal(true)
    expect(ko.isWritableObservable(instance)).to.deep.equal(true)
  })

  it('Should be able to read back most recent value', function () {
    var instance = new ko.observable()
    instance(123)
    instance(234)
    expect(instance()).to.deep.equal(234)
  })

  it('Should initially have undefined value', function () {
    var instance = new ko.observable()
    expect(instance()).to.deep.equal(undefined)
  })

  it('Should be able to set initial value as constructor param', function () {
    var instance = new ko.observable('Hi!')
    expect(instance()).to.deep.equal('Hi!')
  })

  it('Should notify subscribers about each new value', function () {
    var instance = new ko.observable()
    var notifiedValues = []
    instance.subscribe(function (value) {
      notifiedValues.push(value)
    })

    instance('A')
    instance('B')
    expect(notifiedValues).to.deep.equal(['A', 'B'])
  })

  it('Should notify "spectator" subscribers about each new value', function () {
    var instance = new ko.observable()
    var notifiedValues = []
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
    var instance = new ko.observable()
    var notifiedValues = []
    instance.subscribe(function (value) {
      notifiedValues.push(value.childProperty)
    })

    var someUnderlyingObject = { childProperty: 'A' }
    instance(someUnderlyingObject)
    expect(notifiedValues.length).to.deep.equal(1)
    expect(notifiedValues[0]).to.deep.equal('A')

    someUnderlyingObject.childProperty = 'B'
    instance.valueHasMutated()
    expect(notifiedValues.length).to.deep.equal(2)
    expect(notifiedValues[1]).to.deep.equal('B')
  })

  it('Should notify "beforeChange" subscribers before each new value', function () {
    var instance = new ko.observable()
    var notifiedValues = []
    instance.subscribe(
      function (value) {
        notifiedValues.push(value)
      },
      null,
      'beforeChange'
    )

    instance('A')
    instance('B')

    expect(notifiedValues.length).to.deep.equal(2)
    expect(notifiedValues[0]).to.deep.equal(undefined)
    expect(notifiedValues[1]).to.deep.equal('A')
  })

  it('Should be able to tell it that its value will mutate, at which point it notifies "beforeChange" subscribers', function () {
    var instance = new ko.observable()
    var notifiedValues = []
    instance.subscribe(
      function (value) {
        notifiedValues.push(value ? value.childProperty : value)
      },
      null,
      'beforeChange'
    )

    var someUnderlyingObject = { childProperty: 'A' }
    instance(someUnderlyingObject)
    expect(notifiedValues.length).to.deep.equal(1)
    expect(notifiedValues[0]).to.deep.equal(undefined)

    instance.valueWillMutate()
    expect(notifiedValues.length).to.deep.equal(2)
    expect(notifiedValues[1]).to.deep.equal('A')

    someUnderlyingObject.childProperty = 'B'
    instance.valueHasMutated()
    expect(notifiedValues.length).to.deep.equal(2)
    expect(notifiedValues[1]).to.deep.equal('A')
  })

  it('Should ignore writes when the new value is primitive and strictly equals the old value', function () {
    var instance = new ko.observable()
    var notifiedValues = []
    instance.subscribe(notifiedValues.push, notifiedValues)

    for (var i = 0; i < 3; i++) {
      instance('A')
      expect(instance()).to.deep.equal('A')
      expect(notifiedValues).to.deep.equal(['A'])
    }

    instance('B')
    expect(instance()).to.deep.equal('B')
    expect(notifiedValues).to.deep.equal(['A', 'B'])
  })

  it('Should ignore writes when both the old and new values are strictly null', function () {
    var instance = new ko.observable(null)
    var notifiedValues = []
    instance.subscribe(notifiedValues.push, notifiedValues)
    instance(null)
    expect(notifiedValues).to.deep.equal([])
  })

  it('Should ignore writes when both the old and new values are strictly undefined', function () {
    var instance = new ko.observable(undefined)
    var notifiedValues = []
    instance.subscribe(notifiedValues.push, notifiedValues)
    instance(undefined)
    expect(notifiedValues).to.deep.equal([])
  })

  it('Should notify subscribers of a change when an object value is written, even if it is identical to the old value', function () {
    // Because we can't tell whether something further down the object graph has changed, we regard
    // all objects as new values. To override this, set an "equalityComparer" callback
    var constantObject = {}
    var instance = new ko.observable(constantObject)
    var notifiedValues = []
    instance.subscribe(notifiedValues.push, notifiedValues)
    instance(constantObject)
    expect(notifiedValues).to.deep.equal([constantObject])
  })

  it("Should notify subscribers of a change even when an identical primitive is written if you've set the equality comparer to null", function () {
    var instance = new ko.observable('A')
    var notifiedValues = []
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
    var instance = new ko.observable()
    instance.equalityComparer = function (a, b) {
      return !(a && b) ? a === b : a.id == b.id
    }

    var notifiedValues = []
    instance.subscribe(notifiedValues.push, notifiedValues)

    instance({ id: 1 })
    expect(notifiedValues.length).to.deep.equal(1)

    // Same key - no change
    instance({ id: 1, ignoredProp: 'abc' })
    expect(notifiedValues.length).to.deep.equal(1)

    // Different key - change
    instance({ id: 2, ignoredProp: 'abc' })
    expect(notifiedValues.length).to.deep.equal(2)

    // Null vs not-null - change
    instance(null)
    expect(notifiedValues.length).to.deep.equal(3)

    // Null vs null - no change
    instance(null)
    expect(notifiedValues.length).to.deep.equal(3)

    // Null vs undefined - change
    instance(undefined)
    expect(notifiedValues.length).to.deep.equal(4)

    // undefined vs object - change
    instance({ id: 1 })
    expect(notifiedValues.length).to.deep.equal(5)
  })

  it('Should expose a "notify" extender that can configure the observable to notify on all writes, even if the value is unchanged', function () {
    var instance = new ko.observable()
    var notifiedValues = []
    instance.subscribe(notifiedValues.push, notifiedValues)

    instance(123)
    expect(notifiedValues.length).to.deep.equal(1)

    // Typically, unchanged values don't trigger a notification
    instance(123)
    expect(notifiedValues.length).to.deep.equal(1)

    // ... but you can enable notifications regardless of change
    instance.extend({ notify: 'always' })
    instance(123)
    expect(notifiedValues.length).to.deep.equal(2)

    // ... or later disable that
    instance.extend({ notify: null })
    instance(123)
    expect(notifiedValues.length).to.deep.equal(2)
  })

  it('Should be possible to replace notifySubscribers with a custom handler', function () {
    var instance = new ko.observable(123)
    var interceptedNotifications = []
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

  it('Should inherit any properties defined on ko.subscribable.fn or ko.observable.fn', function () {
    after(function () {
      delete ko.subscribable.fn.customProp // Will be able to reach this
      delete ko.subscribable.fn.customFunc // Overridden on ko.observable.fn
      delete ko.observable.fn.customFunc // Will be able to reach this
    })

    ko.subscribable.fn.customProp = 'subscribable value'
    ko.subscribable.fn.customFunc = function () {
      throw new Error("Shouldn't be reachable")
    }
    ko.observable.fn.customFunc = function () {
      return this()
    }

    var instance = ko.observable(123)
    expect(instance.customProp).to.deep.equal('subscribable value')
    expect(instance.customFunc()).to.deep.equal(123)
  })

  it('Should have access to functions added to "fn" on existing instances on supported browsers', function () {
    // On unsupported browsers, there's nothing to test
    if (!browserSupportsProtoAssignment) {
      return
    }

    after(function () {
      delete ko.subscribable.fn.customFunction1
      delete ko.observable.fn.customFunction2
    })

    var observable = ko.observable()

    var customFunction1 = function () {}
    var customFunction2 = function () {}

    ko.subscribable.fn.customFunction1 = customFunction1
    ko.observable.fn.customFunction2 = customFunction2

    expect(observable.customFunction1).to.equal(customFunction1)
    expect(observable.customFunction2).to.equal(customFunction2)
  })
})
