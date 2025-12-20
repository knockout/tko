import {
    applyBindings
} from '@tko/bind'

import {
    DataBindProvider
} from '@tko/provider.databind'

import {
    options
} from '@tko/utils'

import {bindings as coreBindings} from '../dist'

import '@tko/utils/helpers/jasmine-13-helper'

describe('Binding: Unique Name', function () {
  let testNode : HTMLElement
  beforeEach(function() { testNode = jasmine.prepareTestNode() })

  beforeEach(function () {
    let provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it('Should apply a different name to each element', function () {
    testNode.innerHTML = "<div data-bind='uniqueName: true'></div><div data-bind='uniqueName: true'></div>"
    applyBindings({}, testNode)

    expect((testNode.childNodes[0] as HTMLInputElement).name.length > 0).toEqual(true)
    expect((testNode.childNodes[1] as HTMLInputElement).name.length > 0).toEqual(true)
    expect((testNode.childNodes[0] as HTMLInputElement).name === (testNode.childNodes[1] as HTMLInputElement).name).toEqual(false)
  })
})
