/* globals assert, it, describe */
import { assert } from 'chai';

import {
    observable
} from '@tko/observable'

import {
  LifeCycle
} from '../src'

describe('KO LifeCycle', function () {
  describe('mixInto', function () {
    it('extends a function prototype', function () {
      let fn = function () {}
      LifeCycle.mixInto(fn)
      assert.isFunction(fn.prototype.subscribe)
      assert.isFunction(fn.prototype.computed)
      assert.isFunction(fn.prototype.addEventListener)
      assert.isFunction(fn.prototype.anchorTo)
      assert.isFunction(fn.prototype.dispose)
      assert.isFunction(fn.prototype.addDisposable)
      assert.isNotFunction(fn.prototype.mixInto)
    })

    it('adds to a constructed item', function () {
      let Ctr, instance
      Ctr = function () {}
      instance = new Ctr()
      LifeCycle.mixInto(Ctr)
      assert.isFunction(instance.subscribe)
      assert.isFunction(instance.computed)
      assert.isFunction(instance.addEventListener)
      assert.isFunction(instance.anchorTo)
      assert.isFunction(instance.dispose)
      assert.isFunction(instance.addDisposable)
      assert.isNotFunction(instance.mixInto)
    })

    it('extends a class', function () {
      class Child extends LifeCycle {}
      assert.isFunction(Child.prototype.subscribe)
      assert.isFunction(Child.prototype.computed)
      assert.isFunction(Child.prototype.addEventListener)
      assert.isFunction(Child.prototype.anchorTo)
      assert.isFunction(Child.prototype.dispose)
      assert.isFunction(Child.prototype.addDisposable)
      // TODO: Fails with tsc, check if test is obsolte with typescript
      // assert.isNotFunction(Child.prototype.mixInto)
    })

    it('extends a class instance', function () {
      class X extends LifeCycle {};
      const c = new X()
      LifeCycle.mixInto(c)
      assert.isFunction(c.subscribe)
      assert.isFunction(c.computed)
      assert.isFunction(c.addEventListener)
      assert.isFunction(c.anchorTo)
      assert.isFunction(c.dispose)
      assert.isFunction(c.addDisposable)
      // TODO: Fails with tsc, check if test is obsolte with typescript
      // assert.isNotFunction(c.mixInto)
    })
  })

  describe('computed', () => {
    let lastThis

    beforeEach(() => (lastThis = null))

    class LcComputedTest extends LifeCycle {
      method () { lastThis = this }
    }

    it('calls a named function', () => {
      const lf = new LcComputedTest()
      lf.computed('method')
      assert.strictEqual(lastThis, lf)
    })

    it('binds and calls a this.method', () => {
      const lf = new LcComputedTest()
      lf.computed(lf.method)
      assert.strictEqual(lastThis, lf)
    })

    it('calls a bound method', () => {
      const lf = new LcComputedTest()
      function fn () { lastThis = this }
      lf.computed(fn.bind(lf))
      assert.strictEqual(lastThis, lf)
    })

    it('calls a function (unbound)', () => {
      const lf = new LcComputedTest()
      lf.computed(function y () { 'use strict'; lastThis = this })
      assert.strictEqual(lastThis, undefined)
    })

    it('calls a () => {}', () => {
      const lf = new LcComputedTest()
      lf.computed(() => (lastThis = this))
      assert.strictEqual(lastThis, this)
    })

    it('given a string binds and calls that method', () => {
      const lf = new LcComputedTest()
      lf.computed('method')
      assert.strictEqual(lastThis, lf)
    })

    it('binds an object argument', () => {
      const lf = new LcComputedTest()
      lf.computed({ read: lf.method })
      assert.strictEqual(lastThis, lf)
    })
  })

  describe('dispose', function () {
    it('disposes of subscriptions', function () {
      let Ctr, c, o
      o = observable()
      Ctr = (function () {
        function Ctr () {
          this.ons = () => {}
          this.subscribe(o, this.ons)
        }
        return Ctr
      })()
      LifeCycle.mixInto(Ctr)
      c = new Ctr()
      assert.equal(o.getSubscriptionsCount(), 1)
      c.dispose()
      assert.equal(o.getSubscriptionsCount(), 0)
    })

    it('disposes of computeds', function () {
      let Ctr, c, o
      o = observable()
      Ctr = (function () {
        function Ctr () {
          this.computed(o, 'comp')
        }
        Ctr.prototype.comp = function () {
          return o()
        }
        return Ctr
      })()
      LifeCycle.mixInto(Ctr)
      c = new Ctr()
      assert.equal(o.getSubscriptionsCount(), 1)
      c.dispose()
      assert.equal(o.getSubscriptionsCount(), 0)
    })

    it('addEventListener removes the event on dispose', function () {
      let Ctr, c, div, o
      o = observable(0)
      div = document.createElement('div')
      Ctr = (function () {
        function Ctr () {
          this.addEventListener(div, 'click', function () {
            return o(o() + 1)
          })
        }
        return Ctr
      })()
      LifeCycle.mixInto(Ctr)
      c = new Ctr()
      div.click()
      assert.equal(o(), 1)
      c.dispose()
      div.click()
      assert.equal(o(), 1)
    })

    it('addEventListener removes event on dispose', function () {
      let divClick = 0
      let anchorClick = 0
      const o = observable()
      const div = document.createElement('div')
      const anchor = document.createElement('em')
      class NodeLifeCycle extends LifeCycle {
        constructor () {
          super()
          this.computed(() => o())
          this.anchorTo(anchor)
          this.addEventListener(div, 'click', () => divClick++)
          this.addEventListener(anchor, 'click', () => anchorClick++)
        }
      }
      const nlc = new NodeLifeCycle()
      assert.equal(o.getSubscriptionsCount(), 1)

      div.click()
      assert.equal(divClick, 1)
      assert.equal(anchorClick, 0)
      anchor.click()
      assert.equal(divClick, 1)
      assert.equal(anchorClick, 1)

      nlc.dispose()

      assert.equal(o.getSubscriptionsCount(), 0)
      div.click()
      anchor.click()
      assert.equal(divClick, 1)
      assert.equal(anchorClick, 1)
    })
  })
})
