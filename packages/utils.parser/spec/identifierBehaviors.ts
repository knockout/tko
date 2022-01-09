
import {
  options, triggerEvent
} from '@tko/utils'

import {
  DataBindProvider
} from '@tko/provider.databind'

import {
  bindings as coreBindings
} from '@tko/binding.core'

import {
  observable
} from '@tko/observable'

import {
  computed
} from '@tko/computed'

import {
  applyBindings,
  dataFor,
  bindingContext
} from '@tko/bind'

import {
  Identifier, Arguments
} from '../dist'

describe('Identifier', function () {
  function testLookup (identifier, $data) {
    const ctx = new bindingContext($data)
    return new Identifier(null, identifier).get_value(undefined, ctx, {})
  }

  function testWrite (identifier, $data, newValue) {
    const ctx = new bindingContext($data)
    return new Identifier(null, identifier).set_value(newValue, ctx, {})
  }

  var c = 'Z',
    f = function () {
      return 'Fv'
    }

  it('looks up values on the parser context', function () {
    var context = { c: c, f: f }
    assert.equal(testLookup('c', context), 'Z')
    assert.equal(testLookup('f', context), f)
  })

  it('looks up values on no-prototype $data', function () {
    const $data = Object.create(null)
    $data.c = c
    assert.equal(testLookup('c', $data), 'Z')
  })

  it('returns null as expected', function () {
    assert.equal(testLookup('$data', null), null)
  })

  it('returns undefined as expected', function () {
    assert.equal(testLookup('$data', undefined), undefined)
  })

  it('sets plain values on $data', () => {
    const $data = { c: c }
    assert.equal($data.c, 'Z')
    testWrite('c', $data, 'X')
    assert.equal($data.c, 'X')
  })

  it('sets observable values on $data', () => {
    const $data = { c: observable(c) }
    assert.equal($data.c(), 'Z')
    testWrite('c', $data, 'X')
    assert.equal($data.c(), 'X')
  })

  it('sets plain values on no-prototype $data', () => {
    const $data = Object.create(null)
    $data.c = c
    testWrite('c', $data, 'X')
    assert.equal($data.c, 'X')
  })

  it('dereferences values on the parser', function () {
    var context = new bindingContext({ f: f })
    var fake_args = new Arguments(null, [])
    var derefs = [fake_args]
    const identifier = new Identifier(null, 'f', derefs)
    assert.equal(identifier.get_value(undefined, context), 'Fv')
  })

  describe('the dereference function', function () {
    it('does nothing with no references', function () {
      var refs,
        ident = new Identifier({}, 'x', refs)
      assert.equal(ident.dereference('1', {}), 1)
    })

    it('does nothing with empty array references', function () {
      var refs = [],
        ident = new Identifier({}, 'x', refs)
      assert.equal(ident.dereference('1', {}), 1)
    })

    it('applies the functions of the refs to the value', function () {
      var fake_args = new Arguments(null, []),
        refs = [fake_args, fake_args],
        ident = new Identifier({}, 'x', refs),
        g = function () {
          return '42'
        },
        f = function () {
          return g
        }
      assert.equal(ident.dereference(f, {}), 42)
    })

    it('sets `this` to the parent member', function () {
      var div = document.createElement('div'),
        context = {
          fn: function () {
            assert.isObject(this)
            assert.equal(this, context)
            return 'ahab'
          },
          moby: 'dick'
        }
      div.setAttribute('data-bind', 'text: $data.fn()')
      options.bindingProviderInstance = new DataBindProvider()
      options.bindingProviderInstance.bindingHandlers.set(coreBindings)
      applyBindings(context, div)
      assert.equal(div.textContent || div.innerText, 'ahab')
    })

    it('sets `this` of a called function', function () {
      var div = document.createElement('div'),
        P = function () {},
        thisIs = observable(),
        context = {
          p: new P()
        }
      P.prototype.fn = function p_fn () { thisIs(this) }
      div.setAttribute('data-bind', 'click: p.fn')
      options.bindingProviderInstance = new DataBindProvider()
      options.bindingProviderInstance.bindingHandlers.set(coreBindings)
      applyBindings(context, div)
      assert.equal(thisIs(), undefined)
      triggerEvent(div, 'click')
      assert.strictEqual(thisIs(), context.p)
    })

    it('uses `$data` as explicit `this` reference', function () {
      var div = document.createElement('div'),
        obs = observable(),
        context = { fn: obs }
      div.setAttribute('data-bind', 'click: => fn(this)')
      options.bindingProviderInstance = new DataBindProvider()
      options.bindingProviderInstance.bindingHandlers.set(coreBindings)
      applyBindings(context, div)
      assert.equal(obs(), undefined)
      triggerEvent(div, 'click')
      assert.strictEqual(obs(), context)
    })

    it('does not break `this`/prototype of observable/others', function () {
      var div = document.createElement('div'),
        comp = computed(function () { return 'rrr' }),
        Fn = function ffn () { this.comp = comp },
        context = {
          instance: new Fn()
        }
      div.setAttribute('data-bind', 'check: instance.comp')
      options.bindingProviderInstance = new DataBindProvider()
      options.bindingProviderInstance.bindingHandlers.set({
        check: function (params) {
          assert.equal(this.value.peek(), 'rrr')
        }
      })
      applyBindings(context, div)
      triggerEvent(div, 'click')
    })

    it('sets `this` of a top-level item to $data', function () {
      options.bindingGlobals = {
        Ramanujan: '1729'
      }
      var div = document.createElement('div'),
        context = {
          fn: function () {
            assert.isObject(this)
            assert.strictEqual(dataFor(div), this, '$data')
            return 'sigtext'
          }
        }
      div.setAttribute('data-bind', 'text: fn()')
      options.bindingProviderInstance = new DataBindProvider()
      options.bindingProviderInstance.bindingHandlers.set(coreBindings)
      applyBindings(context, div)
      assert.equal(div.textContent || div.innerText, 'sigtext')
    })
  })
})
