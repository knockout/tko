import { triggerEvent, options } from '@tko/utils'

import { applyBindings } from '@tko/bind'
import { expect } from 'chai'

import { DataBindProvider } from '@tko/provider.databind'

import { bindings as coreBindings } from '../dist'

import { prepareTestNode } from '../../utils/helpers/mocha-test-helpers'

describe('Binding: Click', function () {
  // This is just a special case of the "event" binding, so not necessary to respecify all its behaviors
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = prepareTestNode()
  })

  beforeEach(function () {
    const provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it("Should invoke the supplied function on click, using model as 'this' param and first arg, and event as second arg", function () {
    const model = {
      wasCalled: false,
      doCall: function (arg1, arg2) {
        this.wasCalled = true
        expect(arg1).to.equal(model)
        expect(arg2.type).to.equal('click')
      }
    }
    testNode.innerHTML = "<button data-bind='click:doCall'>hey</button>"
    applyBindings(model, testNode)
    triggerEvent(testNode.children[0], 'click')
    expect(model.wasCalled).to.equal(true)
  })
})
