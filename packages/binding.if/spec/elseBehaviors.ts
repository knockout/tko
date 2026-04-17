/* eslint semi: 0 */
import { applyBindings } from '@tko/bind'
import { expect } from 'chai'

import { observable } from '@tko/observable'

import { DataBindProvider } from '@tko/provider.databind'
import { MultiProvider } from '@tko/provider.multi'
import { VirtualProvider } from '@tko/provider.virtual'

import { options } from '@tko/utils'

import { bindings as ifBindings } from '../dist'

import { bindings as coreBindings } from '@tko/binding.core'

import { prepareTestNode } from '../../utils/helpers/mocha-test-helpers'

describe('else inside an if binding', function () {
  let testNode: HTMLElement

  beforeEach(function () {
    testNode = prepareTestNode()
  })

  beforeEach(function () {
    const provider = new MultiProvider({ providers: [new DataBindProvider(), new VirtualProvider()] })
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
    provider.bindingHandlers.set(ifBindings)
  })

  describe('as <!-- else -->', function () {
    it('is ignored when the condition is true', function () {
      testNode.innerHTML = "<i data-bind='if: x'>" + 'abc <!-- else --> def' + '</i>'
      expect(testNode.childNodes[0].childNodes.length).to.equal(3)
      applyBindings({ x: true }, testNode)
      expect(testNode.childNodes[0].childNodes.length).to.equal(1)
      expect(testNode.innerText.trim()).to.equal('abc')
    })

    it('shows the else-block when the condition is false', function () {
      testNode.innerHTML = "<i data-bind='if: x'>" + 'abc <!-- else --> def ' + '</i>'
      expect(testNode.childNodes[0].childNodes.length).to.equal(3)
      applyBindings({ x: false }, testNode)
      expect(testNode.childNodes[0].childNodes.length).to.equal(1)
      expect(testNode.innerText.trim()).to.equal('def')
    })

    it('toggles between if/else on condition change', function () {
      testNode.innerHTML = "<i data-bind='if: x'>" + 'abc <!-- else --> def ' + '</i>'
      const x = observable(false)
      expect(testNode.childNodes[0].childNodes.length).to.equal(3)
      applyBindings({ x: x }, testNode)
      expect(testNode.childNodes[0].childNodes.length).to.equal(1)
      expect(testNode.innerText.trim()).to.equal('def')
      x(true)
      expect(testNode.innerText.trim()).to.equal('abc')
    })
  })
})

