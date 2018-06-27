
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
    assert.strictEqual(p.getBindingAccessors(div), attr)
  })

  it('skips nodes w/o the symbol', function () {
    const p = new NativeProvider()
    const div = document.createElement('div')
    assert.notOk(p.nodeHasBindings(div), true)
    assert.equal(p.getBindingAccessors(div), undefined)
  })
})
