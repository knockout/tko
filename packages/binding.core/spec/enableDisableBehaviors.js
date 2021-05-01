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

import { bindings as coreBindings } from '../dist'

import '@tko/utils/helpers/jasmine-13-helper.js'

describe('Binding: Enable/Disable', function () {
  beforeEach(jasmine.prepareTestNode)

  beforeEach(function () {
    var provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it('Enable means the node is enabled only when the value is true', function () {
    var myObservable = observable()
    testNode.innerHTML = "<input data-bind='enable:myModelProperty()' />"
    applyBindings({ myModelProperty: myObservable }, testNode)

    expect(testNode.childNodes[0].disabled).toEqual(true)
    myObservable(1)
    expect(testNode.childNodes[0].disabled).toEqual(false)
  })

  it('Disable means the node is enabled only when the value is false', function () {
    var myObservable = observable()
    testNode.innerHTML = "<input data-bind='disable:myModelProperty()' />"
    applyBindings({ myModelProperty: myObservable }, testNode)

    expect(testNode.childNodes[0].disabled).toEqual(false)
    myObservable(1)
    expect(testNode.childNodes[0].disabled).toEqual(true)
  })

  it('Enable should unwrap observables implicitly', function () {
    var myObservable = observable(false)
    testNode.innerHTML = "<input data-bind='enable:myModelProperty' />"
    applyBindings({ myModelProperty: myObservable }, testNode)
    expect(testNode.childNodes[0].disabled).toEqual(true)
  })

  it('Disable should unwrap observables implicitly', function () {
    var myObservable = observable(false)
    testNode.innerHTML = "<input data-bind='disable:myModelProperty' />"
    applyBindings({ myModelProperty: myObservable }, testNode)
    expect(testNode.childNodes[0].disabled).toEqual(false)
  })
})
