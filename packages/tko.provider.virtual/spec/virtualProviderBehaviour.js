
import {
  VirtualProvider
} from '../src'

/**
 * There aren't many tests here because virtual bindings are used throughout
 * the system.
 */

describe('Virtual Provider', function () {
  it('binds a node as expected', function () {
    const node = document.createElement('div')
    node.innerHTML = '<!-- ko text: x --><!-- /ko -->'
    const provider = new VirtualProvider()
    const ctx = { lookup (v) { return 'ax' } }
    const bindings = provider.getBindingAccessors(node.childNodes[0], ctx)
    assert.equal(bindings.text(), 'ax')
  })
})
