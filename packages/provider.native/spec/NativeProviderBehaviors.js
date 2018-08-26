
import {
  observable
} from '@tko/observable'

import {
  default as NativeProvider, NATIVE_BINDINGS
} from '../src/NativeProvider'

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
    assert.deepEqual(p.getBindingAccessors(div), {})
  })

  it('ignores nodes w/o the symbol', function () {
    const p = new NativeProvider()
    const div = document.createElement('div')
    assert.notOk(p.nodeHasBindings(div), false)
    assert.deepEqual(p.getBindingAccessors(div), {})
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
})
