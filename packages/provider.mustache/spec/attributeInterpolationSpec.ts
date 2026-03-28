/* eslint semi: 0 */

import { triggerEvent, options } from '@tko/utils'

import { applyBindings } from '@tko/bind'

import { observable as Observable } from '@tko/observable'

import { bindings as coreBindings } from '@tko/binding.core'

import { MultiProvider } from '@tko/provider.multi'

import { DataBindProvider } from '@tko/provider.databind'

import { assert, expect } from 'chai'
import { expectContainText, prepareTestNode } from '../../utils/helpers/mocha-test-helpers'
import { AttributeMustacheProvider } from '../src'

function ctxStub(obj = {}) {
  return {
    lookup(v) {
      return obj[v]
    }
  }
}

describe('Attribute Interpolation Markup Provider', function () {
  let testNode: HTMLElement
  let provider: AttributeMustacheProvider

  beforeEach(function () {
    provider = new AttributeMustacheProvider()
    options.bindingProviderInstance = provider
    testNode = document.createElement('div')
    provider.bindingHandlers.set(coreBindings)
  })

  function runAttributeInterpolation(testNode) {
    applyBindings({}, testNode)
  }

  it('Should do nothing when there are no expressions', function () {
    testNode.setAttribute('title', 'some text')
    expect(testNode.title).to.equal('some text')
    expect(Object.keys(provider.getBindingAccessors).length).to.equal(0)
  })

  it('Should do nothing when empty', function () {
    testNode.setAttribute('title', '')
    runAttributeInterpolation(testNode)
    expect(testNode.title).to.equal('')
    const bindings = provider.getBindingAccessors(testNode)
    expect(Object.keys(bindings).length).to.equal(0)
  })

  it('Should not parse unclosed binding', function () {
    testNode.setAttribute('title', 'some {{text')
    runAttributeInterpolation(testNode)
    expect(testNode.title).to.equal('some {{text')
    const bindings = provider.getBindingAccessors(testNode)
    expect(Object.keys(bindings).length).to.equal(0)
  })

  it('Should not parse unopened binding', function () {
    testNode.setAttribute('title', 'some}} text')
    runAttributeInterpolation(testNode)
    expect(testNode.title).to.equal('some}} text')
    const bindings = provider.getBindingAccessors(testNode)
    expect(Object.keys(bindings).length).to.equal(0)
  })

  it('Should create binding from {{...}} expression', function () {
    testNode.setAttribute('title', 'some {{expr}} text')
    const bindings = Array.from(provider.bindingParts(testNode, {}))
    expect(bindings.length).to.equal(1)
    const [handler, parts] = bindings[0]
    expect(handler).to.equal('title')
    expect(parts.length).to.equal(3)
    expect(parts[0].text).to.equal('some ')
    expect(parts[1].text).to.equal('expr')
    expect(parts[2].text).to.equal(' text')
  })

  it('Should ignore unmatched delimiters', function () {
    testNode.setAttribute('title', 'some {{expr1}}expr2}} text')
    const bindings = Array.from(provider.bindingParts(testNode, {}))
    expect(bindings.length).to.equal(1)
    const [handler, parts] = bindings[0]
    expect(parts.length).to.equal(3)
    expect(parts[0].text).to.equal('some ')
    expect(parts[1].text).to.equal('expr1}}expr2')
    expect(parts[2].text).to.equal(' text')
  })

  it('Should support two expressions', function () {
    testNode.setAttribute('title', 'some {{expr1}} middle {{expr2}} text')
    const bindings = Array.from(provider.bindingParts(testNode, {}))
    expect(bindings.length).to.equal(1)
    const [handler, parts] = bindings[0]
    expect(parts.length).to.equal(5)
    const expected = ['some ', 'expr1', ' middle ', 'expr2', ' text']
    for (let i = 0; i < expected.length; ++i) {
      expect(parts[i].text).to.equal(expected[i])
    }
  })

  it('Should support two expressions (quotation marks and backspaces)', function () {
    testNode.setAttribute('title', 'some {{expr1}} middle // "Test" \\ {{expr2}} text')
    const bindings = Array.from(provider.bindingParts(testNode, {}))
    expect(bindings.length).to.equal(1)
    const [handler, parts] = bindings[0]
    expect(parts.length).to.equal(5)
    const expected = ['some ', 'expr1', ' middle // "Test" \\ ', 'expr2', ' text']
    for (let i = 0; i < expected.length; ++i) {
      expect(parts[i].text).to.equal(expected[i])
    }
  })

  it('Should skip empty text', function () {
    testNode.setAttribute('title', '{{expr1}}{{expr2}}')
    const bindings = Array.from(provider.bindingParts(testNode, {}))
    expect(bindings.length).to.equal(1)
    const [handler, parts] = bindings[0]
    expect(parts.length).to.equal(2)
    const expected = ['expr1', 'expr2']
    for (let i = 0; i < expected.length; ++i) {
      expect(parts[i].text).to.equal(expected[i])
    }
  })

  it('Should support more than two expressions', function () {
    testNode.setAttribute('title', 'x {{expr1}} y {{expr2}} z {{expr3}}')
    const bindings = Array.from(provider.bindingParts(testNode, {}))
    expect(bindings.length).to.equal(1)
    const [handler, parts] = bindings[0]
    expect(parts.length).to.equal(6)
    const expected = ['x ', 'expr1', ' y ', 'expr2', ' z ', 'expr3']
    for (let i = 0; i < expected.length; ++i) {
      expect(parts[i].text).to.equal(expected[i])
    }
  })

  it('Should create simple binding for single expression', function () {
    testNode.setAttribute('title', '{{expr1}}')
    const bindings = Array.from(provider.bindingParts(testNode, {}))
    expect(bindings.length).to.equal(1)
    const [handler, parts] = bindings[0]
    expect(parts.length).to.equal(1)
    const expected = ['expr1']
    for (let i = 0; i < expected.length; ++i) {
      expect(parts[i].text).to.equal(expected[i])
    }
  })

  it('Should support expressions in multiple attributes', function () {
    testNode.setAttribute('title', '{{expr1}}')
    testNode.setAttribute('class', 'test') // skipped b/c not interpolated
    testNode.setAttribute('id', '{{expr2}}')
    testNode.setAttribute('data-test', '{{expr3}}')
    const bindings = Array.from(provider.bindingParts(testNode, {}))
    expect(bindings.length).to.equal(3)
    const map = { title: 'expr1', id: 'expr2', 'data-test': 'expr3' }
    bindings.forEach(b => {
      const [handler, [part]] = b
      expect(map[handler as string]).to.equal(part.text)
    })
    expect(testNode.getAttribute('class')).to.equal('test')
  })

  it('Should convert value and checked attributes to two-way bindings', function () {
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('checked', '{{expr2}}')
    input.setAttribute('value', '{{expr1}}')

    const ctx = { expr1: Observable(), expr2: Observable() }
    const bindings: any[] = Array.from(provider.bindingObjects(testNode, ctxStub(ctx)))
    for (const binding of bindings) {
      if (binding.checked) {
        expect(binding.checked).to.equal(ctx.expr2)
      } else if (binding.value) {
        expect(binding.value).to.equal(ctx.expr1)
      } else {
        throw new Error('Unexpected bindings.')
      }
    }
  })

  it('Should support custom attribute binding using "attributeBinding" overloading', function () {
    class KOAttr extends AttributeMustacheProvider {
      override attributeBinding(name, value) {
        const parsedName = name.match(/^ko-(.*)$/)
        if (parsedName) {
          return super.attributeBinding(parsedName[1], value)
        }
        return super.attributeBinding(name, value)
      }
    }

    const provider = new KOAttr()

    // Won't be in data-bind because it doesn't include an expression
    testNode.setAttribute('ko-class', 'test')
    // Should handle normal attributes normally
    testNode.setAttribute('title', '{{expr1}}')
    // This will use the custom handler
    testNode.setAttribute('ko-id', '{{expr2}}')

    const ctx = { expr1: 'x', expr2: 'y' }
    const bindings = provider.getBindingAccessors(testNode, ctxStub(ctx))

    expect(Object.keys(bindings).length).to.equal(2)
    expect(bindings['attr.title']().title).to.equal('x')
    expect(bindings['attr.id']().id).to.equal('y')

    // expect(testNode.getAttribute('data-bind')).to.equal('attr.title:expr1,attr.id:expr2')
  })

  it('should set the style attribute (when there is a `style` binding)', function () {
    const obs = Observable()
    testNode.innerHTML = '<div style="color: {{ obs }}"></div>'
    const div = testNode.childNodes[0] as HTMLDivElement
    applyBindings({ obs: obs }, testNode)
    expect(div.getAttribute('style')).to.equal('color: ')
    obs('red')
    expect(div.getAttribute('style')).to.equal('color: red')
  })
})

