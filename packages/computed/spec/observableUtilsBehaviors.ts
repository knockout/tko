
import {
  observable
} from '@tko/observable'

import {
  when
} from '../dist'

describe('when', function () {
  it('Runs callback when predicate function becomes true, but only once', function () {
    let x = observable(3),
      called = 0

    when(function () { return x() === 4 }, function () { called++ })

    x(5)
    expect(called).toBe(0)
    expect(x.getSubscriptionsCount()).toBe(1)

    x(4)
    expect(called).toBe(1)
    expect(x.getSubscriptionsCount()).toBe(0)

    x(3)
    x(4)
    expect(called).toBe(1)
    expect(x.getSubscriptionsCount()).toBe(0)
  })

  it('Runs callback if predicate function is already true', function () {
    let x = observable(4),
      called = 0

    when(function () { return x() === 4 }, function () { called++ })

    expect(called).toBe(1)
    expect(x.getSubscriptionsCount()).toBe(0)

    x(3)
    x(4)
    expect(called).toBe(1)
    expect(x.getSubscriptionsCount()).toBe(0)
  })

  it('Accepts an observable as the predicate', function () {
    let x = observable(false),
      called = 0

    when(x, function () { called++ })

    expect(called).toBe(0)
    expect(x.getSubscriptionsCount()).toBe(1)

    x(true)
    expect(called).toBe(1)
    expect(x.getSubscriptionsCount()).toBe(0)
  })

  it('Returns an object with a dispose function that cancels the notification', function () {
    let x = observable(false),
      called = 0

    let handle = when(x, function () { called++ })

    expect(called).toBe(0)
    expect(x.getSubscriptionsCount()).toBe(1)

    handle.dispose()
    expect(x.getSubscriptionsCount()).toBe(0)

    x(true)
    expect(called).toBe(0)
  })

  it('Will call callback function only once even if value is updated during callback', function () {
    let x = observable(false),
      called = 0

    when(x, function () {
      called++
      x(false)
      x(true)
    })

    expect(called).toBe(0)
    expect(x.getSubscriptionsCount()).toBe(1)

    x(true)
    expect(called).toBe(1)
  })

  it('Should be able to specify a \'this\' pointer for the callback', function () {
    let model = {
      someProperty: 123,
      myCallback: function () { expect(this.someProperty).toEqual(123) }
    }
    when(observable(true), model.myCallback, model)
  })
})
