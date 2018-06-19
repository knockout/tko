
import {
  observable
} from 'tko.observable'

import {
  jsxToNode
} from '../src'


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

    assert.equal(node.outerHTML, '<div>x<span>zzz</span>zzzy</div>')
    obs('fff')
    assert.equal(node.outerHTML, '<div>x<span>fff</span>fffy</div>')
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

    assert.equal(node.outerHTML, '<div>x<span in="x"></span>y</div>')
    obs(undefined)
    assert.equal(node.outerHTML, '<div>x<!--[jsx placeholder]-->y</div>')
    obs({
      elementName: 'abbr', children: [], attributes: { in: 'y' }
    })
    assert.equal(node.outerHTML, '<div>x<abbr in="y"></abbr>y</div>')
  })

  it('updates from observable child nodes', function () {
    const obs = observable(["abc", {
      elementName: 'span', children: [], attributes: { in: 'x' }
    }, "def"])

    const node = jsxToNode({
      elementName: "div",
      children: obs,
      attributes: { }
    })

    assert.equal(node.outerHTML, '<div>abc<span in="x"></span>def</div>')
    obs(undefined)
    assert.equal(node.outerHTML, '<div></div>')
    obs(['x', {
      elementName: 'abbr', children: [], attributes: { in: 'y' }
    }, 'y'])
    assert.equal(node.outerHTML, '<div>x<abbr in="y"></abbr>y</div>')
  })
})
