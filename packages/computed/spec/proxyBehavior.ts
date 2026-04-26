import { expect } from 'chai'
import { proxy, peek, isProxied, getObservable } from '../dist/proxy'

import { observable } from '@tko/observable'

import { computed } from '@tko/computed'

const proxySupport = 'Proxy' in window

describe('Proxy', function () {
  if (!proxySupport) {
    return
  }

  it('Should wrap a plain object', function () {
    const x = {}
    const p = proxy(x)
    expect(isProxied(p)).to.equal(true)
  })

  it('Should expose properties of the proxy', function () {
    const x: { a; b? } = { a: 123 }
    const p = proxy(x)
    expect(p.a).to.equal(123)
    expect(peek(p, 'a')).to.equal(123)
    p.a = 124
    expect(p.a).to.equal(124)
    expect(x.a).to.equal(124)
    // Add a new property
    p.b = 456
    expect(x.b).to.equal(456)
    expect(p.b).to.equal(456)
    expect(peek(p, 'b')).to.equal(456)
  })

  it('unproxies to the original by calling the proxy with no args', function () {
    const x = {}
    expect(proxy(x)()).to.equal(x)
  })

  it('assigns own properties when the proxy is called with an object', function () {
    const x: { a; b; c? } = { a: 9, b: 4 }
    const p = proxy(x)
    p({ b: 5, c: 12 })
    expect(p.a).to.equal(9)
    expect(p.b).to.equal(5)
    expect(p.c).to.equal(12)
    expect(x.a).to.equal(9)
    expect(x.b).to.equal(5)
    expect(x.c).to.equal(12)
  })

  it('creates dependencies on the proxied elements', function () {
    const p = proxy({ a: 1 })
    const a2 = computed(() => p.a * p.a)
    expect(a2()).to.equal(1)
    p.a++
    expect(a2()).to.equal(4)
  })

  it('does not create dependencies with `peek`', function () {
    const p = proxy({
      a: 123,
      b() {
        return this.a + 7
      }
    })
    let pa = 0
    let pb = 0
    computed(() => {
      pa = peek(p, 'a')
      pb = peek(p, 'b')
    })
    expect(pa).to.equal(123)
    expect(pb).to.equal(130)
    p.a++
    expect(pa).to.equal(123)
    expect(pb).to.equal(130)
  })

  it('exposes the observable with getObservable', function () {
    const p = proxy({ a: 123 })
    expect(getObservable(p, 'a')()).to.equal(123)
  })

  it('converts functions to deferred, pure computeds', function () {
    const x = observable(9)
    const p = proxy({
      a() {
        return x() * 2
      }, // readable computed
      b(nv) {
        x(nv)
      } // writeable computed
    })
    expect(p.a).to.equal(18)
    p.b = 8
    expect(x()).to.equal(8)
    expect(p.a).to.equal(16)
  })

  it('allow adding computeds', function () {
    const p = proxy({ x: 4 })
    p.x2 = function () {
      return this.x * this.x
    }
    expect(p.x2).to.equal(16)
  })

  it('deletes properties from both the proxy and the underlying object', function () {
    const x: { a; b? } = { a: 1, b: 2 }
    const p = proxy(x)
    expect('b' in p).to.equal(true)
    expect(x.b).to.equal(2)

    const result = delete p.b
    expect(result).to.equal(true)
    expect('b' in p).to.equal(false)
    expect('b' in x).to.equal(false)
    // Remaining properties are untouched.
    expect(p.a).to.equal(1)
    expect(x.a).to.equal(1)
  })
})
