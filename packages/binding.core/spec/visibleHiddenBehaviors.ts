import { applyBindings } from '@tko/bind'
import { expect } from 'chai'

import { observable } from '@tko/observable'

import { DataBindProvider } from '@tko/provider.databind'

import { options } from '@tko/utils'

import { bindings as coreBindings } from '../dist'

import { prepareTestNode } from '../../utils/helpers/mocha-test-helpers'

describe('Binding: Visible', function () {
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = prepareTestNode()
  })

  beforeEach(function () {
    const provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it('Visible means the node only when the value is true', function () {
    const myObservable = observable(false)
    testNode.innerHTML = "<input data-bind='visible:myModelProperty()' />"
    applyBindings({ myModelProperty: myObservable }, testNode)

    const node = testNode.childNodes[0] as HTMLElement
    expect(node.style.display).to.equal('none')
    myObservable(true)
    expect(node.style.display).to.equal('')
  })

  it('Visible should unwrap observables implicitly', function () {
    const myObservable = observable(false)
    testNode.innerHTML = "<input data-bind='visible:myModelProperty' />"
    applyBindings({ myModelProperty: myObservable }, testNode)
    const node = testNode.childNodes[0] as HTMLElement
    expect(node.style.display).to.equal('none')
  })

  it('Hidden means the node is only visible when the value is false', function () {
    const myObservable = observable(false)
    testNode.innerHTML = "<input data-bind='hidden:myModelProperty()' />"
    applyBindings({ myModelProperty: myObservable }, testNode)

    const node = testNode.childNodes[0] as HTMLElement
    expect(node.style.display).to.equal('')
    myObservable(true)
    expect(node.style.display).to.equal('none')
  })

  it('Hidden should unwrap observables implicitly', function () {
    const myObservable = observable(true)
    testNode.innerHTML = "<input data-bind='hidden:myModelProperty' />"
    applyBindings({ myModelProperty: myObservable }, testNode)

    const node = testNode.childNodes[0] as HTMLElement
    expect(node.style.display).to.equal('none')
  })
})
