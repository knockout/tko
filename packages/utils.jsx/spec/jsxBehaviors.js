
import {
  options, cleanNode
} from '@tko/utils'

import {
  observable, observableArray
} from '@tko/observable'

import {
  computed
} from '@tko/computed'

import {
  NativeProvider
} from '@tko/provider.native'

import {
  VirtualProvider
} from '@tko/provider.virtual'

import {
  applyBindings, contextFor
} from '@tko/bind'

import {
  ComponentABC
} from '@tko/utils.component'

import {
  bindings as componentBindings
} from '@tko/binding.component'

import {
  ComponentProvider
} from '@tko/provider.component'

import {
  JsxObserver
} from '../dist'

import { ORIGINAL_JSX_SYM } from '../dist/JsxObserver';


class JsxTestObserver extends JsxObserver {
  // For testing purposes, we make this synchronous.
  detachAndDispose (node) {
    super.detachAndDispose(node)
    cleanNode(node)
  }
}


/**
 * Simple wrapper for testing.
 */
function jsxToNode (jsx, xmlns, node = document.createElement('div')) {
  new JsxTestObserver(jsx, node, null, xmlns)
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
    const jo = new JsxTestObserver(obs, parent)
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
    const o = new JsxTestObserver('r', comment)
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
    assert.equal(node.outerHTML, '<svg abc="123"><circle></circle><rect></rect><!--O--></svg>')
  })

  it('inserts actual nodes correctly', () => {
    const parent = document.createElement('div')
    const itag = document.createElement('i')
    const jsx = { elementName: 'div', children: [itag], attributes: {} }
    const jo = new JsxTestObserver(jsx, parent)
    assert.equal(parent.innerHTML, `<div><i></i></div>`)
    jo.dispose()
  })

  it('inserts multiple nodes', () => {
    const parent = document.createElement('div')
    const itag = document.createElement('i')
    const btag = document.createElement('b')
    const jsx = { elementName: 'div', children: [itag, btag], attributes: {} }
    const jo = new JsxTestObserver(jsx, parent)
    assert.equal(parent.innerHTML, `<div><i></i><b></b></div>`)
    jo.dispose()
  })

  it('moves nodes inserted multiple times', () => {
    const parent = document.createElement('div')
    const itag = document.createElement('i')
    const jsx = { elementName: 'div', children: [itag, itag], attributes: {} }
    const jo = new JsxTestObserver(jsx, parent)
    assert.equal(parent.innerHTML, `<div><i></i></div>`)
    jo.dispose()
  })

  it('injects a cloneable (JSX) node twice', () => {
    const parent = document.createElement('div')
    const itag = { elementName: 'i', children: [], attributes: { 'ko-counter': 'abc' }}
    const io = observable()
    const jsx = { elementName: 'div', children: [itag, io], attributes: {} }
    const jo = new JsxTestObserver(jsx, parent)

    let counter = 0
    const provider = new NativeProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set({ counter: () => ++counter })

    applyBindings({ abc: '123' }, parent)
    assert.equal(counter, 1)
    const inode = parent.children[0].children[0]
    io(inode) // <i ko-counter />
    assert.equal(counter, 2)
    jo.dispose()
  })

  it('errors injecting a non-JSX node with bindings twice', () => {
    const parent = document.createElement('div')
    const itag = { elementName: 'i', children: [], attributes: { 'ko-counter': 'abc' }}
    const io = observable()
    const jsx = { elementName: 'div', children: [itag, io], attributes: {} }
    const jo = new JsxTestObserver(jsx, parent)

    let counter = 0
    const provider = new NativeProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set({ counter: () => ++counter })

    applyBindings({ abc: '123' }, parent)
    assert.equal(counter, 1)
    const inode = parent.children[0].children[0]
    delete inode[ORIGINAL_JSX_SYM]
    assert.throws(() => io(inode), /You cannot apply bindings multiple times/)
    jo.dispose()
  })

  it('errors injecting a non-JSX node with binding child twice', () => {
    const parent = document.createElement('div')
    const itag = { elementName: 'i', children: [], attributes: { 'ko-counter': 'abc' } }
    const btag = { elementName: 'b', children: [itag], attributes: {} }
    const io = observable()
    const jsx = { elementName: 'div', children: [btag, io], attributes: {} }
    const jo = new JsxTestObserver(jsx, parent)

    let counter = 0
    const provider = new NativeProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set({ counter: () => ++counter })

    applyBindings({ abc: '123' }, parent)
    assert.equal(counter, 1)
    const inode = parent.children[0].children[0]
    delete inode[ORIGINAL_JSX_SYM]
    assert.throws(() => io(inode), /You cannot apply bindings multiple times/)
    jo.dispose()
  })

  it('moves (remove+append) non-JSX nodes with no bindings', () => {
    const parent = document.createElement('div')
    const itag = document.createElement('i')
    const io = observable()
    const jsx = { elementName: 'div', children: [itag, io], attributes: {} }
    const jo = new JsxTestObserver(jsx, parent)

    const provider = new NativeProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set({ counter: () => ++counter })

    applyBindings({abc: '123'}, parent)
    const inode = parent.children[0].children[0]
    delete inode[ORIGINAL_JSX_SYM]
    const p = Symbol('An arbitrary property')
    inode[p] = 12341
    assert.equal(parent.innerHTML, '<div><i></i><!--O--></div>')
    io(inode)
    assert.equal(inode[p], 12341)
    assert.equal(parent.innerHTML, '<div><i></i><!--O--></div>')
    jo.dispose()
  })

  it('inserts nodes from original JSX correctly', () => {
    const parent = document.createElement('div')
    const itag = document.createElement('i')
    itag[ORIGINAL_JSX_SYM] = { elementName: 'b', children: [], attributes: {} }
    const jsx = { elementName: 'div', children: [itag], attributes: {} }
    const jo = new JsxTestObserver(jsx, parent)
    assert.equal(parent.innerHTML, `<div><b></b></div>`)
    jo.dispose()
  })

  it('inserts nodes from original JSX multiple times', () => {
    const parent = document.createElement('div')
    const itag = document.createElement('i')
    itag[ORIGINAL_JSX_SYM] = { elementName: 'b', children: [], attributes: {} }
    const jsx = { elementName: 'div', children: [itag, itag], attributes: {} }
    const jo = new JsxTestObserver(jsx, parent)
    assert.equal(parent.innerHTML, `<div><b></b><b></b></div>`)
    jo.dispose()
  })

  it('inserts null and undefined values as comments', () => {
    const parent = document.createElement('div')
    const jsx = {
      elementName: 'div',
      children: ['a', null, 'b', undefined, 'c'],
      attributes: {}
    }
    const jo = new JsxTestObserver(jsx, parent)
    assert.equal(parent.innerHTML, `<div>a<!--null-->b<!--undefined-->c</div>`)
    jo.dispose()
  })

  it('inserts sparse arrays', () => {
    // The JSX preprocessor can generate sparse arrays with e.g.
    //  <div>{/* thing */}</div>
    const parent = document.createElement('div')
    const jsx = []
    jsx[0] = 'a'
    jsx[2] = 'b'
    const jo = new JsxTestObserver(jsx, parent)
    assert.equal(parent.innerHTML, `ab`)
    jo.dispose()
  })

  it('inserts arrays of arrays', () => {
    const parent = document.createElement('div')
    const jsx = [['a'], [['b']], [[['c']]]]
    const jo = new JsxTestObserver(jsx, parent)
    assert.equal(parent.innerHTML, `abc`)
    jo.dispose()
  })

  /**
   * Simple generator of the given parameter.
   */
  function * gX (...args) { yield * args }
  /**
   * Simple generator of [G0, G1, G2]
   */
  function * g3 () { yield * gX('G0', 'G1', 'G2') }

  it('a generator', () => {
    const parent = document.createElement('div')
    const jsx = g3()
    const jo = new JsxTestObserver(jsx, parent)
    assert.equal(parent.innerHTML, `G0G1G2`)
    jo.dispose()
  })

  it('inserts array of generators', () => {
    const parent = document.createElement('div')
    const jsx = [g3(), g3()]
    const jo = new JsxTestObserver(jsx, parent)
    assert.equal(parent.innerHTML, `G0G1G2G0G1G2`)
    jo.dispose()
  })

  it('inserts generators of arrays', () => {
    function * gA () { yield * [['a'], ['b'], ['c']]}
    const parent = document.createElement('div')
    const jsx = gA()
    const jo = new JsxTestObserver(jsx, parent)
    assert.equal(parent.innerHTML, `abc`)
    jo.dispose()
  })

  it('inserts nested arrays/generators', () => {
    const parent = document.createElement('div')
    const jsx = [gX('a', 'b', ['c', gX('d', 'e')])]
    const jo = new JsxTestObserver(jsx, parent)
    assert.equal(parent.innerHTML, `abcde`)
    jo.dispose()
  })

  describe('primitives', () => {
    const PRIMITIVES = [1, '2', true, false, 0, 11.1]
    for (const p of PRIMITIVES) {
      it(`inserts ${p} as a primitive`, () => {
        const parent = document.createElement('div')
        const jsx = p
        const jo = new JsxTestObserver(jsx, parent)
        assert.equal(parent.innerHTML, String(p))
        jo.dispose()
      })

      it(`inserts ${p} as an observable`, () => {
        const parent = document.createElement('div')
        const jsx = observable(p)
        const jo = new JsxTestObserver(jsx, parent)
        assert.equal(parent.innerHTML, `${p}<!--O-->`)
        jo.dispose()
      })

      it(`inserts ${p} as a primitive child of a node`, () => {
        const parent = document.createElement('div')
        const jsx = {elementName: 'j', children: [p], attributes: {}}
        const jo = new JsxTestObserver(jsx, parent)
        assert.equal(parent.innerHTML, `<j>${p}</j>`)
        jo.dispose()
      })

      it(`inserts ${p} as an observable child of a node`, () => {
        const parent = document.createElement('div')
        const v = observable(p)
        const jsx = {elementName: 'j', children: [v], attributes: {}}
        const jo = new JsxTestObserver(jsx, parent)
        assert.equal(parent.innerHTML, `<j>${p}<!--O--></j>`)
        v.modify(x => `[${x}]`)
        assert.equal(parent.innerHTML, `<j>[${p}]<!--O--></j>`)
        jo.dispose()
      })

      it(`inserts ${p} as a primitive child of an array`, () => {
        const parent = document.createElement('div')
        const jsx = [p]
        const jo = new JsxTestObserver(jsx, parent)
        assert.equal(parent.innerHTML, `${p}`)
        jo.dispose()
      })

      it(`inserts ${p} as an observable child of an array`, () => {
        const parent = document.createElement('div')
        const v = observable(p)
        const jsx = [v]
        const jo = new JsxTestObserver(jsx, parent)
        assert.equal(parent.innerHTML, `${p}<!--O-->`)
        v.modify(x => `[${x}]`)
        assert.equal(parent.innerHTML, `[${p}]<!--O-->`)
        jo.dispose()
      })

      it(`inserts ${p} as an attribute`, () => {
        const parent = document.createElement('div')
        const jsx = {elementName: 'j', children: [], attributes: {p}}
        const jo = new JsxTestObserver(jsx, parent)
        assert.equal(parent.innerHTML, `<j p="${p}"></j>`)
        jo.dispose()
      })

      it(`inserts ${p} as an observable attribute`, () => {
        const parent = document.createElement('div')
        const v = observable(p)
        const jsx = {elementName: 'j', children: [], attributes: {v}}
        const jo = new JsxTestObserver(jsx, parent)
        assert.equal(parent.innerHTML, `<j v="${p}"></j>`)
        v.modify(x => `[${x}]`)
        assert.equal(parent.innerHTML, `<j v="[${p}]"></j>`)
        jo.dispose()
      })
    }
  })

  it('converts and updates an observable number', () => {
    const parent = document.createElement('div')
    const jsx = observable(4)
    const jo = new JsxTestObserver(jsx, parent)
    assert.equal(parent.innerHTML, '4<!--O-->')
    jsx.modify(v => 17 + v)
    assert.equal(parent.innerHTML, '21<!--O-->')
    jo.dispose()
  })

  it('converts and updates an observable child number', () => {
    const parent = document.createElement('div')
    const jsx = {elementName: 'x', children: [observable(4)], attributes: {}}
    const jo = new JsxTestObserver(jsx, parent)
    assert.equal(parent.innerHTML, '<x>4<!--O--></x>')
    jsx.children[0].modify(v => 17 + v)
    assert.equal(parent.innerHTML, '<x>21<!--O--></x>')
    jo.dispose()
  })

  it('calls functions to unwrap', () => {
    const parent = document.createElement('div')
    const jsx = [() => 'bca']
    const jo = new JsxTestObserver(jsx, parent)
    assert.equal(parent.innerHTML, 'bca')
    jo.dispose()
  })

  it('inserts null/undefined/symbol as comments', () => {
    const parent = document.createElement('div')
    const jsx = [null, undefined, Symbol('z')]
    const jo = new JsxTestObserver(jsx, parent)
    assert.equal(parent.innerHTML, '<!--null--><!--undefined--><!--Symbol(z)-->')
    jo.dispose()
  })

  it('inserts BigInt as a string', () => {
    const supported = 'BigInt' in window
    if (!supported) { return }
    const parent = document.createElement('div')
    const jsx = [BigInt(123)]
    const jo = new JsxTestObserver(jsx, parent)
    assert.equal(parent.innerHTML, '123')
    jo.dispose()
  })

  it('inserts arbitrary objects as string comments', () => {
    // Arbitrary objects ought to never show up here, but in the event
    // that they do, we add them as comments to make KO more debuggable.
    const parent = document.createElement('div')
    const jsx = [{x: '123'}]
    const jo = new JsxTestObserver(jsx, parent)
    assert.equal(parent.innerHTML, '<!--{"x":"123"}-->')
    jo.dispose()
  })

  it('unwraps multiple text computeds at root', () => {
    const parent = document.createElement('div')
    const o = observable(false)
    const c1 = computed(() => [o, '123'])
    const c0 = computed(() => o() ? c1 : 'abc')
    const jo = new JsxTestObserver(c0, parent)
    assert.equal(parent.innerHTML, 'abc<!--O-->')
    o('zzz')
    assert.equal(parent.innerHTML, 'zzz123<!--O-->')
    jo.dispose()
  })

  it('unwraps null computeds at root', () => {
    const parent = document.createElement('div')
    const o = observable(null)
    const c0 = computed(() => o())
    const jo = new JsxTestObserver(c0, parent)
    assert.equal(parent.innerHTML, '<!--null--><!--O-->')
    o('zaz')
    assert.equal(parent.innerHTML, 'zaz<!--O-->')
    jo.dispose()
  })

  it('unwraps multiple text computeds as children', () => {
    const parent = document.createElement('div')
    const o = observable(false)
    const c1 = computed(() => [o, '123'])
    const c0 = computed(() => o() ? c1 : 'abc')
    const jsx = { elementName: 'r', children: [c0], attributes: {} }
    const jo = new JsxTestObserver(jsx, parent)
    assert.equal(parent.innerHTML, '<r>abc<!--O--></r>')
    o('zzz')
    assert.equal(parent.innerHTML, '<r>zzz123<!--O--></r>')
    jo.dispose()
  })

  it('unwraps multiple element computeds as children', () => {
    const parent = document.createElement('div')
    const o = observable(false)
    const v = { elementName: 'v', children: ['VV'], attributes: {} }
    const w = { elementName: 'w', children: ['WW'], attributes: {} }
    const c1 = computed(() => v)
    const c0 = computed(() => o() ? c1 : w)
    const jsx = { elementName: 'r', children: [c0], attributes: {} }
    const jo = new JsxTestObserver(jsx, parent)
    assert.equal(parent.innerHTML, '<r><w>WW</w><!--O--></r>')
    o('zzz')
    assert.equal(parent.innerHTML, '<r><v>VV</v><!--O--></r>')
    jo.dispose()
  })

  /**
   *        Promises
   */
  describe('promises', () => {
    it('inserts a promise after it resolves', async () => {
      const parent = document.createElement('div')
      const obs = observable()
      const p = obs.when(true)
      const jsx = [p]
      const jo = new JsxTestObserver(jsx, parent)
      assert.equal(parent.innerHTML, '<!--O-->')
      obs(true)
      await p
      assert.equal(parent.innerHTML, 'true<!--O-->')
      jo.dispose()
    })

    it('resolves a promise to a working observable', async () => {
      const parent = document.createElement('div')
      const obs = observable()
      const jsx = ['a', Promise.resolve(obs), 'b']
      const jo = new JsxTestObserver(jsx, parent)
      assert.equal(parent.innerHTML, 'a<!--O-->b')
      await jsx[0]
      assert.equal(parent.innerHTML, 'a<!--O-->b')
      obs('123')
      assert.equal(parent.innerHTML, 'a123<!--O-->b')
      obs('345')
      assert.equal(parent.innerHTML, 'a345<!--O-->b')
      obs(null)
      assert.equal(parent.innerHTML, 'a<!--O-->b')
      obs(undefined)
      assert.equal(parent.innerHTML, 'a<!--O-->b')
      obs({elementName: 'x', children: [], attributes: {y: 1}})
      assert.equal(parent.innerHTML, 'a<x y="1"></x><!--O-->b')
      jo.dispose()
    })

    it('binds nodes created by promises', async () => {
      let counter = 0
      const parent = document.createElement('div')
      const provider = new NativeProvider()
      options.bindingProviderInstance = provider
      provider.bindingHandlers.set({ counter: () => ++counter })
      const jsx = Promise.resolve({
        elementName: 'r',
        children: [],
        attributes: {'ko-counter': true}
      })
      const jo = new JsxTestObserver(jsx, parent)
      applyBindings({}, parent)
      assert.equal(counter, 0)
      await jsx
      assert.equal(counter, 1)
      jo.dispose()
    })

    it('removes promises from arrays before the promise resolves', async () => {
      const parent = document.createElement('div')
      const p = Promise.resolve('1')
      const obs = observableArray(['a', p, 'b'])
      const jsx = obs
      const jo = new JsxTestObserver(jsx, parent)
      obs(['c'])
      assert.equal(parent.innerHTML, 'c<!--O-->')
      await p
      assert.equal(parent.innerHTML, 'c<!--O-->')
      jo.dispose()
    })

    it('removes promises from arrays after the promise resolves', async () => {
      const parent = document.createElement('div')
      const p = Promise.resolve('1')
      const obs = observableArray(['a', p, 'b'])
      const jsx = obs
      const jo = new JsxTestObserver(jsx, parent)
      await p
      obs(['c'])
      assert.equal(parent.innerHTML, 'c<!--O-->')
      jo.dispose()
    })

    it('adds a comment with the text of an error', async () => {
      const parent = document.createElement('div')
      const p0 = Promise.reject(new Error('Ex'))
      const p1 = Promise.reject('Ey')
      const jsx = [p0, p1]
      const jo = new JsxTestObserver(jsx, parent)
      try { await p0 } catch (err) {}
      try { await p1 } catch (err) {}
      assert.equal(parent.innerHTML, '<!--Error: Ex--><!--O--><!--Error: Ey--><!--O-->')
      jo.dispose()
    })
  })

  /**
   *          Attributes
   */
  describe('attributes', () => {
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

    it('toggles an empty observable attribute', () => {
      const o = observable(undefined)
      const node = jsxToNode({ elementName: 'i', children: [], attributes: {x: o}})
      assert.equal(node.outerHTML, '<i></i>')
      o('')
      assert.equal(node.outerHTML, '<i x=""></i>')
      o(undefined)
      assert.equal(node.outerHTML, '<i></i>')
    })

    it('toggles an observable attribute existence', () => {
      const o = observable(undefined)
      const node = jsxToNode({ elementName: 'i', children: [], attributes: {x: o}})
      assert.equal(node.outerHTML, '<i></i>')
      o('123')
      assert.equal(node.outerHTML, '<i x="123"></i>')
      o(undefined)
      assert.equal(node.outerHTML, '<i></i>')
    })

    it('resolves a thenable when complete', async () => {
      const o = observable(false)
      const x = o.when(true).then(() => 'abc')
      const node = jsxToNode({ elementName: 'i', children: [], attributes: {x}})
      assert.equal(node.outerHTML, '<i></i>')
      o(true)
      await x
      assert.equal(node.outerHTML, '<i x="abc"></i>')
    })

    describe('namespaces', () => {
      // Note: https://stackoverflow.com/questions/52571125
      const NS = {
        svg: 'http://www.w3.org/2000/svg',
        html: 'http://www.w3.org/1999/xhtml',
        xml: 'http://www.w3.org/XML/1998/namespace',
        xlink: 'http://www.w3.org/1999/xlink',
        xmlns: 'http://www.w3.org/2000/xmlns/'
      }

      it('xmlns', () => {
        // Setting `xmlns` with node.setAttributeNS throws:
        // Failed to execute 'setAttributeNS' on 'Element': '' is an
        // invalid namespace for attributes.
        // So when setting `xmlns` we use node.setAttribute.  This *could*
        // apply to other node types.
        // See: https://stackoverflow.com/questions/52571125
        const node = jsxToNode({
          elementName: 'svg',
          children: ['x'],
          attributes: { xmlns: NS.svg }
        })

        assert.equal(node.outerHTML, `<svg xmlns="${NS.svg}">x</svg>`)
      })

      it('xlink:href', () => {
        const node = jsxToNode({
          elementName: 'svg',
          children: ['x'],
          attributes: { xmlns: NS.svg, 'xmlns:xlink': NS.xlink }
        })

        assert.equal(node.outerHTML, `<svg xmlns="${NS.svg}" xmlns:xlink="${NS.xlink}">x</svg>`)
      })

      it('xml:space', () => {
        const node = jsxToNode({
          elementName: 'div',
          children: ['x'],
          attributes: { 'xml:space': 'preserve' }
        })

        assert.equal(node.outerHTML, `<div xml:space="preserve">x</div>`)
      })
    })
  })

  describe('bindings', () => {
    it('applies bindings attached to the nodes', () => {
      let counter = 0
      const parent = document.createElement('div')
      const provider = new NativeProvider()
      options.bindingProviderInstance = provider
      provider.bindingHandlers.set({ counter: () => ++counter })
      const jsx = {
        elementName: 'r',
        children: [],
        attributes: {'ko-counter': true}
      }
      const jo = new JsxTestObserver(jsx, parent)
      applyBindings({}, parent)
      assert.equal(counter, 1)
      jo.dispose()
    })

    it('applies bindings attached to array/nested observable nodes', () => {
      let counter = 0
      const parent = document.createElement('div')
      const provider = new NativeProvider()
      options.bindingProviderInstance = provider
      provider.bindingHandlers.set({ counter: () => ++counter })
      const q = { elementName: 'q', children: [], attributes: { 'ko-counter': true }}
      const oq = observable()
      const jsx = {
        elementName: 'r',
        children: [computed(() => oq())],
        attributes: {}
      }
      const jo = new JsxTestObserver(jsx, parent)
      applyBindings({}, parent)
      oq([q, q])
      assert.equal(counter, 2)
      oq([q, q, q])
      assert.equal(counter, 3)
      oq(observable([{ elementName: 'v', children: [q], attributes: {} }]))
      assert.equal(counter, 4)
      oq(observable([{ elementName: 'v', children: [observable([q, q])], attributes: {} }]))
      assert.equal(counter, 6)
      jo.dispose()
    })

    it('noInitialBinding applies no bindings to array/nested observable nodes', () => {
      let counter = 0
      const parent = document.createElement('div')
      const provider = new NativeProvider()
      options.bindingProviderInstance = provider
      provider.bindingHandlers.set({ counter: () => {console.trace(); ++counter }})

      const q = { elementName: 'q', children: [], attributes: { 'ko-counter': true }}
      const oq = observable([q])
      const jsx = {
        elementName: 'r',
        children: [computed(() => oq())],
        attributes: {}
      }
      assert.equal(counter, 0, 'a')
      const jo = new JsxTestObserver(jsx, parent, undefined, undefined, true)
      assert.equal(counter, 0, 'after jsx binding')
      applyBindings({}, parent)
      assert.equal(counter, 1, 'after jsx binding')
      oq([q,q,q])
      assert.equal(counter, 3, 'after jsx binding')
      jo.dispose()
    })
  })

  describe('components', () => {
    it('binds components that return JSX', () => {
      class TestComponent extends ComponentABC {
        get template () {
          return { elementName: 'a', children: ['A'], attributes: {} }
        }
      }

      TestComponent.register()
      options.bindingProviderInstance = new ComponentProvider()
      options.bindingProviderInstance.bindingHandlers.component = componentBindings.component

      const parent = document.createElement('div')
      const jsx = {
        elementName: 'test-component', children: ['B'], attributes: {} }
      const jo = new JsxTestObserver(jsx, parent)
      applyBindings({}, parent)
      assert.equal(parent.innerHTML,
        '<test-component><a>A</a></test-component>')
      jo.dispose()
    })

    it('binds components array', () => {
      const arr = observableArray([])
      class TestComponentInner extends ComponentABC {
        get template () {
          return { elementName: 'i', children: ['I'], attributes: {} }
        }
      }

      class TestComponentOuter extends ComponentABC {
        get template () {
          return { elementName: 'a', children: [arr], attributes: {} }
        }
      }

      TestComponentOuter.register('t-o')
      TestComponentInner.register('t-i')
      options.bindingProviderInstance = new ComponentProvider()
      options.bindingProviderInstance.bindingHandlers.component = componentBindings.component

      const parent = document.createElement('div')
      const jsx = {
        elementName: 't-o', children: ['B'], attributes: {} }
      const jo = new JsxTestObserver(jsx, parent)
      applyBindings({}, parent)
      assert.equal(parent.innerHTML, '<t-o><a><!--O--></a></t-o>')
      arr([{ elementName: 't-i', attributes: {}, children: ['Z'] }])
      assert.equal(parent.innerHTML, '<t-o><a><t-i><i>I</i></t-i><!--O--></a></t-o>')
      jo.dispose()
    })
  })

  describe('$context', () => {
    function testContext (jsxConvertible, nodeToTest = n => n.childNodes[0]) {
      const parent = document.createElement('div')
      const view = {}
      options.bindingProviderInstance = new VirtualProvider()
      const jo = new JsxTestObserver(jsxConvertible, parent)
      applyBindings(view, parent)
      assert.strictEqual(contextFor(nodeToTest(parent)).$data, view)
      jo.dispose()
    }

    it('applies to a jsx object', () => {
      testContext({ elementName: 'x', children: [], attributes: {} })
    })

    it('applies to a jsx object in an array', () => {
      testContext([{ elementName: 'x', children: [], attributes: {} }])
    })

    it('applies to a jsx object in an observable', () => {
      testContext(observable({ elementName: 'x', children: [], attributes: {} }))
    })

    it('applies to a jsx array in an observable', () => {
      testContext(observable([{ elementName: 'x', children: [], attributes: {} }]))
    })

    it('applies to an array with a an observable', () => {
      const inner = { elementName: 'i1', children: [], attributes: {} }
      testContext([observable(inner)])
    })

    it('applies to jsx with children', () => {
      const jsx = {
        elementName: 'x',
        children: [ { elementName: 'y', children: [], attributes: {} } ],
        attributes: {}
      }
      testContext(jsx, n => n.childNodes[0].childNodes[0])
    })

    it('applies to observable jsx children', () => {
      const jsx = {
        elementName: 'x',
        children: observable(
          [ { elementName: 'y', children: [], attributes: {} } ]
        ),
        attributes: {}
      }
      testContext(jsx, n => n.childNodes[0].childNodes[0])
    })

    it('applies to jsx children that are observable', () => {
      const jsx = observable({
        elementName: 'x',
        children: [
          observable({ elementName: 'y', children: [], attributes: {} })
        ],
        attributes: {}
      })
      testContext(jsx, n => n.childNodes[0].childNodes[0])
    })

    it('applies to observables when they are updated', () => {
      const obs = observable()
      testContext(obs, n => {
        obs({ elementName: 'x', children: [], attributes: {} })
        return n.childNodes[0]
      })
    })
  })

  describe('array changes', () => {
    it('reverses an array correctly', () => {
      const obs = observable(['a', 'b', 'c', 'd'])
      const parent = document.createElement('div')
      const jo = new JsxTestObserver(obs, parent)
      assert.equal(parent.innerHTML, 'abcd<!--O-->')

      obs(obs().reverse())
      assert.equal(parent.innerHTML, 'dcba<!--O-->')

      jo.dispose()
    })

    it('adds at start/end correctly', () => {
      const obs = observable(['a', 'b', 'c', 'd'])
      const parent = document.createElement('div')
      const jo = new JsxTestObserver(obs, parent)
      obs(['X', 'a', 'b', 'c', 'd'])
      assert.equal(parent.innerHTML, 'Xabcd<!--O-->')
      obs(['X', 'a', 'b', 'c', 'd', 'Y'])
      assert.equal(parent.innerHTML, 'XabcdY<!--O-->')
      jo.dispose()
    })

    it('inserts into the middle correctly', () => {
      const obs = observable(['a', 'b', 'c', 'd'])
      const parent = document.createElement('div')
      const jo = new JsxTestObserver(obs, parent)
      obs(['a', 'b', 'X', 'c', 'd'])
      assert.equal(parent.innerHTML, 'abXcd<!--O-->')
      jo.dispose()
    })

    it('removes from the start/middle/end correctly', () => {
      const obs = observable(['a', 'b', 'c', 'd'])
      const parent = document.createElement('div')
      const jo = new JsxTestObserver(obs, parent)
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
      const jo = new JsxTestObserver([obs], parent)
      assert.equal(parent.innerHTML, 'x<!--O-->')
      jo.dispose()
    })

    it('updates an observable array', () => {
      const obs = observableArray(['x'])
      const parent = document.createElement('div')
      const jo = new JsxTestObserver([obs], parent)
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
      const jo = new JsxTestObserver([obs], parent)
      assert.equal(parent.innerHTML, 'xy<!--O-->')
      jo.dispose()
    })

    it('removes and adds computed array', () => {
      const x = observable(false)
      const arr = computed(() => x() ? ['X', 'Y'] : ['Y', 'X'])
      const parent = document.createElement('div')
      const jo = new JsxTestObserver(arr, parent)
      assert.equal(parent.innerHTML, 'YX<!--O-->')
      x(true)
      assert.equal(parent.innerHTML, 'XY<!--O-->')
      jo.dispose()
    })

    it('removes and adds observables', () => {
      const o0 = observable('A')
      const o1 = observable('B')
      const x = observable(false)
      const arr = computed(() => x() ? [o0, o1] : [o0, o1, o0])
      const parent = document.createElement('div')
      const jo = new JsxTestObserver(arr, parent)
      assert.equal(parent.innerHTML, 'ABA<!--O-->')
      x(true)
      assert.equal(parent.innerHTML, 'AB<!--O-->')
      jo.dispose()
    })
  })
})
