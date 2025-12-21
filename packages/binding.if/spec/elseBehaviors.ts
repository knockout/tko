/* eslint semi: 0 */
import { applyBindings } from '@tko/bind'

import { observable } from '@tko/observable'

import { DataBindProvider } from '@tko/provider.databind'
import { MultiProvider } from '@tko/provider.multi'
import { VirtualProvider } from '@tko/provider.virtual'

import { options } from '@tko/utils'

import { bindings as ifBindings } from '../dist'

import { bindings as coreBindings } from '@tko/binding.core'

import '@tko/utils/helpers/jasmine-13-helper'

describe('else inside an if binding', function () {
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = jasmine.prepareTestNode()
  })

  beforeEach(function () {
    let provider = new MultiProvider({ providers: [new DataBindProvider(), new VirtualProvider()] })
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
    provider.bindingHandlers.set(ifBindings)
  })

  describe('as <!-- else -->', function () {
    it('is ignored when the condition is true', function () {
      testNode.innerHTML = "<i data-bind='if: x'>" + 'abc <!-- else --> def' + '</i>'
      expect(testNode.childNodes[0].childNodes.length).toEqual(3)
      applyBindings({ x: true }, testNode)
      expect(testNode.childNodes[0].childNodes.length).toEqual(1)
      expect(testNode.innerText).toEqual('abc')
    })

    it('shows the else-block when the condition is false', function () {
      testNode.innerHTML = "<i data-bind='if: x'>" + 'abc <!-- else --> def ' + '</i>'
      expect(testNode.childNodes[0].childNodes.length).toEqual(3)
      applyBindings({ x: false }, testNode)
      expect(testNode.childNodes[0].childNodes.length).toEqual(1)
      expect(testNode.innerText).toEqual('def')
    })

    it('toggles between if/else on condition change', function () {
      testNode.innerHTML = "<i data-bind='if: x'>" + 'abc <!-- else --> def ' + '</i>'
      let x = observable(false)
      expect(testNode.childNodes[0].childNodes.length).toEqual(3)
      applyBindings({ x: x }, testNode)
      expect(testNode.childNodes[0].childNodes.length).toEqual(1)
      expect(testNode.innerText).toEqual('def')
      x(true)
      expect(testNode.innerText).toEqual('abc')
    })
  })
})

