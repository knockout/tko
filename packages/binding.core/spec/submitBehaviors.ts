import { applyBindings } from '@tko/bind'
import { expect } from 'chai'

import { triggerEvent } from '@tko/utils'

import { DataBindProvider } from '@tko/provider.databind'

import { options } from '@tko/utils'

import { bindings as coreBindings } from '../dist'

import { prepareTestNode } from '../../utils/helpers/mocha-test-helpers'

describe('Binding: Submit', function () {
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = prepareTestNode()
  })

  beforeEach(function () {
    const provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it("Should invoke the supplied function on submit and prevent default action, using model as 'this' param and the form node as a param to the handler", function () {
    let firstParamStored
    const model = {
      wasCalled: false,
      doCall: function (firstParam) {
        this.wasCalled = true
        firstParamStored = firstParam
      }
    }
    testNode.innerHTML = "<form data-bind='submit:doCall' />"
    const formNode = testNode.childNodes[0]
    applyBindings(model, testNode)
    triggerEvent(testNode.children[0], 'submit')
    expect(model.wasCalled).to.equal(true)
    expect(firstParamStored).to.equal(formNode)
  })
})