describe('Else binding', function () {
  let testNode: HTMLElement

  beforeEach(function () {
    testNode = prepareTestNode()
  })

  beforeEach(function () {
    const provider = new MultiProvider({ providers: [new DataBindProvider(), new VirtualProvider()] })
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
    provider.bindingHandlers.set(ifBindings)
  })

  it('DOM node after DOM if condition', function () {
    testNode.innerHTML = "<i data-bind='if: x'>a</i>" + "<b data-bind='else'>b</b>"
    const x = observable(false)
    applyBindings({ x: x }, testNode)
    expect(testNode.innerText).to.equal('b')
    x(true)
    expect(testNode.innerText).to.equal('a')
    x(false)
    expect(testNode.innerText).to.equal('b')
  })

  it('DOM node after DOM if condition, initially true', function () {
    testNode.innerHTML = "<i data-bind='if: x'>a</i>" + "<b data-bind='else'>b</b>"
    const x = observable(true)
    applyBindings({ x: x }, testNode)
    expect(testNode.innerText).to.equal('a')
    x(false)
    expect(testNode.innerText).to.equal('b')
    x(true)
    expect(testNode.innerText).to.equal('a')
  })

  it('DOM node after virtual if condition', function () {
    testNode.innerHTML = '<!-- ko if: x -->a<!-- /ko -->' + "<b data-bind='else'>b</b>"
    const x = observable(false)
    applyBindings({ x: x }, testNode)
    expect(testNode.innerText).to.equal('b')
    x(true)
    expect(testNode.innerText).to.equal('a')
  })

  it('virtual node after DOM if condition', function () {
    testNode.innerHTML = "<i data-bind='if: x'>a</i>" + '<!-- ko else: -->b<!-- /ko -->'
    const x = observable(false)
    applyBindings({ x: x }, testNode)
    expect(testNode.innerText).to.equal('b')
    x(true)
    expect(testNode.innerText).to.equal('a')
  })

  it('virtual node after virtual if condition', function () {
    testNode.innerHTML = '<!-- ko if: x -->a<!-- /ko -->' + '<!-- ko else: -->b<!-- /ko -->'
    const x = observable(false)
    applyBindings({ x: x }, testNode)
    expect(testNode.innerText).to.equal('b')
    x(true)
    expect(testNode.innerText).to.equal('a')
  })

  it('elseif after if condition', function () {
    testNode.innerHTML = "<i data-bind='if: x'>a</i>" + '<!-- ko elseif: y -->b<!-- /ko -->'
    const x = observable(false)
    const y = observable(false)
    applyBindings({ x: x, y: y }, testNode)
    expect(testNode.innerText).to.equal('')
    y(true)
    expect(testNode.innerText).to.equal('b')
    x(true)
    expect(testNode.innerText).to.equal('a')
  })

  it('elseif after if condition, initially true/true', function () {
    testNode.innerHTML =
      "<i data-bind='if: x'>a</i>" + '<!-- ko elseif: y -->b<!-- /ko -->' + '<!-- ko else -->c<!-- /ko -->'
    const x = observable(true)
    const y = observable(true)
    applyBindings({ x: x, y: y }, testNode)
    expect(testNode.innerText).to.equal('a')
    x(false)
    expect(testNode.innerText).to.equal('b')
    x(true)
    expect(testNode.innerText).to.equal('a')
    y(false)
    expect(testNode.innerText).to.equal('a')
    y(true)
    expect(testNode.innerText).to.equal('a')
    x(false)
    expect(testNode.innerText).to.equal('b')
    y(false)
    expect(testNode.innerText).to.equal('c')
  })

  it('elseif after if condition, initially true/false', function () {
    testNode.innerHTML =
      "<i data-bind='if: x'>a</i>" + '<!-- ko elseif: y -->b<!-- /ko -->' + '<!-- ko else -->c<!-- /ko -->'
    const x = observable(true)
    const y = observable(false)
    applyBindings({ x: x, y: y }, testNode)
    expect(testNode.innerText).to.equal('a')
    x(false)
    expect(testNode.innerText).to.equal('c')
    y(true)
    expect(testNode.innerText).to.equal('b')
    x(false)
    y(false)
    expect(testNode.innerText).to.equal('c')
    y(true)
    expect(testNode.innerText).to.equal('b')
    x(true)
    expect(testNode.innerText).to.equal('a')
  })

  it('elseif after if condition, initially false/true', function () {
    testNode.innerHTML = "<i data-bind='if: x'>a</i>" + '<!-- ko elseif: y -->b<!-- /ko -->'
    const x = observable(false)
    const y = observable(true)
    applyBindings({ x: x, y: y }, testNode)
    expect(testNode.innerText).to.equal('b')
    y(false)
    expect(testNode.innerText).to.equal('')
    x(true)
    expect(testNode.innerText).to.equal('a')
    y(false)
    expect(testNode.innerText).to.equal('a')
    x(false)
    y(true)
    expect(testNode.innerText).to.equal('b')
    y(false)
    expect(testNode.innerText).to.equal('')
    x(true)
    expect(testNode.innerText).to.equal('a')
  })

  it('elseif + else after if condition, initially false/false', function () {
    testNode.innerHTML =
      "<i data-bind='if: x'>a</i>" + '<!-- ko elseif: y -->b<!-- /ko -->' + '<!-- ko else -->z<!-- /ko -->'
    const x = observable(false)
    const y = observable(false)
    applyBindings({ x: x, y: y }, testNode)
    expect(testNode.innerText).to.equal('z')
    y(true)
    expect(testNode.innerText).to.equal('b')
    x(true)
    expect(testNode.innerText).to.equal('a')
    x(false)
    expect(testNode.innerText).to.equal('b')
    y(false)
    expect(testNode.innerText).to.equal('z')
    x(true)
    expect(testNode.innerText).to.equal('a')
  })

  it('else chaining after if condition', function () {
    testNode.innerHTML =
      "<div data-bind='if: x'>x</div>" +
      '<!-- ko elseif: y1 -->y1<!-- /ko -->' +
      '<!-- ko elseif: y2 -->y2<!-- /ko -->' +
      '<!-- ko elseif: y3 -->y3<!-- /ko -->' +
      '<!-- ko else -->else<!-- /ko -->'
    const x = observable(false)
    const y1 = observable(false)
    const y2 = observable(false)
    const y3 = observable(false)
    applyBindings({ x: x, y1: y1, y2: y2, y3: y3 }, testNode)
    expect(testNode.innerText).to.equal('else')
    y3(true)
    expect(testNode.innerText).to.equal('y3')
    y2(true)
    expect(testNode.innerText).to.equal('y2')
    y1(true)
    expect(testNode.innerText).to.equal('y1')
    x(true)
    expect(testNode.innerText).to.equal('x')
    x(false)
    expect(testNode.innerText).to.equal('y1')
    y1(false)
    expect(testNode.innerText).to.equal('y2')
    y2(false)
    expect(testNode.innerText).to.equal('y3')
    y3(false)
    expect(testNode.innerText).to.equal('else')
  })

  it('ends the if-chain', function () {
    testNode.innerHTML =
      '<!-- ko if: x -->x<!-- /ko -->' + '<!-- ko else -->!X<!-- /ko -->' + '<!-- ko if: y -->y<!-- /ko -->'
    const x = observable(false)
    const y = observable(false)
    applyBindings({ x: x, y: y }, testNode)
    expect(testNode.innerText).to.equal('!X')
    y(true)
    expect(testNode.innerText).to.equal('!Xy')
    x(true)
    expect(testNode.innerText).to.equal('xy')
    y(false)
    expect(testNode.innerText).to.equal('x')
  })
})
