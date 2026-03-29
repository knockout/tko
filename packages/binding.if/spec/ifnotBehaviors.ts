import { applyBindings, contextFor } from '@tko/bind'
import { expect } from 'chai'

import { observable } from '@tko/observable'

import { DataBindProvider } from '@tko/provider.databind'

import { options } from '@tko/utils'

import {
  bindings as ifBindings
  // setTemplateEngine,
  // templateEngine,
  // nativeTemplateEngine
} from '../dist'

import { bindings as coreBindings } from '@tko/binding.core'

import { expectContainText, prepareTestNode } from '../../utils/helpers/mocha-test-helpers'

describe('Binding: Ifnot', function () {
  let testNode: HTMLElement

  beforeEach(function () {
    testNode = prepareTestNode()
  })

  beforeEach(function () {
    const provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
    provider.bindingHandlers.set(ifBindings)
  })

  it('Should remove descendant nodes from the document (and not bind them) if the value is truey', function () {
    testNode.innerHTML =
      "<div data-bind='ifnot: condition'><span data-bind='text: someItem.nonExistentChildProp'></span></div>"
    expect(testNode.childNodes[0].childNodes.length).to.equal(1)
    applyBindings({ someItem: null, condition: true }, testNode)
    expect(testNode.childNodes[0].childNodes.length).to.equal(0)
  })

  it.skip('Should leave descendant nodes in the document (and bind them) if the value is falsy, independently of the active template engine', function () {
    // this.after(function () { setTemplateEngine(new nativeTemplateEngine()) })
    // setTemplateEngine(new nativeTemplateEngine()) // This template engine will just throw errors if you try to use it
    // testNode.innerHTML = "<div data-bind='ifnot: condition'><span data-bind='text: someItem.existentChildProp'></span></div>"
    // expect(testNode.childNodes.length).toEqual(1)
    // applyBindings({ someItem: { existentChildProp: 'Child prop value' }, condition: false }, testNode)
    // expect(testNode.childNodes[0].childNodes.length).toEqual(1)
    // expect(testNode.childNodes[0].childNodes[0]).toContainText('Child prop value')
  })

  it('Should leave descendant nodes unchanged if the value is falsy and remains falsy when changed', function () {
    const someItem = observable(false)
    testNode.innerHTML = "<div data-bind='ifnot: someItem'><span data-bind='text: someItem()'></span></div>"
    const originalNode = testNode.childNodes[0].childNodes[0]

    applyBindings({ someItem: someItem }, testNode)
    expectContainText(testNode.childNodes[0].childNodes[0], 'false')
    expect(testNode.childNodes[0].childNodes[0]).to.equal(originalNode)

    someItem(0)
    expectContainText(testNode.childNodes[0].childNodes[0], '0')
    expect(testNode.childNodes[0].childNodes[0]).to.equal(originalNode)
  })

  it('Should toggle the presence and bindedness of descendant nodes according to the falsiness of the value', function () {
    const someItem = observable(undefined)
    const condition = observable(true)
    testNode.innerHTML =
      "<div data-bind='ifnot: condition'><span data-bind='text: someItem().occasionallyExistentChildProp'></span></div>"
    applyBindings({ someItem: someItem, condition: condition }, testNode)

    expect(testNode.childNodes[0].childNodes.length).to.equal(0)

    someItem({ occasionallyExistentChildProp: 'Child prop value' })
    condition(false)
    expect(testNode.childNodes[0].childNodes.length).to.equal(1)
    expectContainText(testNode.childNodes[0].childNodes[0], 'Child prop value')

    condition(true)
    someItem(null)
    expect(testNode.childNodes[0].childNodes.length).to.equal(0)
  })

  it('Should not interfere with binding context', function () {
    testNode.innerHTML = "<div data-bind='ifnot: false'>Parents: <span data-bind='text: $parents.length'></span></div>"
    applyBindings({}, testNode)
    expectContainText(testNode.childNodes[0], 'Parents: 0')
    expect(contextFor(testNode.childNodes[0].childNodes[1]).$parents.length).to.equal(0)
  })

  it('Should call a childrenComplete callback function', function () {
    testNode.innerHTML =
      "<div data-bind='ifnot: condition, childrenComplete: callback'><span data-bind='text: someText'></span></div>"
    let callbacks = 0
    const viewModel = {
      condition: observable(false),
      someText: 'hello',
      callback: function () {
        callbacks++
      }
    }
    applyBindings(viewModel, testNode)
    expect(callbacks).to.equal(1)
    expectContainText(testNode.childNodes[0], 'hello')

    viewModel.condition(true)
    expect(callbacks).to.equal(1)
    expect(testNode.childNodes[0].childNodes.length).to.equal(0)

    viewModel.condition(false)
    expect(callbacks).to.equal(2)
    expectContainText(testNode.childNodes[0], 'hello')
  })
})
