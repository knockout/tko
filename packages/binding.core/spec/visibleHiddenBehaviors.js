import {
    applyBindings
} from '@tko/bind'

import {
    observable
} from '@tko/observable'

import { DataBindProvider } from '@tko/provider.databind'

import {
    options
} from '@tko/utils'

import {
    bindings as coreBindings
} from '../dist'

import '@tko/utils/helpers/jasmine-13-helper'

describe('Binding: Visible', function () {
  beforeEach(jasmine.prepareTestNode)

  beforeEach(function () {
    var provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it('Visible means the node only when the value is true', function () {
    var myObservable = observable(false)
    testNode.innerHTML = "<input data-bind='visible:myModelProperty()' />"
    applyBindings({
      myModelProperty: myObservable
    }, testNode)

    expect(testNode.childNodes[0].style.display).toEqual('none')
    myObservable(true)
    expect(testNode.childNodes[0].style.display).toEqual('')
  })

  it('Visible should unwrap observables implicitly', function () {
    var myObservable = observable(false)
    testNode.innerHTML = "<input data-bind='visible:myModelProperty' />"
    applyBindings({
      myModelProperty: myObservable
    }, testNode)
    expect(testNode.childNodes[0].style.display).toEqual('none')
  })

  it('Hidden means the node is only visible when the value is false', function () {
    var myObservable = observable(false)
    testNode.innerHTML = "<input data-bind='hidden:myModelProperty()' />"
    applyBindings({
      myModelProperty: myObservable
    }, testNode)

    expect(testNode.childNodes[0].style.display).toEqual('')
    myObservable(true)
    expect(testNode.childNodes[0].style.display).toEqual('none')
  })

  it('Hidden should unwrap observables implicitly', function () {
    var myObservable = observable(true)
    testNode.innerHTML = "<input data-bind='hidden:myModelProperty' />"
    applyBindings({
      myModelProperty: myObservable
    }, testNode)
    expect(testNode.childNodes[0].style.display).toEqual('none')
  })
})
