import { applyBindings, contextFor } from '@tko/bind'

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

import '@tko/utils/helpers/jasmine-13-helper'

describe('Binding: Ifnot', function () {
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = jasmine.prepareTestNode()
  })

  beforeEach(function () {
    let provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
    provider.bindingHandlers.set(ifBindings)
  })

  it('Should remove descendant nodes from the document (and not bind them) if the value is truey', function () {
    testNode.innerHTML =
      "<div data-bind='ifnot: condition'><span data-bind='text: someItem.nonExistentChildProp'></span></div>"
    expect(testNode.childNodes[0].childNodes.length).toEqual(1)
    applyBindings({ someItem: null, condition: true }, testNode)
    expect(testNode.childNodes[0].childNodes.length).toEqual(0)
  })

  xit('Should leave descendant nodes in the document (and bind them) if the value is falsy, independently of the active template engine', function () {
    // this.after(function () { setTemplateEngine(new nativeTemplateEngine()) })
    // setTemplateEngine(new nativeTemplateEngine()) // This template engine will just throw errors if you try to use it
    // testNode.innerHTML = "<div data-bind='ifnot: condition'><span data-bind='text: someItem.existentChildProp'></span></div>"
    // expect(testNode.childNodes.length).toEqual(1)
    // applyBindings({ someItem: { existentChildProp: 'Child prop value' }, condition: false }, testNode)
    // expect(testNode.childNodes[0].childNodes.length).toEqual(1)
    // expect(testNode.childNodes[0].childNodes[0]).toContainText('Child prop value')
  })

  it('Should leave descendant nodes unchanged if the value is falsy and remains falsy when changed', function () {
    let someItem = observable(false)
    testNode.innerHTML = "<div data-bind='ifnot: someItem'><span data-bind='text: someItem()'></span></div>"
    let originalNode = testNode.childNodes[0].childNodes[0]

    // Value is initially true, so nodes are retained
    applyBindings({ someItem: someItem }, testNode)
    expect(testNode.childNodes[0].childNodes[0]).toContainText('false')
    expect(testNode.childNodes[0].childNodes[0]).toEqual(originalNode)

    // Change the value to a different falsy value
    someItem(0)
    expect(testNode.childNodes[0].childNodes[0]).toContainText('0')
    expect(testNode.childNodes[0].childNodes[0]).toEqual(originalNode)
  })

  it('Should toggle the presence and bindedness of descendant nodes according to the falsiness of the value', function () {
    let someItem = observable(undefined)
    let condition = observable(true)
    testNode.innerHTML =
      "<div data-bind='ifnot: condition'><span data-bind='text: someItem().occasionallyExistentChildProp'></span></div>"
    applyBindings({ someItem: someItem, condition: condition }, testNode)

    // First it's not there
    expect(testNode.childNodes[0].childNodes.length).toEqual(0)

    // Then it's there
    someItem({ occasionallyExistentChildProp: 'Child prop value' })
    condition(false)
    expect(testNode.childNodes[0].childNodes.length).toEqual(1)
    expect(testNode.childNodes[0].childNodes[0]).toContainText('Child prop value')

    // Then it's gone again
    condition(true)
    someItem(null)
    expect(testNode.childNodes[0].childNodes.length).toEqual(0)
  })

  it('Should not interfere with binding context', function () {
    testNode.innerHTML = "<div data-bind='ifnot: false'>Parents: <span data-bind='text: $parents.length'></span></div>"
    applyBindings({}, testNode)
    expect(testNode.childNodes[0]).toContainText('Parents: 0')
    expect(contextFor(testNode.childNodes[0].childNodes[1]).$parents.length).toEqual(0)
  })

  it('Should call a childrenComplete callback function', function () {
    testNode.innerHTML =
      "<div data-bind='ifnot: condition, childrenComplete: callback'><span data-bind='text: someText'></span></div>"
    let someItem = observable({ childprop: 'child' }),
      callbacks = 0
    let viewModel = {
      condition: observable(false),
      someText: 'hello',
      callback: function () {
        callbacks++
      }
    }
    applyBindings(viewModel, testNode)
    expect(callbacks).toEqual(1)
    expect(testNode.childNodes[0]).toContainText('hello')

    viewModel.condition(true)
    expect(callbacks).toEqual(1)
    expect(testNode.childNodes[0].childNodes.length).toEqual(0)

    viewModel.condition(false)
    expect(callbacks).toEqual(2)
    expect(testNode.childNodes[0]).toContainText('hello')
  })
})
