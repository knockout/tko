import {
  options, tasks, domData, triggerEvent, cleanNode
} from 'tko.utils'

import {
  observableArray, observable, isWritableObservable
} from 'tko.observable'

import { MultiProvider } from 'tko.provider.multi'
import { DataBindProvider } from 'tko.provider.databind'
import { VirtualProvider } from 'tko.provider.virtual'
import { ComponentProvider } from 'tko.provider.component'

import {
  applyBindings, dataFor
} from 'tko.bind'

import { bindings as coreBindings } from 'tko.binding.core'
import { bindings as templateBindings } from 'tko.binding.template'
import { bindings as ifBindings } from 'tko.binding.if'
import { bindings as componentBindings } from 'tko.binding.component'

import components from '../src'

import {
  useMockForTasks
} from 'tko.utils/helpers/jasmine-13-helper.js'

const {ComponentJJJ} = components

describe('ComponentJJJ', function () {
  var testComponentName = 'test-component',
    testComponentBindingValue,
    testComponentParams,
    outerViewModel

  beforeEach(function () {
    useMockForTasks(options)
    jasmine.prepareTestNode()
    testComponentParams = {}
    testComponentBindingValue = { name: testComponentName, params: testComponentParams }
    outerViewModel = { teestComponentBindingValue: testComponentBindingValue, isOuterViewModel: true }
    testNode.innerHTML = '<div data-bind="component: testComponentBindingValue"></div>'

    var provider = new MultiProvider({
      providers: [
        new DataBindProvider(),
        new ComponentProvider(),
        new VirtualProvider()
      ]
    })
    options.bindingProviderInstance = provider

    provider.bindingHandlers.set(templateBindings)
    provider.bindingHandlers.set(ifBindings)
    provider.bindingHandlers.set(coreBindings)
    provider.bindingHandlers.set(componentBindings)
  })

  afterEach(function () {
    expect(tasks.resetForTesting()).toEqual(0)
    jasmine.Clock.reset()
    components.unregister(testComponentName)
  })

  describe('jss', function () {
    it('creates and attaches a sheet', () => {
      class JSX extends ComponentABC {
        jss () {
          return { 'my-button': { color: pink } }
        }
      }
      const j = new JSX()
      expect(j.css).toContain('my-button')
    })
  })
})
