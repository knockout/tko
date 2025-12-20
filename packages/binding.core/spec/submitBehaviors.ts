import {
    applyBindings
} from '@tko/bind'

import {
    triggerEvent
} from '@tko/utils'

import {
    DataBindProvider
} from '@tko/provider.databind'

import {
    options
} from '@tko/utils'

import {bindings as coreBindings} from '../dist'

import '@tko/utils/helpers/jasmine-13-helper'

describe('Binding: Submit', function () {
  let testNode : HTMLElement
  beforeEach(function() { testNode = jasmine.prepareTestNode() })

  beforeEach(function () {
    let provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it('Should invoke the supplied function on submit and prevent default action, using model as \'this\' param and the form node as a param to the handler', function () {
    let firstParamStored
    let model = { wasCalled: false, doCall: function (firstParam) { this.wasCalled = true; firstParamStored = firstParam } }
    testNode.innerHTML = "<form data-bind='submit:doCall' />"
    let formNode = testNode.childNodes[0]
    applyBindings(model, testNode)
    triggerEvent(testNode.children[0], 'submit')
    expect(model.wasCalled).toEqual(true)
    expect(firstParamStored).toEqual(formNode)
  })
})
