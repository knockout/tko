
import {
  NativeProvider, NATIVE_BINDINGS
} from '../src'

describe('Native Provider Behaviour', function () {
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

})
