import { applyBindings } from '@tko/bind'

import { observable } from '@tko/observable'

import { DataBindProvider } from '@tko/provider.databind'

import { options } from '@tko/utils'

import { bindings as coreBindings } from '../dist'

import { expectContainText, prepareTestNode } from '../../utils/helpers/mocha-test-helpers'

describe('Binding: Let', function () {
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = prepareTestNode()
  })

  beforeEach(function () {
    const provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it('Should be able to add custom properties that will be available to all child contexts', function () {
    testNode.innerHTML =
      "<div data-bind=\"let: { '$customProp': 'my value' }\"><div data-bind='with: true'><div data-bind='text: $customProp'></div></div></div>"
    applyBindings(null, testNode)
    expectContainText(testNode, 'my value')
  })

  it('Should update all child contexts when custom properties are updated', function () {
    const observable1 = observable(1)
    testNode.innerHTML = "<div data-bind='let: { prop1 : prop()*2 }'><div data-bind='text: prop1'></div></div>"
    applyBindings({ prop: observable1 }, testNode)
    expectContainText(testNode, '2')

    // change observable
    observable1(2)
    expectContainText(testNode, '4')
  })

  it('Should update all custom properties when the parent context is updated', function () {
    testNode.innerHTML =
      "<div data-bind='let: {obj1: $data}'><span data-bind='text:obj1.prop1'></span><span data-bind='text:prop2'></span></div>"
    const vm = observable({ prop1: 'First ', prop2: 'view model' })
    applyBindings(vm, testNode)
    expectContainText(testNode, 'First view model')

    // change view model to new object
    vm({ prop1: 'Second view ', prop2: 'model' })
    expectContainText(testNode, 'Second view model')

    // change it again
    vm({ prop1: 'Third view model', prop2: '' })
    expectContainText(testNode, 'Third view model')
  })
})
