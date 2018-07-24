
import {
  observable
} from 'tko.observable'

import {
  jsxToNode
} from '../src'

import {
  NativeProvider
} from 'tko.provider.native'

describe('jsx', function () {
  it('converts a simple node', () => {
    const node = jsxToNode({
      elementName: "abc-def",
      children: [],
      attributes: {'aaa': 'bbb' }
    })

    assert.equal(node.outerHTML, '<abc-def aaa="bbb"></abc-def>')
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

    assert.equal(node.outerHTML, '<abc-def aaa="bbb">some text' +
      '<div-som attrx="y"></div-som>more text</abc-def>')
  })

  it('unwraps and monitors the parameter', function () {
    const obs = observable()
    const node = jsxToNode(obs)
    // A parent is needed because we use replaceNode.
    const parent = document.createElement('div')
    parent.appendChild(node)
    assert.instanceOf(node, Comment)
    assert.equal(node.nodeValue, '[JSX J]')
    assert.strictEqual(node, parent.childNodes[0])
    obs('text')
    assert.instanceOf(parent.childNodes[0], Text)
    assert.equal(parent.childNodes[0].nodeValue, 'text')
    obs({elementName: 'b', attributes: {}, children: []})
    assert.equal(parent.innerHTML, '<b></b>')
    obs(undefined)
    assert.equal(parent.innerHTML, '<!--[JSX J]-->')
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

    assert.equal(node.outerHTML, '<div>x<span>zzz<!--[JSX P]--></span>zzz<!--[JSX P]-->y</div>')
    obs('fff')
    assert.equal(node.outerHTML, '<div>x<span>fff<!--[JSX P]--></span>fff<!--[JSX P]-->y</div>')
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

    assert.equal(node.outerHTML, '<div>x<span in="x"></span><!--[JSX P]-->y</div>')
    obs(undefined)
    assert.equal(node.outerHTML, '<div>x<!--[JSX C]--><!--[JSX P]-->y</div>')
    obs({
      elementName: 'abbr', children: [], attributes: { in: 'y' }
    })
    assert.equal(node.outerHTML, '<div>x<abbr in="y"></abbr><!--[JSX P]-->y</div>')
  })

  it('updates from observable child nodes', function () {
    const obs = observable(["abc", {
      elementName: 'span', children: [], attributes: { in: 'x' }
    }, "def"])

    const node = jsxToNode({ elementName: "div", children: obs, attributes: { } })

    assert.equal(node.outerHTML, '<div>abc<span in="x"></span>def</div>')
    obs(undefined)
    assert.equal(node.outerHTML, '<div></div>')
    obs(['x', {
      elementName: 'abbr', children: [], attributes: { in: 'y' }
    }, 'y'])
    assert.equal(node.outerHTML, '<div>x<abbr in="y"></abbr>y</div>')
  })

  it('tracks observables in observable arrays', function () {
    const obs = observable([])
    const o2 = observable()
    const node = jsxToNode({ elementName: "i", children: obs, attributes: { } })

    assert.equal(node.outerHTML, '<i></i>')
    obs([o2])
    assert.equal(node.outerHTML, '<i><!--[JSX C]--><!--[JSX P]--></i>')
    o2('text')
    assert.equal(node.outerHTML, '<i>text<!--[JSX P]--></i>')
    o2(['123', '456'])
    assert.equal(node.outerHTML, '<i>123456<!--[JSX P]--></i>')
    o2([])
    assert.equal(node.outerHTML, '<i><!--[JSX P]--></i>')
    o2('r2d2')
    assert.equal(node.outerHTML, '<i>r2d2<!--[JSX P]--></i>')
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

  it('inserts SVG nodes and children correctly', function () {
    const obs = observable()
    const circle = { elementName: 'circle', children: [], attributes: {} }
    const svg = { elementName: 'svg', children: [circle, obs], attributes: { abc: '123' } }
    const node = jsxToNode(svg)
    assert.instanceOf(node, SVGElement)
    assert.instanceOf(node.childNodes[0], SVGElement)
    assert.lengthOf(node.childNodes, 3)
    obs({ elementName: 'rect', children: [], attributes: {} })
    assert.equal(node.childNodes[1].tagName, 'rect')
    assert.instanceOf(node.childNodes[1], SVGElement)
  })

})