describe('Else binding', function () {
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = jasmine.prepareTestNode()
  })

  beforeEach(function () {
    let provider = new MultiProvider({ providers: [new DataBindProvider(), new VirtualProvider()] })
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
    provider.bindingHandlers.set(ifBindings)
  })

  it('DOM node after DOM if condition', function () {
    testNode.innerHTML = "<i data-bind='if: x'>a</i>" + "<b data-bind='else'>b</b>"
    let x = observable(false)
    applyBindings({ x: x }, testNode)
    expect(testNode.innerText).toEqual('b')
    x(true)
    expect(testNode.innerText).toEqual('a')
    x(false)
    expect(testNode.innerText).toEqual('b')
  })

  it('DOM node after DOM if condition, initially true', function () {
    testNode.innerHTML = "<i data-bind='if: x'>a</i>" + "<b data-bind='else'>b</b>"
    let x = observable(true)
    applyBindings({ x: x }, testNode)
    expect(testNode.innerText).toEqual('a')
    x(false)
    expect(testNode.innerText).toEqual('b')
    x(true)
    expect(testNode.innerText).toEqual('a')
  })

  it('DOM node after virtual if condition', function () {
    testNode.innerHTML = '<!-- ko if: x -->a<!-- /ko -->' + "<b data-bind='else'>b</b>"
    let x = observable(false)
    applyBindings({ x: x }, testNode)
    expect(testNode.innerText).toEqual('b')
    x(true)
    expect(testNode.innerText).toEqual('a')
  })

  it('virtual node after DOM if condition', function () {
    testNode.innerHTML = "<i data-bind='if: x'>a</i>" + '<!-- ko else: -->b<!-- /ko -->'
    let x = observable(false)
    applyBindings({ x: x }, testNode)
    expect(testNode.innerText).toEqual('b')
    x(true)
    expect(testNode.innerText).toEqual('a')
  })

  it('virtual node after virtual if condition', function () {
    testNode.innerHTML = '<!-- ko if: x -->a<!-- /ko -->' + '<!-- ko else: -->b<!-- /ko -->'
    let x = observable(false)
    applyBindings({ x: x }, testNode)
    expect(testNode.innerText).toEqual('b')
    x(true)
    expect(testNode.innerText).toEqual('a')
  })

  it('elseif after if condition', function () {
    testNode.innerHTML = "<i data-bind='if: x'>a</i>" + '<!-- ko elseif: y -->b<!-- /ko -->'
    let x = observable(false)
    let y = observable(false)
    applyBindings({ x: x, y: y }, testNode)
    expect(testNode.innerText).toEqual('')
    y(true)
    expect(testNode.innerText).toEqual('b')
    x(true)
    expect(testNode.innerText).toEqual('a')
  })

  it('elseif after if condition, initially true/true', function () {
    testNode.innerHTML =
      "<i data-bind='if: x'>a</i>" + '<!-- ko elseif: y -->b<!-- /ko -->' + '<!-- ko else -->c<!-- /ko -->'
    let x = observable(true)
    let y = observable(true)
    applyBindings({ x: x, y: y }, testNode)
    expect(testNode.innerText).toEqual('a')
    x(false)
    expect(testNode.innerText).toEqual('b')
    x(true)
    expect(testNode.innerText).toEqual('a')
    y(false)
    expect(testNode.innerText).toEqual('a')
    y(true)
    expect(testNode.innerText).toEqual('a')
    x(false)
    expect(testNode.innerText).toEqual('b')
    y(false)
    expect(testNode.innerText).toEqual('c')
  })

  it('elseif after if condition, initially true/false', function () {
    testNode.innerHTML =
      "<i data-bind='if: x'>a</i>" + '<!-- ko elseif: y -->b<!-- /ko -->' + '<!-- ko else -->c<!-- /ko -->'
    let x = observable(true)
    let y = observable(false)
    applyBindings({ x: x, y: y }, testNode)
    expect(testNode.innerText).toEqual('a')
    x(false)
    expect(testNode.innerText).toEqual('c')
    y(true)
    expect(testNode.innerText).toEqual('b')
    x(false)
    y(false)
    expect(testNode.innerText).toEqual('c')
    y(true)
    expect(testNode.innerText).toEqual('b')
    x(true)
    expect(testNode.innerText).toEqual('a')
  })

  it('elseif after if condition, initially false/true', function () {
    testNode.innerHTML = "<i data-bind='if: x'>a</i>" + '<!-- ko elseif: y -->b<!-- /ko -->'
    let x = observable(false)
    let y = observable(true)
    applyBindings({ x: x, y: y }, testNode)
    expect(testNode.innerText).toEqual('b')
    y(false)
    expect(testNode.innerText).toEqual('')
    x(true)
    expect(testNode.innerText).toEqual('a')
    y(false)
    expect(testNode.innerText).toEqual('a')
    x(false)
    y(true)
    expect(testNode.innerText).toEqual('b')
    y(false)
    expect(testNode.innerText).toEqual('')
    x(true)
    expect(testNode.innerText).toEqual('a')
  })

  it('elseif + else after if condition, initially false/false', function () {
    testNode.innerHTML =
      "<i data-bind='if: x'>a</i>" + '<!-- ko elseif: y -->b<!-- /ko -->' + '<!-- ko else -->z<!-- /ko -->'
    let x = observable(false)
    let y = observable(false)
    applyBindings({ x: x, y: y }, testNode)
    expect(testNode.innerText).toEqual('z')
    y(true)
    expect(testNode.innerText).toEqual('b')
    x(true)
    expect(testNode.innerText).toEqual('a')
    x(false)
    expect(testNode.innerText).toEqual('b')
    y(false)
    expect(testNode.innerText).toEqual('z')
    x(true)
    expect(testNode.innerText).toEqual('a')
  })

  it('else chaining after if condition', function () {
    testNode.innerHTML =
      "<div data-bind='if: x'>x</div>"
      + '<!-- ko elseif: y1 -->y1<!-- /ko -->'
      + '<!-- ko elseif: y2 -->y2<!-- /ko -->'
      + '<!-- ko elseif: y3 -->y3<!-- /ko -->'
      + '<!-- ko else -->else<!-- /ko -->'
    let x = observable(false)
    let y1 = observable(false)
    let y2 = observable(false)
    let y3 = observable(false)
    applyBindings({ x: x, y1: y1, y2: y2, y3: y3 }, testNode)
    expect(testNode.innerText).toEqual('else')
    y3(true)
    expect(testNode.innerText).toEqual('y3')
    y2(true)
    expect(testNode.innerText).toEqual('y2')
    y1(true)
    expect(testNode.innerText).toEqual('y1')
    x(true)
    expect(testNode.innerText).toEqual('x')
    x(false)
    expect(testNode.innerText).toEqual('y1')
    y1(false)
    expect(testNode.innerText).toEqual('y2')
    y2(false)
    expect(testNode.innerText).toEqual('y3')
    y3(false)
    expect(testNode.innerText).toEqual('else')
  })

  it('ends the if-chain', function () {
    testNode.innerHTML =
      '<!-- ko if: x -->x<!-- /ko -->' + '<!-- ko else -->!X<!-- /ko -->' + '<!-- ko if: y -->y<!-- /ko -->'
    let x = observable(false)
    let y = observable(false)
    applyBindings({ x: x, y: y }, testNode)
    expect(testNode.innerText).toEqual('!X')
    y(true)
    expect(testNode.innerText).toEqual('!Xy')
    x(true)
    expect(testNode.innerText).toEqual('xy')
    y(false)
    expect(testNode.innerText).toEqual('x')
  })
})
