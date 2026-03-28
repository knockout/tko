import { expect } from 'chai'

import { subscribable as Subscribable, extenders } from '../dist'

describe('Extenders', function () {
  it('Should be able to extend any subscribable', function () {
    extenders.setDummyProperty = function (target, value) {
      target.dummyProperty = value
    }

    const subscribable = new Subscribable()
    expect(subscribable.dummyProperty).to.equal(undefined)

    subscribable.extend({ setDummyProperty: 123 })
    expect(subscribable.dummyProperty).to.equal(123)
  })

  it('Should be able to chain extenders', function () {
    extenders.wrapInParentObject = function (target /*, value */) {
      return { inner: target, extend: target.extend }
    }
    const underlyingSubscribable = new Subscribable()
    const result = underlyingSubscribable.extend({ wrapInParentObject: true }).extend({ wrapInParentObject: true })
    expect(result.inner.inner).to.equal(underlyingSubscribable)
  })
})
