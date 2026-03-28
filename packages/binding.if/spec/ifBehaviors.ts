/* globals testNode */
import { applyBindings, contextFor } from '@tko/bind'
import { expect } from 'chai'

import { observable } from '@tko/observable'

import { DataBindProvider } from '@tko/provider.databind'
import { MultiProvider } from '@tko/provider.multi'
import { VirtualProvider } from '@tko/provider.virtual'

import { options } from '@tko/utils'

import {
  bindings as ifBindings
  // setTemplateEngine,
  // templateEngine,
  // nativeTemplateEngine
} from '../dist'

import { bindings as coreBindings } from '@tko/binding.core'

import { expectContainHtml, expectContainText, prepareTestNode } from '../../utils/helpers/mocha-test-helpers'

describe('Binding: If', function () {
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

  it('Should remove descendant nodes from the document (and not bind them) if the value is falsy', function () {
    testNode.innerHTML =
      "<div data-bind='if: someItem'><span data-bind='text: someItem.nonExistentChildProp'></span></div>"
    expect(testNode.childNodes[0].childNodes.length).to.equal(1)
    applyBindings({ someItem: null }, testNode)
    expect(testNode.childNodes[0].childNodes.length).to.equal(0)
  })

  xit('Should leave descendant nodes in the document (and bind them) if the value is truthy, independently of the active template engine', function () {
    // this.after(function () { setTemplateEngine(new nativeTemplateEngine()) })
    // setTemplateEngine(new nativeTemplateEngine()) // This template engine will just throw errors if you try to use it
    // testNode.innerHTML = "<div data-bind='if: someItem'><span data-bind='text: someItem.existentChildProp'></span></div>"
    // expect(testNode.childNodes.length).toEqual(1)
    // applyBindings({ someItem: { existentChildProp: 'Child prop value' } }, testNode)
    // expect(testNode.childNodes[0].childNodes.length).toEqual(1)
    // expect(testNode.childNodes[0].childNodes[0]).toContainText('Child prop value')
  })

  it('Should leave descendant nodes unchanged if the value is truthy and remains truthy when changed', function () {
    const someItem = observable(true)
    testNode.innerHTML = "<div data-bind='if: someItem'><span data-bind='text: ++counter'></span></div>"
    const originalNode = testNode.childNodes[0].childNodes[0]

    applyBindings({ someItem, counter: 0 }, testNode)
    expect((testNode.childNodes[0].childNodes[0] as HTMLElement).tagName.toLowerCase()).to.equal('span')
    expect(testNode.childNodes[0].childNodes[0]).to.equal(originalNode)
    expectContainText(testNode, '1')

    someItem('different truthy value')
    expect((testNode.childNodes[0].childNodes[0] as HTMLElement).tagName.toLowerCase()).to.equal('span')
    expect(testNode.childNodes[0].childNodes[0]).to.equal(originalNode)
    expectContainText(testNode, '1')
  })

  it('Should toggle the presence and bindedness of descendant nodes according to the truthiness of the value', function () {
    const someItem = observable(undefined)
    testNode.innerHTML =
      "<div data-bind='if: someItem'><span data-bind='text: someItem().occasionallyExistentChildProp'></span></div>"
    applyBindings({ someItem }, testNode)

    expect(testNode.childNodes[0].childNodes.length).to.equal(0)

    someItem({ occasionallyExistentChildProp: 'Child prop value' })
    expect(testNode.childNodes[0].childNodes.length).to.equal(1)
    expectContainText(testNode.childNodes[0].childNodes[0], 'Child prop value')

    someItem(null)
    expect(testNode.childNodes[0].childNodes.length).to.equal(0)
  })

  it('Should not interfere with binding context', function () {
    testNode.innerHTML = "<div data-bind='if: true'>Parents: <span data-bind='text: $parents.length'></span></div>"
    applyBindings({}, testNode)
    expectContainText(testNode.childNodes[0], 'Parents: 0')
    expect(contextFor(testNode.childNodes[0].childNodes[1]).$parents.length).to.equal(0)
  })

  it('Should be able to define an "if" region using a containerless template', function () {
    const someitem = observable(undefined)
    testNode.innerHTML =
      'hello <!-- ko if: someitem --><span data-bind="text: someitem().occasionallyexistentchildprop"></span><!-- /ko --> goodbye'
    applyBindings({ someitem }, testNode)

    expectContainHtml(testNode, 'hello <!-- ko if: someitem --><!-- /ko --> goodbye')

    someitem({ occasionallyexistentchildprop: 'child prop value' })
    expectContainHtml(
      testNode,
      'hello <!-- ko if: someitem --><span data-bind="text: someitem().occasionallyexistentchildprop">child prop value</span><!-- /ko --> goodbye'
    )

    someitem(null)
    expectContainHtml(testNode, 'hello <!-- ko if: someitem --><!-- /ko --> goodbye')
  })

  it('Should be able to nest "if" regions defined by containerless templates', function () {
    const condition1 = observable(false)
    const condition2 = observable(false)
    testNode.innerHTML =
      'hello <!-- ko if: condition1 -->First is true<!-- ko if: condition2 -->Both are true<!-- /ko --><!-- /ko -->'
    applyBindings({ condition1: condition1, condition2: condition2 }, testNode)

    expectContainHtml(testNode, 'hello <!-- ko if: condition1 --><!-- /ko -->')

    condition1(true)
    expectContainHtml(
      testNode,
      'hello <!-- ko if: condition1 -->first is true<!-- ko if: condition2 --><!-- /ko --><!-- /ko -->'
    )

    condition2(true)
    expectContainHtml(
      testNode,
      'hello <!-- ko if: condition1 -->first is true<!-- ko if: condition2 -->both are true<!-- /ko --><!-- /ko -->'
    )
  })

  it('Should call a childrenComplete callback function', function () {
    testNode.innerHTML =
      "<div data-bind='if: condition, childrenComplete: callback'><span data-bind='text: someText'></span></div>"
    let callbacks = 0
    const viewModel = {
      condition: observable(true),
      someText: 'hello',
      callback: function () {
        callbacks++
      }
    }
    applyBindings(viewModel, testNode)
    expect(callbacks).to.equal(1)
    expectContainText(testNode.childNodes[0], 'hello')

    viewModel.condition(false)
    expect(callbacks).to.equal(1)
    expect(testNode.childNodes[0].childNodes.length).to.equal(0)

    viewModel.condition(true)
    expect(callbacks).to.equal(2)
    expectContainText(testNode.childNodes[0], 'hello')
  })
})