describe('Attribute Interpolation Markup bindings', function () {
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = prepareTestNode()
  })

  let bindingHandlers

  beforeEach(function () {
    const providers = [new AttributeMustacheProvider(), new DataBindProvider()]
    const provider = new MultiProvider({ providers })
    options.bindingProviderInstance = provider
    bindingHandlers = provider.bindingHandlers
    bindingHandlers.set(coreBindings)
  })

  it('Should replace {{...}} expression in attribute', function () {
    testNode.innerHTML = '<div title=\'hello {{"name"}}!\'></div>'
    applyBindings(null, testNode)
    const node = testNode.childNodes[0] as HTMLDivElement
    expect(node.title).to.equal('hello name!')
  })

  it('Should replace multiple expressions', function () {
    testNode.innerHTML = '<div title=\'hello {{"name"}}{{"!"}}\'></div>'
    applyBindings(null, testNode)
    const node = testNode.childNodes[0] as HTMLDivElement
    expect(node.title).to.equal('hello name!')
  })

  it('Should support backtick interpolation', function () {
    testNode.innerHTML = "<div title='hello {{ `a${name}b` }}!'></div>"
    applyBindings({ name: 'n' }, testNode)
    const node = testNode.childNodes[0] as HTMLDivElement
    expect(node.title).to.equal('hello anb!')
  })

  it('Should properly handle quotes in text sections', function () {
    testNode.innerHTML = '<div title=\'This is "great" {{"fun"}} with &apos;friends&apos;\'></div>'
    applyBindings(null, testNode)
    const node = testNode.childNodes[0] as HTMLDivElement
    expect(node.title).to.equal('This is "great" fun with \'friends\'')
  })

  it('Should ignore unmatched }} and {{', function () {
    testNode.innerHTML = '<div title=\'hello }}"name"{{"!"}}{{\'></div>'
    applyBindings(null, testNode)
    const node = testNode.childNodes[0] as HTMLDivElement
    expect(node.title).to.equal('hello }}"name"!{{')
  })

  it('Should support expressions in multiple attributes', function () {
    testNode.innerHTML =
      "<div title='{{title}}' id='{{id}}' class='test class' data-test='hello {{\"name\"}}!' data-bind='text:content'></div>"
    applyBindings({ title: 'the title', id: 'test id', content: 'content' }, testNode)
    expectContainText(testNode, 'content')
    const node = testNode.childNodes[0] as HTMLDivElement
    expect(node.title).to.equal('the title')
    expect(node.id).to.equal('test id')
    expect(node.className).to.equal('test class')
    expect(node.getAttribute('data-test')).to.equal('hello name!')
  })

  it('Should update when observable changes', function () {
    testNode.innerHTML = "<div title='The best {{what}}.'></div>"
    const observable = Observable('time')
    applyBindings({ what: observable }, testNode)
    const node = testNode.childNodes[0] as HTMLDivElement
    expect(node.title).to.equal('The best time.')
    observable('fun')
    expect(node.title).to.equal('The best fun.')
  })

  it('Should update when observable changes (quotation marks and backspaces)', function () {
    testNode.innerHTML = '<div title=\'The "best" {{what}}.\'></div>'
    const observable = Observable('time "test"')
    applyBindings({ what: observable }, testNode)
    expect((testNode.childNodes[0] as HTMLDivElement).title).to.equal('The \"best\" time "test".')
    observable('fun \\ test')
    expect((testNode.childNodes[0] as HTMLDivElement).title).to.equal('The \"best\" fun \\ test.')
  })

  it('Should convert value attribute to two-way binding', function () {
    testNode.innerHTML = "<input value='{{value}}'/>"
    const observable = Observable('default value')
    applyBindings({ value: observable }, testNode)
    const node = testNode.childNodes[0] as HTMLInputElement

    expect(node.value).to.equal('default value')

    node.value = 'user-enterd value'
    triggerEvent(testNode.children[0], 'change')
    expect(observable()).to.equal('user-enterd value')
  })

  it('Should convert checked attribute to two-way binding', function () {
    testNode.innerHTML = "<input type='checkbox' checked='{{isChecked}}'/>"
    const observable = Observable(true)
    applyBindings({ isChecked: observable }, testNode)
    const node = testNode.childNodes[0] as HTMLInputElement

    assert.isTrue(node.checked)

    node.click()
    assert.isFalse(observable())
  })
})
