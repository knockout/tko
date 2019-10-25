
import {
  observable
} from '@tko/observable'

import {
  default as NativeProvider, NATIVE_BINDINGS
} from '../src/NativeProvider'

import { MultiProvider } from '@tko/provider.multi'
import { DataBindProvider } from '@tko/provider.databind'
import {
  TextMustacheProvider, AttributeMustacheProvider
} from '@tko/provider.mustache'

describe('Native Provider Behavior', function () {
  it('returns native bindings', function () {
    const p = new NativeProvider()
    const div = document.createElement('div')
    const attr = {'ko-thing': {}}
    div[NATIVE_BINDINGS] = attr
    assert.ok(p.nodeHasBindings(div), true)
    const accessors = p.getBindingAccessors(div)
    assert.equal(Object.keys(accessors).length, 1)
    assert.strictEqual(accessors['thing'](), attr['ko-thing'])
  })

  it('has no bindings when no `ko-*` is present', function () {
    const p = new NativeProvider()
    const div = document.createElement('div')
    const attr = {'thing': {}}
    div[NATIVE_BINDINGS] = attr
    assert.notOk(p.nodeHasBindings(div), false)
    assert.equal(p.getBindingAccessors(div), null)
  })

  it('ignores nodes w/o the symbol', function () {
    const p = new NativeProvider()
    const div = document.createElement('div')
    assert.notOk(p.nodeHasBindings(div), false)
    assert.equal(p.getBindingAccessors(div), null)
  })

  it('returns valueAccessors that update observables', () => {
    const p = new NativeProvider()
    const div = document.createElement('div')
    const obs = observable('iI')
    const attr = {'ko-oo': obs, 'ko-fn': () => 'ø'}
    div[NATIVE_BINDINGS] = attr
    const accessors = p.getBindingAccessors(div)
    assert.equal(accessors.oo(), 'iI')
    accessors.oo('rv')
    assert.equal(obs(), 'rv')
    assert.equal(accessors.fn()(), 'ø')
  })

  describe('pre-emption', () => {
    const divWithNativeBindings = bindings => {
      const div = document.createElement('div')
      div[NATIVE_BINDINGS] = bindings
      return div
    }

    it('pre-empts ko-databind', () => {
      const mp = new MultiProvider()
      mp.addProvider(new NativeProvider())
      mp.addProvider(new DataBindProvider())
      const div = divWithNativeBindings({ 'ko-native': '123' })
      div.setAttribute('data-bind', '{ databind: 345 }')
      const bindings = mp.getBindingAccessors(div, {})
      assert.ok('native' in bindings, 'native in bindings')
      assert.notOk('databind' in bindings, 'databind in bindings')
      assert.equal(Object.keys(bindings).length, 1)
    })

    it('does not pre-empt ko-databind when native bindings are empty', () => {
      const mp = new MultiProvider()
      mp.addProvider(new NativeProvider())
      mp.addProvider(new DataBindProvider())
      const div = divWithNativeBindings({  })
      div.setAttribute('data-bind', '{ databind: 345 }')
      const bindings = mp.getBindingAccessors(div, {})
      assert.notOk('native' in bindings, 'native in bindings')
      assert.ok('databind' in bindings, 'databind in bindings')
      assert.equal(Object.keys(bindings).length, 1)
    })

    it('does not pre-empt ko-databind when native properties are not bindings', () => {
      const mp = new MultiProvider()
      mp.addProvider(new NativeProvider())
      mp.addProvider(new DataBindProvider())
      const div = divWithNativeBindings({ random: 'value' })
      div.setAttribute('data-bind', '{ databind: 345 }')
      const bindings = mp.getBindingAccessors(div, {})
      assert.notOk('native' in bindings, 'native in bindings')
      assert.ok('databind' in bindings, 'databind in bindings')
      assert.equal(Object.keys(bindings).length, 1)
    })

    it('pre-empts {{ }} attributes', () => {
      const mp = new MultiProvider()
      mp.addProvider(new NativeProvider())
      mp.addProvider(new AttributeMustacheProvider())
      const div = divWithNativeBindings({ 'ko-native': '123' })
      div.setAttribute('hello', '{{ 345 }}')
      const bindings = mp.getBindingAccessors(div, {})
      assert.ok('native' in bindings, 'native in bindings')
      assert.notOk('text' in bindings, 'text in bindings')
      assert.equal(Object.keys(bindings).length, 1)
    })

    it('pre-empts {{ }} text nodes', () => {
      const mp = new MultiProvider()
      mp.addProvider(new NativeProvider())
      mp.addProvider(new TextMustacheProvider())
      const div = divWithNativeBindings({ 'ko-native': '123' })
      const child = document.createTextNode('{{ child }}')
      child[NATIVE_BINDINGS] = {}
      div.appendChild(child)
      const nodes = mp.preprocessNode(div.childNodes[0])
      assert.ok(nodes instanceof Text)
      assert.equal(nodes.nodeValue, '{{ child }}')
    })

    it('does not pre-empt text nodes w/o NATIVE_BINDINGS', () => {
      const mp = new MultiProvider()
      mp.addProvider(new NativeProvider())
      mp.addProvider(new TextMustacheProvider())
      const div = divWithNativeBindings({ 'ko-native': '123' })
      div.appendChild(document.createTextNode('{{ child }}'))
      const nodes = mp.preprocessNode(div.childNodes[0])
      assert.equal(nodes.length, 2)
      assert.equal(nodes[0].textContent, 'ko text:child')
    })
  })
})
