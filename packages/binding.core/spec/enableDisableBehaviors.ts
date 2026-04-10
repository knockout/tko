import { applyBindings } from '@tko/bind'
import { expect } from 'chai'

import { observable } from '@tko/observable'

import { DataBindProvider } from '@tko/provider.databind'

import { options } from '@tko/utils'

import { bindings as coreBindings } from '../dist'

import { prepareTestNode } from '../../utils/helpers/mocha-test-helpers'

describe('Binding: Enable/Disable', function () {
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = prepareTestNode()
  })

  beforeEach(function () {
    const provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it('Enable means the node is enabled only when the value is true', function () {
    const myObservable = observable()
    testNode.innerHTML = "<input data-bind='enable:myModelProperty()' />"
    applyBindings({ myModelProperty: myObservable }, testNode)
    const input = testNode.children[0] as HTMLInputElement
    expect(input.disabled).to.equal(true)
    myObservable(1)
    expect(input.disabled).to.equal(false)
  })

  it('Disable means the node is enabled only when the value is false', function () {
    const myObservable = observable()
    testNode.innerHTML = "<input data-bind='disable:myModelProperty()' />"
    applyBindings({ myModelProperty: myObservable }, testNode)

    const input = testNode.children[0] as HTMLInputElement
    expect(input.disabled).to.equal(false)
    myObservable(1)
    expect(input.disabled).to.equal(true)
  })

  it('Enable should unwrap observables implicitly', function () {
    const myObservable = observable(false)
    testNode.innerHTML = "<input data-bind='enable:myModelProperty' />"
    applyBindings({ myModelProperty: myObservable }, testNode)

    const input = testNode.children[0] as HTMLInputElement
    expect(input.disabled).to.equal(true)
  })

  it('Disable should unwrap observables implicitly', function () {
    const myObservable = observable(false)
    testNode.innerHTML = "<input data-bind='disable:myModelProperty' />"
    applyBindings({ myModelProperty: myObservable }, testNode)

    const input = testNode.children[0] as HTMLInputElement
    expect(input.disabled).to.equal(false)
  })
})
