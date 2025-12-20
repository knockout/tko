import { assert } from 'chai'

import { VirtualProvider } from '../dist'

/**
 * There aren't many tests here because virtual bindings are used throughout
 * the system.
 */
describe('Virtual Provider', function () {
  it('binds a node as expected', function () {
    const node = document.createElement('div')
    node.innerHTML = '<!-- ko text: x --><!-- /ko -->'
    const provider = new VirtualProvider()
    const ctx = {
      lookup(v) {
        return 'ax'
      }
    }
    const bindings = provider.getBindingAccessors(node.childNodes[0], ctx)
    assert.equal(bindings.text(), 'ax')
  })

  it('binds multiple bindings as expected', function () {
    const node = document.createElement('div')
    node.innerHTML = '<!-- ko text: x, t2: "vx" --><!-- /ko -->'
    const provider = new VirtualProvider()
    const ctx = {
      lookup(v) {
        return 'ax'
      }
    }
    const bindings = provider.getBindingAccessors(node.childNodes[0], ctx)
    assert.equal(bindings.text(), 'ax')
    assert.equal(bindings.t2(), 'vx')
  })

  describe('the <ko> element', function () {
    function tryKoConvert(attributes: Record<string, string>, node = document.createElement('ko')) {
      const provider = new VirtualProvider()
      const parent = document.createElement('div')
      for (const [name, value] of Object.entries(attributes)) {
        node.setAttribute(name, value)
      }
      parent.appendChild(node)
      return provider.preprocessNode(node)
    }

    it('converts <ko test=x>', function () {
      const [open, close] = tryKoConvert({ test: 'x' })
      assert.equal(open.nodeValue, 'ko test: x')
      assert.equal(close.nodeValue, '/ko')
    })

    it('converts <ko t1=x, t2="y">', function () {
      const [open, close] = tryKoConvert({ t1: 'x', t2: '"Y"' })
      assert.equal(open.nodeValue, 'ko t1: x,t2: "Y"')
      assert.equal(close.nodeValue, '/ko')
    })

    it('replaces "ko-" prefix', function () {
      const [open, close] = tryKoConvert({ 'ko-t1': 'x', 'ko-t2': '"Y"' })
      assert.equal(open.nodeValue, 'ko t1: x,t2: "Y"')
      assert.equal(close.nodeValue, '/ko')
    })

    it('includes child nodes in the new virtual element', function () {
      const koNode = document.createElement('ko')
      koNode.appendChild(document.createElement('div'))
      koNode.appendChild(document.createComment('abcc'))
      const [open, d, c, close] = tryKoConvert({ t1: 'x', t2: '"Y"' }, koNode)
      assert.equal(open.nodeValue, 'ko t1: x,t2: "Y"')
      assert.equal(close.nodeValue, '/ko')
      assert.equal(d.outerHTML, '<div></div>')
      assert.equal(c.nodeValue, 'abcc')
    })
  })
})
