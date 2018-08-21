
import {
  options
} from '@tko/utils'

import {
  observable, observableArray
} from '@tko/observable'

import {
  NativeProvider
} from '@tko/provider.native'

import {
  applyBindings, contextFor
} from '@tko/bind'

import {
  JsxObserver
} from '../src'
import { ORIGINAL_JSX_SYM } from '../src/JsxObserver';


/**
 * Simple wrapper for testing.
 */
function jsxToNode (jsx, xmlns, node = document.createElement('div')) {
  new JsxObserver(jsx, node, null, xmlns)
  return node.childNodes[0]
}

describe('jsx', function () {
  it('converts a simple node', () => {
    window.o = observableArray
    const node = jsxToNode({
      elementName: "abc-def",
      children: [],
      attributes: {'aaa': 'bbb' }
    })

    assert.equal(node.outerHTML,
      '<abc-def aaa="bbb"></abc-def>')
  })

  it('converts a node with children', () => {
    const child = {
      elementName: "div-som",
      children: [],
      attributes: { 'attrx': 'y' }
    }
    const node = jsxToNode({
      elementName: "abc-def",
      children: ['some text', child, 'more text'],
      attributes: {'aaa': 'bbb' }
    })

    assert.equal(node.outerHTML, `<abc-def aaa="bbb">` +
      `some text` +
      `<div-som attrx="y"></div-som>` +
      `more text</abc-def>`)
  })

  it('unwraps and monitors the parameter', function () {
    const obs = observable()
    const parent = document.createElement('div')
    const jo = new JsxObserver(obs, parent)
    const child0 = parent.childNodes[0]
    assert.instanceOf(child0, Comment)
    assert.equal(child0.nodeValue, 'O')
    assert.strictEqual(child0, parent.childNodes[0])

    obs('text')
    assert.lengthOf(parent.childNodes, 2)
    assert.instanceOf(parent.childNodes[0], Text)
    assert.equal(parent.childNodes[0].nodeValue, 'text')

    obs({elementName: 'b', attributes: {}, children: []})
    assert.equal(parent.innerHTML, '<b></b><!--O-->')

    obs(undefined)
    assert.equal(parent.innerHTML, '<!--O-->')
  })

  it('interjects a text observable', function () {
    const obs = observable('zzz')
    const child = {
      elementName: "span",
      children: [obs],
      attributes: {}
    }
    const node = jsxToNode({
      elementName: "div",
      children: ['x', child, obs, 'y'],
      attributes: {}
    })

    assert.equal(node.outerHTML, '<div>x<span>zzz<!--O--></span>zzz<!--O-->y</div>')
    obs('fff')
    assert.equal(node.outerHTML, '<div>x<span>fff<!--O--></span>fff<!--O-->y</div>')
  })

  it('interjects an attribute observable', function () {
    const obs = observable('zzz')
    const child = {
      elementName: "span",
      children: [],
      attributes: { xorz: obs }
    }
    const node = jsxToNode({
      elementName: "div",
      children: ['x', child, 'y'],
      attributes: { xorz: obs }
    })

    assert.equal(node.outerHTML, '<div xorz="zzz">x<span xorz="zzz"></span>y</div>')
    obs('f2')
    assert.equal(node.outerHTML, '<div xorz="f2">x<span xorz="f2"></span>y</div>')
  })

  it('interjects all attributes', function () {
    const obs = observable({ xorz: 'abc' })
    const child = {
      elementName: "span",
      children: [],
      attributes: obs
    }
    const node = jsxToNode({
      elementName: "div",
      children: ['x', child, 'y'],
      attributes: obs
    })

    assert.equal(node.outerHTML, '<div xorz="abc">x<span xorz="abc"></span>y</div>')
    obs({ xandy: 'P' })
    assert.equal(node.outerHTML, '<div xandy="P">x<span xandy="P"></span>y</div>')
  })

  it('interjects child nodes', function () {
    const obs = observable({
      elementName: 'span', children: [], attributes: { in: 'x' }
    })

    const node = jsxToNode({
      elementName: "div",
      children: ['x', obs, 'y'],
      attributes: { }
    })

    assert.equal(node.outerHTML, '<div>x<span in="x"></span><!--O-->y</div>')
    obs(undefined)
    assert.equal(node.outerHTML, '<div>x<!--O-->y</div>')
    obs({
      elementName: 'abbr', children: [], attributes: { in: 'y' }
    })
    assert.equal(node.outerHTML, '<div>x<abbr in="y"></abbr><!--O-->y</div>')
  })

  it('updates from observable child nodes', function () {
    const obs = observable(["abc", {
      elementName: 'span', children: [], attributes: { in: 'x' }
    }, "def"])

    const node = jsxToNode({ elementName: "div", children: obs, attributes: { } })

    assert.equal(node.outerHTML, '<div>abc<span in="x"></span>def<!--O--></div>')
    obs(undefined)
    assert.equal(node.outerHTML, '<div><!--O--></div>')
    obs(['x', {
      elementName: 'abbr', children: [], attributes: { in: 'y' }
    }, 'y'])
    assert.equal(node.outerHTML, '<div>x<abbr in="y"></abbr>y<!--O--></div>')
  })

  it('tracks observables in observable arrays', function () {
    const obs = observable([])
    const o2 = observable()
    const node = jsxToNode({ elementName: "i", children: obs, attributes: { } })

    assert.equal(node.outerHTML, '<i><!--O--></i>')
    obs([o2])
    assert.equal(node.outerHTML, '<i><!--O--></i>')
    o2('text')
    assert.equal(node.outerHTML, '<i>text<!--O--></i>')
    o2(['123', '456'])
    assert.equal(node.outerHTML, '<i>123456<!--O--></i>')
    o2([])
    assert.equal(node.outerHTML, '<i><!--O--></i>')
    o2('r2d2')
    assert.equal(node.outerHTML, '<i>r2d2<!--O--></i>')
  })

  it('does not unwrap observables for binding handlers', function () {
    const obs = observable('x')
    const node = jsxToNode({
      elementName: 'div',
      children: [],
      attributes: { 'ko-x': obs, 'ko-y': 'z', 'any': obs, 'any2': 'e' }
    })
    const nodeValues = NativeProvider.getNodeValues(node)
    assert.strictEqual(nodeValues['ko-x'], obs)
    assert.equal(nodeValues['ko-y'], 'z')
    assert.strictEqual(nodeValues['any'], obs)
    assert.equal(nodeValues['any2'], 'e')
  })

  it('inserts after a comment parent-node', () => {
    const parent = document.createElement('div')
    const comment = document.createComment('comment-parent')
    parent.appendChild(comment)
    parent.appendChild(document.createComment('end'))
    const o = new JsxObserver('r', comment)
    assert.equal(parent.innerHTML, `<!--comment-parent-->r<!--end-->`)
  })

  it('inserts SVG nodes and children correctly', function () {
    const obs = observable()
    const circle = { elementName: 'circle', children: [], attributes: {} }
    const svg = { elementName: 'svg', children: [circle, obs], attributes: { abc: '123' } }
    const node = jsxToNode(svg)
    assert.instanceOf(node, SVGElement)
    assert.instanceOf(node.childNodes[0], SVGElement)
    assert.lengthOf(node.childNodes, 2)
    obs({ elementName: 'rect', children: [], attributes: {} })
    assert.equal(node.childNodes[1].tagName, 'rect')
    assert.instanceOf(node.childNodes[1], SVGElement)
  })

  it('inserts actual nodes correctly', () => {
    const parent = document.createElement('div')
    const itag = document.createElement('i')
    const jsx = { elementName: 'div', children: [itag], attributes: {} }
    const jo = new JsxObserver(jsx, parent)
    assert.equal(parent.innerHTML, `<div><i></i></div>`)
    jo.dispose()
  })

  it('inserts actual nodes multiple times', () => {
    const parent = document.createElement('div')
    const itag = document.createElement('i')
    const jsx = { elementName: 'div', children: [itag, itag], attributes: {} }
    const jo = new JsxObserver(jsx, parent)
    assert.equal(parent.innerHTML, `<div><i></i><i></i></div>`)
    jo.dispose()
  })

  it('inserts nodes from original JSX correctly', () => {
    const parent = document.createElement('div')
    const itag = document.createElement('i')
    itag[ORIGINAL_JSX_SYM] = { elementName: 'b', children: [], attributes: {} }
    const jsx = { elementName: 'div', children: [itag], attributes: {} }
    const jo = new JsxObserver(jsx, parent)
    assert.equal(parent.innerHTML, `<div><b></b></div>`)
    jo.dispose()
  })

  it('inserts nodes from original JSX multiple times', () => {
    const parent = document.createElement('div')
    const itag = document.createElement('i')
    itag[ORIGINAL_JSX_SYM] = { elementName: 'b', children: [], attributes: {} }
    const jsx = { elementName: 'div', children: [itag, itag], attributes: {} }
    const jo = new JsxObserver(jsx, parent)
    assert.equal(parent.innerHTML, `<div><b></b><b></b></div>`)
    jo.dispose()
  })

  describe('$context', () => {
    it('applies the bindings of the parent node to children', () => {
      const parent = document.createElement('div')
      const view = {}
      options.bindingProviderInstance = new NativeProvider()
      applyBindings(view, parent)
      const inner = {
        elementName: 'i',
        children: ['y', observable('z')],
        attributes: {}
      }
      const inner2 = {
        elementName: 'i',
        children: observable([inner]),
        attributes: {}
      }
      const jo = new JsxObserver([inner, observable(inner), inner2], parent)

      const [i0, i1, _, i2] = [...parent.childNodes]
      assert.strictEqual(contextFor(i0).$data, view, 'i0')
      assert.strictEqual(contextFor(i1).$data, view, 'i1')
      assert.strictEqual(contextFor(i2).$data, view, 'i2')
      assert.strictEqual(contextFor(i2.childNodes[0]).$data, view, 'i2')

      jo.dispose()
    })
  })

  describe('array changes', () => {
    it('reverses an array correctly', () => {
      const obs = observable(['a', 'b', 'c', 'd'])
      const parent = document.createElement('div')
      const jo = new JsxObserver(obs, parent)
      assert.equal(parent.innerHTML, 'abcd<!--O-->')

      obs(obs().reverse())
      assert.equal(parent.innerHTML, 'dcba<!--O-->')

      jo.dispose()
    })

    it('adds at start/end correctly', () => {
      const obs = observable(['a', 'b', 'c', 'd'])
      const parent = document.createElement('div')
      const jo = new JsxObserver(obs, parent)
      obs(['X', 'a', 'b', 'c', 'd'])
      assert.equal(parent.innerHTML, 'Xabcd<!--O-->')
      obs(['X', 'a', 'b', 'c', 'd', 'Y'])
      assert.equal(parent.innerHTML, 'XabcdY<!--O-->')
      jo.dispose()
    })

    it('inserts into the middle correctly', () => {
      const obs = observable(['a', 'b', 'c', 'd'])
      const parent = document.createElement('div')
      const jo = new JsxObserver(obs, parent)
      obs(['a', 'b', 'X', 'c', 'd'])
      assert.equal(parent.innerHTML, 'abXcd<!--O-->')
      jo.dispose()
    })

    it('removes from the start/middle/end correctly', () => {
      const obs = observable(['a', 'b', 'c', 'd'])
      const parent = document.createElement('div')
      const jo = new JsxObserver(obs, parent)
      obs(['b', 'c', 'd'])
      assert.equal(parent.innerHTML, 'bcd<!--O-->')
      obs(['b','d'])
      assert.equal(parent.innerHTML, 'bd<!--O-->')
      obs(['b'])
      assert.equal(parent.innerHTML, 'b<!--O-->')
      jo.dispose()
    })

    it('inserts / flattens an observable array', () => {
      const obs = observableArray(['x'])
      const parent = document.createElement('div')
      const jo = new JsxObserver([obs], parent)
      assert.equal(parent.innerHTML, 'x<!--O-->')
      jo.dispose()
    })

    it('updates an observable array', () => {
      const obs = observableArray(['x'])
      const parent = document.createElement('div')
      const jo = new JsxObserver([obs], parent)
      obs(['y', 'z'])
      assert.equal(parent.innerHTML, 'yz<!--O-->')
      obs(['z', '2'])
      assert.equal(parent.innerHTML, 'z2<!--O-->')
      obs('r')
      assert.equal(parent.innerHTML, 'r<!--O-->')
      jo.dispose()
    })

    it('updates arbitrarily nexted observables', () => {
      const obs = observableArray([
        observableArray(['x']),
        observableArray([
          observableArray(['y'])
        ])
      ])
      const parent = document.createElement('div')
      const jo = new JsxObserver([obs], parent)
      assert.equal(parent.innerHTML, 'xy<!--O-->')
      jo.dispose()
    })

  })
})
