import { assert } from 'chai'

import { render, createElement, Fragment } from '../src'

describe('render()', function () {
  it('returns an object with node and dispose properties', function () {
    const jsx = createElement('div', null)
    const result = render(jsx)
    assert.property(result, 'node')
    assert.property(result, 'dispose')
    assert.isFunction(result.dispose)
    result.dispose()
  })

  it('returns the first child node when JSX produces exactly one node', function () {
    const jsx = createElement('span', { id: 'test-single' })
    const result = render(jsx)
    assert.isNotNull(result.node)
    // A single element renders as a plain child node, not a fragment
    assert.notInstanceOf(result.node, DocumentFragment)
    assert.equal((result.node as HTMLElement).tagName.toLowerCase(), 'span')
    result.dispose()
  })

  it('returns a DocumentFragment when JSX produces multiple nodes', function () {
    // Fragment children expand to multiple nodes
    const jsx = createElement(Fragment, null, createElement('div', null), createElement('span', null))
    const result = render(jsx)
    assert.instanceOf(result.node, DocumentFragment)
    result.dispose()
  })

  it('dispose() can be called without throwing', function () {
    const jsx = createElement('p', null, 'Hello')
    const result = render(jsx)
    assert.doesNotThrow(() => result.dispose())
  })

  it('returns node=null-or-fragment when jsx is null/undefined (empty output)', function () {
    // An empty JSX Fragment produces no child nodes → node is the DocumentFragment itself
    const jsx = createElement(Fragment, null)
    const result = render(jsx)
    // Empty fragment: childNodes.length === 0, so node should be the fragment (not firstChild)
    assert.instanceOf(result.node, DocumentFragment)
    result.dispose()
  })

  it('renders a text node for a string child', function () {
    const jsx = createElement('div', null, 'hello world')
    const result = render(jsx)
    // The outer div is a single node
    assert.notInstanceOf(result.node, DocumentFragment)
    const el = result.node as HTMLElement
    assert.equal(el.textContent, 'hello world')
    result.dispose()
  })

  it('renders nested elements correctly', function () {
    const jsx = createElement('section', null, createElement('h1', null, 'Title'))
    const result = render(jsx)
    assert.notInstanceOf(result.node, DocumentFragment)
    const el = result.node as HTMLElement
    assert.equal(el.tagName.toLowerCase(), 'section')
    assert.equal(el.querySelector('h1')?.textContent, 'Title')
    result.dispose()
  })

  it('multiple render() calls each return independent instances', function () {
    const jsx1 = createElement('div', { class: 'first' })
    const jsx2 = createElement('div', { class: 'second' })
    const result1 = render(jsx1)
    const result2 = render(jsx2)
    assert.notStrictEqual(result1.node, result2.node)
    result1.dispose()
    result2.dispose()
  })

  it('dispose() can be called multiple times without throwing', function () {
    const jsx = createElement('div', null)
    const result = render(jsx)
    assert.doesNotThrow(() => {
      result.dispose()
      result.dispose()
    })
  })
})
