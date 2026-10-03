import { expect } from 'chai'
import sinon from 'sinon'

import { options } from '@tko/utils'

import { BindingHandlerObject } from '../src'

describe('BindingHandlerObject', function () {
  let originalOnError: typeof options.onError

  beforeEach(function () {
    originalOnError = options.onError
  })

  afterEach(function () {
    options.onError = originalOnError
  })

  it('registers a single handler when set() is called with (name, value)', function () {
    const handlers = new BindingHandlerObject()
    const handler = { init: () => {} }
    handlers.set('myHandler', handler)
    expect((handlers as any).myHandler).to.equal(handler)
    expect(handlers.get('myHandler')).to.equal(handler)
  })

  it('registers multiple handlers when set() is called with an object', function () {
    const handlers = new BindingHandlerObject()
    const a = { init: () => {} }
    const b = { update: () => {} }
    handlers.set({ a, b })
    expect(handlers.get('a')).to.equal(a)
    expect(handlers.get('b')).to.equal(b)
  })

  it('reports onError when set() is called with both an object and a value', function () {
    const handlers = new BindingHandlerObject()
    const onError = sinon.stub()
    options.onError = onError
    handlers.set({ a: () => {} }, 'extraneous')
    expect(onError.calledOnce).to.equal(true)
    expect(onError.firstCall.args[0]).to.be.instanceOf(Error)
    expect(onError.firstCall.args[0].message).to.match(/extraneous `value` parameter/)
  })

  it('reports onError when set() is called with a non-string, non-object key', function () {
    const handlers = new BindingHandlerObject()
    const onError = sinon.stub()
    options.onError = onError
    handlers.set(undefined as unknown as string)
    expect(onError.calledOnce).to.equal(true)
    expect(onError.firstCall.args[0].message).to.match(/bad binding handler type/)

    onError.resetHistory()
    handlers.set(42 as unknown as string)
    expect(onError.calledOnce).to.equal(true)
    expect(onError.firstCall.args[0].message).to.match(/bad binding handler type/)
  })

  it('get() resolves dotted handler names to the root segment', function () {
    const handlers = new BindingHandlerObject()
    const attr = { init: () => {} }
    handlers.set('attr', attr)
    expect(handlers.get('attr.title')).to.equal(attr)
    expect(handlers.get('attr.style.color')).to.equal(attr)
  })

  it('get() returns undefined for an unknown handler', function () {
    const handlers = new BindingHandlerObject()
    expect(handlers.get('nope')).to.equal(undefined)
  })
})
