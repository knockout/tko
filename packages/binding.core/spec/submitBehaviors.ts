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

  it('Should throw when the bound value is not a function', function () {
    testNode.innerHTML = '<form data-bind=\'submit: "not a function"\' />'
    expect(() => applyBindings({}, testNode)).to.throw(/value for a submit binding must be a function/)
  })

  it('Should not prevent the default form submission when the handler returns true', function () {
    testNode.innerHTML = "<form data-bind='submit: doCall' />"
    const handler = function () {
      return true
    }
    applyBindings({ doCall: handler }, testNode)
    const formNode = testNode.children[0] as HTMLFormElement
    let defaultPrevented: boolean | undefined
    formNode.addEventListener('submit', function (event) {
      defaultPrevented = event.defaultPrevented
      // stop the actual form navigation in case preventDefault was skipped
      event.preventDefault()
    })
    triggerEvent(formNode, 'submit')
    expect(defaultPrevented).to.equal(false)
  })

  it('Should prevent the default form submission when the handler returns a non-true value', function () {
    testNode.innerHTML = "<form data-bind='submit: doCall' />"
    applyBindings({ doCall: function () {} }, testNode)
    const formNode = testNode.children[0] as HTMLFormElement
    let defaultPrevented: boolean | undefined
    formNode.addEventListener('submit', function (event) {
      defaultPrevented = event.defaultPrevented
      event.preventDefault()
    })
    triggerEvent(formNode, 'submit')
    expect(defaultPrevented).to.equal(true)
  })
})
