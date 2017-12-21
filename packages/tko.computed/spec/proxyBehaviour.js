
import {
  proxy, peek, isProxied, getObservable
} from '../src/proxy'

import {
  observable
} from 'tko.observable'

import {
  computed
} from 'tko.computed'

const proxySupport = 'Proxy' in window

describe('Proxy', function () {
  if (!proxySupport) { return }

  it('Should wrap a plain object', function () {
    const x = {}
    const p = proxy(x)
    expect(isProxied(p)).toBe(true)
  })

  it('Should expose properties of the proxy', function () {
    const x = { a: 123 }
    const p = proxy(x)
    expect(p.a).toBe(123)
    expect(peek(p, 'a')).toBe(123)
    p.a = 124
    expect(p.a).toBe(124)
    expect(x.a).toBe(124)
    // Add a new property
    p.b = 456
    expect(x.b).toBe(456)
    expect(p.b).toBe(456)
    expect(peek(p, 'b')).toBe(456)
  })

  it('unproxies to the original by calling the proxy with no args', function () {
    const x = {}
    expect(proxy(x)()).toEqual(x)
  })

  it('assigns own properties when the proxy is called with an object', function () {
    const x = { a: 9, b: 4 }
    const p = proxy(x)
    p({ b: 5, c: 12 })
    expect(p.a).toBe(9)
    expect(p.b).toBe(5)
    expect(p.c).toBe(12)
    expect(x.a).toBe(9)
    expect(x.b).toBe(5)
    expect(x.c).toBe(12)
  })

  it('creates dependencies on the proxied elements', function () {
    const p = proxy({ a: 1 })
    let a2 = computed(() => p.a * p.a)
    expect(a2()).toBe(1)
    p.a++
    expect(a2()).toBe(4)
  })

  it('does not create dependencies with `peek`', function () {
    const p = proxy({ a: 123, b () { return this.a + 7 } })
    let pa = 0
    let pb = 0
    computed(() => {
      pa = peek(p, 'a')
      pb = peek(p, 'b')
    })
    expect(pa).toBe(123)
    expect(pb).toBe(130)
    p.a++
    expect(pa).toBe(123)
    expect(pb).toBe(130)
  })

  it('exposes the observable with getObservable', function () {
    const p = proxy({ a: 123 })
    expect(getObservable(p, 'a')()).toBe(123)
  })

  it('converts functions to deferred, pure computeds', function () {
    const x = observable(9)
    const p = proxy({
      a() { return x() * 2 }, // readable computed
      b(nv) { x(nv) } // writeable computed
    })
    expect(p.a).toBe(18)
    p.b = 8
    expect(x()).toBe(8)
    expect(p.a).toBe(16)
  })

  it('allow adding computeds', function () {
    const p = proxy({ x: 4 })
    p.x2 = function () { return this.x * this.x }
    expect(p.x2).toBe(16)
  })
})
