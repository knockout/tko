import { applyBindings } from '@tko/bind'

import { observable } from '@tko/observable'

import { DataBindProvider } from '@tko/provider.databind'

import { options } from '@tko/utils'

import { bindings as coreBindings } from '../dist'

import '@tko/utils/helpers/jasmine-13-helper'

describe('Binding: Visible', function () {
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = jasmine.prepareTestNode()
  })

  beforeEach(function () {
    let provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it('Visible means the node only when the value is true', function () {
    let myObservable = observable(false)
    testNode.innerHTML = "<input data-bind='visible:myModelProperty()' />"
    applyBindings({ myModelProperty: myObservable }, testNode)

    let node = testNode.childNodes[0] as HTMLElement
    expect(node.style.display).toEqual('none')
    myObservable(true)
    expect(node.style.display).toEqual('')
  })

  it('Visible should unwrap observables implicitly', function () {
    let myObservable = observable(false)
    testNode.innerHTML = "<input data-bind='visible:myModelProperty' />"
    applyBindings({ myModelProperty: myObservable }, testNode)
    let node = testNode.childNodes[0] as HTMLElement
    expect(node.style.display).toEqual('none')
  })

  it('Hidden means the node is only visible when the value is false', function () {
    let myObservable = observable(false)
    testNode.innerHTML = "<input data-bind='hidden:myModelProperty()' />"
    applyBindings({ myModelProperty: myObservable }, testNode)

    let node = testNode.childNodes[0] as HTMLElement
    expect(node.style.display).toEqual('')
    myObservable(true)
    expect(node.style.display).toEqual('none')
  })

  it('Hidden should unwrap observables implicitly', function () {
    let myObservable = observable(true)
    testNode.innerHTML = "<input data-bind='hidden:myModelProperty' />"
    applyBindings({ myModelProperty: myObservable }, testNode)

    let node = testNode.childNodes[0] as HTMLElement
    expect(node.style.display).toEqual('none')
  })
})
