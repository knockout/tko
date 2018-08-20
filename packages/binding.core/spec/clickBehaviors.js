import {
    triggerEvent
} from '@tko/utils'

import {
    applyBindings
} from '@tko/bind'

import { DataBindProvider } from '@tko/provider.databind'

import {
    options
} from '@tko/utils'

import { bindings as coreBindings } from '../src'

import '@tko/utils/helpers/jasmine-13-helper.js'

describe('Binding: Click', function () {
    // This is just a special case of the "event" binding, so not necessary to respecify all its behaviours
  beforeEach(jasmine.prepareTestNode)

  beforeEach(function () {
    var provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it('Should invoke the supplied function on click, using model as \'this\' param and first arg, and event as second arg', function () {
    var model = {
      wasCalled: false,
      doCall: function (arg1, arg2) {
        this.wasCalled = true
        expect(arg1).toEqual(model)
        expect(arg2.type).toEqual('click')
      }
    }
    testNode.innerHTML = "<button data-bind='click:doCall'>hey</button>"
    applyBindings(model, testNode)
    triggerEvent(testNode.childNodes[0], 'click')
    expect(model.wasCalled).toEqual(true)
  })
})
