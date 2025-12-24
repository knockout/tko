/*
    Notes:
    1. The binding tests both Knockout's default binding and the secure binding
       so The secure binding is not set by default, for an example of how to
       test it see the test "changing Knockout's bindings to KSB" below

    2. Note all the variables e.g. `instance` set in the outermost `describe`.
       These make for shorthands throughout the tests.

*/
/* eslint semi: 0 */

import { assert } from 'chai'
import * as sinon from 'sinon'

import { options } from '@tko/utils'

import { observable } from '@tko/observable'

import { applyBindings, bindingContext } from '@tko/bind'

import { Parser } from '@tko/utils.parser'

import { DataBindProvider } from '../dist'

import * as coreBindings from '@tko/binding.core'

describe('Data-Bind Behaviors', function () {
  let instance: DataBindProvider

  beforeEach(function () {
    instance = new DataBindProvider()
  })

  describe('nodeHasBindings', function () {
    it('identifies elements with data-bind', function () {
      const div = document.createElement('div')
      div.setAttribute('data-bind', 'x')
      assert.ok(instance.nodeHasBindings(div))
    })
  })

  describe('getBindingAccessors with string arg', function () {
    let div

    beforeEach(function () {
      instance = options.bindingProviderInstance = new DataBindProvider()
      div = document.createElement('div')
      instance.bindingHandlers.alpha = { init: sinon.spy(), update: sinon.spy() }
    })

    it('reads multiple bindings', function () {
      div.setAttribute('data-bind', 'a: 123, b: "456"')
      const bindings = instance.getBindingAccessors(div)
      assert.equal(Object.keys(bindings).length, 2, 'len')
      assert.equal(bindings['a'](), 123, 'a')
      assert.equal(bindings['b'](), '456', 'b')
    })

    it('escapes strings', function () {
      div.setAttribute('data-bind', 'a: "a\\"b", b: \'c\\\'d\'')
      const bindings = instance.getBindingAccessors(div)
      assert.equal(Object.keys(bindings).length, 2, 'len')
      assert.equal(bindings['a'](), 'a"b', 'a')
      assert.equal(bindings['b'](), "c\'d", 'b')
    })

    it('returns a name/valueAccessor pair', function () {
      div.setAttribute('data-bind', 'alpha: "122.9"')
      const bindings = instance.getBindingAccessors(div)
      assert.equal(Object.keys(bindings).length, 1, 'len')
      assert.isFunction(bindings['alpha'], 'is accessor')
      assert.equal(bindings['alpha'](), '122.9', '122.9')
    })

    it('becomes the valueAccessor', function () {
      div.setAttribute('data-bind', 'alpha: "122.9"')
      let i_spy = instance.bindingHandlers.alpha.init,
        u_spy = instance.bindingHandlers.alpha.update,
        args
      applyBindings({ vm: true }, div)
      assert.equal(i_spy.callCount, 1, 'i_spy cc')
      assert.equal(u_spy.callCount, 1, 'u_spy cc')
      args = i_spy.getCall(0).args

      assert.equal(args[0], div, 'u_spy div == node')
      assert.equal(args[1](), '122.9', 'valueAccessor')
      // args[2] == allBindings
      assert.deepEqual(args[3], { vm: true }, 'view model')
    })
  })

  describe('getBindingAccessors with function arg', function () {
    let div

    beforeEach(function () {
      instance = options.bindingProviderInstance = new DataBindProvider()
      div = document.createElement('div')
      div.setAttribute('data-bind', 'alpha: x')
      instance.bindingHandlers.alpha = { init: sinon.spy(), update: sinon.spy() }
    })

    it('returns a name/valueAccessor pair', function () {
      const bindings = instance.getBindingAccessors(div)
      assert.equal(Object.keys(bindings).length, 1)
      assert.isFunction(bindings['alpha'])
    })

    it('becomes the valueAccessor', function () {
      let i_spy = instance.bindingHandlers.alpha.init,
        u_spy = instance.bindingHandlers.alpha.update,
        args
      applyBindings({ x: 0xdeadbeef }, div)
      assert.equal(i_spy.callCount, 1, 'i_spy cc')
      assert.equal(u_spy.callCount, 1, 'u_spy cc')
      args = i_spy.getCall(0).args

      assert.equal(args[0], div, 'u_spy div == node')
      assert.equal(args[1](), 0xdeadbeef, 'valueAccessor')
      // args[2] == allBindings
      assert.deepEqual(args[3], { x: 0xdeadbeef }, 'view model')
    })
  })

  describe('all bindings', function () {
    beforeEach(function () {
      options.bindingProviderInstance = new DataBindProvider()
      options.bindingProviderInstance.bindingHandlers.set(coreBindings.bindings)
    })

    it('binds Text with data-bind', function () {
      const div = document.createElement('div')
      div.setAttribute('data-bind', 'text: obs')
      applyBindings({ obs: observable('a towel') }, div)
      assert.equal(div.textContent || div.innerText, 'a towel')
    })

    it('sets attributes to constants', function () {
      const div = document.createElement('div'),
        context = { aTitle: 'petunia plant' }
      div.setAttribute('data-bind', 'attr: { title: aTitle }')
      applyBindings(context, div)
      assert.equal(div.getAttribute('title'), context.aTitle)
    })

    it('sets attributes to observables in objects', function () {
      const div = document.createElement('div'),
        context = { aTitle: observable('petunia plant') }
      div.setAttribute('data-bind', 'attr: { title: aTitle }')
      applyBindings(context, div)
      assert.equal(div.getAttribute('title'), context.aTitle())
    })

    it('registers a click event', function () {
      let div = document.createElement('div'),
        called = false,
        context = {
          cb: function () {
            called = true
          }
        }
      div.setAttribute('data-bind', 'click: cb')
      applyBindings(context, div)
      assert.equal(called, false, 'not called')
      div.click()
      assert.equal(called, true)
    })

    it('sets an input `value` binding ', function () {
      const input = document.createElement('input'),
        context = { vobs: observable('273-9164') }
      input.setAttribute('data-bind', 'value: vobs')
      applyBindings(context, input)
      assert.equal(input.value, '273-9164')
      context.vobs('Area code 415')
      assert.equal(input.value, 'Area code 415')
    })

    it('reads an input `value` binding', function () {
      const input = document.createElement('input'),
        evt = new CustomEvent('change'),
        context = { vobs: observable() }
      input.setAttribute('data-bind', 'value: vobs')
      applyBindings(context, input)
      input.value = '273-9164'
      input.dispatchEvent(evt)
      assert.equal(context.vobs(), '273-9164')
    })

    it('reads an input `value` binding for a defineProperty', function () {
      // see https://github.com/brianmhunt/knockout-secure-binding/issues/23
      // and http://stackoverflow.com/questions/21580173
      const input = document.createElement('input'),
        evt = new CustomEvent('change'),
        obs = observable(),
        context: any = {}
      Object.defineProperty(context, 'pobs', { configurable: true, enumerable: true, get: obs, set: obs })
      input.setAttribute('data-bind', 'value: pobs')
      applyBindings(context, input)
      input.value = '273-9164'
      input.dispatchEvent(evt)
      assert.equal(context.pobs, '273-9164')
    })

    it('writes an input `value` binding for a defineProperty', function () {
      const input = document.createElement('input'),
        // evt = new CustomEvent("change"),
        obs = observable(),
        context: any = {}
      Object.defineProperty(context, 'pobs', { configurable: true, enumerable: true, get: obs, set: obs })
      input.setAttribute('data-bind', 'value: pobs')
      context.pobs = '273-9164'
      applyBindings(context, input)
      assert.equal(context.pobs, obs())
      assert.equal(input.value, context.pobs)
      context.pobs = '415-273-9164'
      assert.equal(input.value, context.pobs)
      assert.equal(input.value, '415-273-9164')
    })

    it('writes an input object defineProperty', function () {
      const input = document.createElement('input'),
        // evt = new CustomEvent("change"),
        obs = observable(),
        context = { obj: { sobs: '' } }
      Object.defineProperty(context.obj, 'sobs', { configurable: true, enumerable: true, get: obs, set: obs })
      // apply the binding with a value
      input.setAttribute('data-bind', 'value: obj.sobs')
      context.obj.sobs = '273-9164'
      applyBindings(context, input)

      // make sure the element is updated
      assert.equal(context.obj.sobs, obs())
      assert.equal(input.value, context.obj.sobs)

      // update the observable and check the input values
      context.obj.sobs = '415-273-9164'
      assert.equal(input.value, context.obj.sobs)
      assert.equal(input.value, '415-273-9164')
    })

    it('writes nested defineProperties', function () {
      const input = document.createElement('input'),
        // evt = new CustomEvent("change"),
        obs = observable(),
        context: any = {},
        obj = {},
        oo = observable(obj) // es5 wraps obj in an observable

      Object.defineProperty(context, 'obj', { configurable: true, enumerable: true, get: oo, set: oo })

      Object.defineProperty(context.obj, 'ddobs', { configurable: true, enumerable: true, get: obs, set: obs })

      input.setAttribute('data-bind', 'value: obj.ddobs')
      context.obj.ddobs = '555-2368' // who ya gonna call?
      applyBindings(context, input)

      assert.equal(context.obj.ddobs, obs())
      assert.equal(input.value, context.obj.ddobs)

      context.obj.ddobs = '646-555-2368'
      assert.equal(input.value, '646-555-2368')
    })

    it('reads a nested defineProperty', function () {
      const input = document.createElement('input'),
        evt = new CustomEvent('change'),
        obs = observable(),
        oo = observable({}),
        context: any = {}

      Object.defineProperty(context, 'obj', { configurable: true, enumerable: true, get: oo, set: oo })

      Object.defineProperty(oo(), 'drobs', { configurable: true, enumerable: true, get: obs, set: obs })

      input.setAttribute('data-bind', 'value: obj.drobs')
      applyBindings(context, input)
      input.value = '273.9164'
      input.dispatchEvent(evt)
      assert.equal(context.obj.drobs, '273.9164')
    })

    it('reads a multi-nested defineProperty', function () {
      const input = document.createElement('input'),
        evt = new CustomEvent('change'),
        o0 = observable({}),
        o1 = observable({}),
        o2 = observable({}),
        context: any = {}

      Object.defineProperty(context, 'o0', { configurable: true, enumerable: true, get: o0, set: o0 })

      Object.defineProperty(o0(), 'o1', { configurable: true, enumerable: true, get: o1, set: o1 })

      Object.defineProperty(o1(), 'o2', { configurable: true, enumerable: true, get: o1, set: o1 })

      Object.defineProperty(o2(), 'oN', { configurable: true, enumerable: true, get: o1, set: o1 })

      input.setAttribute('data-bind', 'value: o0.o1.o2.oN')
      applyBindings(context, input)
      input.value = '1.7724'
      input.dispatchEvent(evt)
      assert.equal(context.o0.o1.o2.oN, '1.7724')
    })
  })

  describe('The lookup of variables (get_lookup_root)', function () {
    function makeBindings(binding, context, globals?, node?) {
      const ctx = new bindingContext(context)
      return new Parser().parse(binding, ctx, globals, node)
    }

    it('accesses the context', function () {
      const binding = 'a: x',
        context = { x: 'y' },
        bindings = makeBindings(binding, context)
      assert.equal(bindings.a(), 'y')
    })

    it('accesses the globals', function () {
      const binding = 'a: z',
        globals = { z: 'ZZ' },
        bindings = makeBindings(binding, {}, globals)
      assert.equal(bindings.a(), globals.z)
    })

    it('accesses $data.value and value', function () {
      const binding = 'x: $data.value, y: value',
        context = { value: 42 },
        bindings = makeBindings(binding, context)
      assert.equal(bindings.x(), 42)
      assert.equal(bindings.y(), 42)
    })

    it('ignores spaces', function () {
      const binding = 'x: $data  .  value, y: $data\n\t\r . \t\r\nvalue',
        context = { value: 42 },
        bindings = makeBindings(binding, context)
      assert.equal(bindings.x(), 42)
      assert.equal(bindings.y(), 42)
    })

    it('looks up nested elements in objects', function () {
      const binding = 'x: { y: { z: a.b.c } }',
        context = { a: { b: { c: 11 } } },
        bindings = makeBindings(binding, context)
      assert.equal(bindings.x().y.z, 11)
    })

    it('can be denied access to `window` globals', function () {
      const binding = 'x: window, y: global, z: document',
        context = {},
        bindings = makeBindings(binding, context)
      assert.throws(bindings.x, 'not found')
      assert.throws(bindings.y, 'not found')
      assert.throws(bindings.z, 'not found')
    })

    it('only returns explicitly from $context', function () {
      const binding = 'x: $context.$data.value, y: $context.value, z: value',
        context = { value: 42 },
        bindings = makeBindings(binding, context)
      assert.equal(bindings.x(), 42)
      assert.equal(bindings.y(), undefined)
      assert.equal(bindings.z(), 42)
    })

    it('recognizes $element', function () {
      const binding = 'x: $element.id',
        node = { id: 42 },
        bindings = makeBindings(binding, {}, {}, node)
      assert.equal(bindings.x(), node.id)
    })

    it('accesses $data before $context', function () {
      const binding = 'x: value'
      const outerContext = new bindingContext({ value: 21 }, undefined, undefined, undefined)
      const innerContext = outerContext.createChildContext({ value: 42 })
      const bindings = new Parser().parse(binding, innerContext, undefined, undefined)
      assert.equal(bindings.x(), 42)
    })

    it('accesses $context before globals', function () {
      const binding = 'a: z',
        context = { z: 42 },
        globals = { z: 84 },
        bindings = makeBindings(binding, context, globals)
      assert.equal(bindings.a(), 42)
    })

    it('accesses properties created with defineProperty', function () {
      // style of e.g. knockout-es5
      const binding = 'a: z',
        context: any = {},
        bindings = makeBindings(binding, context),
        obs = observable()

      Object.defineProperty(context, 'z', { configurable: true, enumerable: true, get: obs, set: obs })

      assert.equal(bindings.a(), undefined)
      context.z = '142'
      assert.equal(bindings.a(), 142)
    })

    it('does not bleed globals', function () {
      const binding = 'a: z',
        globals_1 = { z: 168 },
        globals_2 = { z: undefined },
        context = {},
        bindings_1 = makeBindings(binding, context, globals_1),
        bindings_2 = makeBindings(binding, context, globals_2)
      assert.equal(bindings_1.a(), 168)
      assert.equal(bindings_2.a(), undefined)
    })
  })
})
