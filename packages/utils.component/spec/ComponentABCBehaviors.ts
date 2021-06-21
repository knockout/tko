import {
    options, tasks, cleanNode
} from '@tko/utils'

import { MultiProvider } from '@tko/provider.multi'
import { DataBindProvider } from '@tko/provider.databind'
import { VirtualProvider } from '@tko/provider.virtual'
import { ComponentProvider } from '@tko/provider.component'

import {
    applyBindings, dataFor
} from '@tko/bind'

import { bindings as coreBindings } from '@tko/binding.core'
import { bindings as templateBindings } from '@tko/binding.template'
import { bindings as ifBindings } from '@tko/binding.if'
import { bindings as componentBindings } from '@tko/binding.component'

import components from '../dist'
const {ComponentABC} = components

import {
    useMockForTasks
} from '@tko/utils/helpers/jasmine-13-helper.js'

describe('ComponentABC', function () {
  var testComponentName = 'test-component',
    testComponentBindingValue,
    testComponentParams,
    outerViewModel

  beforeEach(function () {
    useMockForTasks(options)
    jasmine.prepareTestNode()
    testComponentParams = {}
    testComponentBindingValue = { name: testComponentName, params: testComponentParams }
    outerViewModel = { testComponentBindingValue: testComponentBindingValue, isOuterViewModel: true }
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

  it("throws when there's no overloading", function () {
    class CX extends ComponentABC {}
    expect(() => CX.register()).toThrowContaining('overload')
  })

  it('throws when template or element is not overloaded', function () {
    class CX extends ComponentABC {
      customElementName () { return 'a-b' }
    }
    expect(() => CX.register()).toThrowContaining('overload')
  })

  it('uses the class name kebab-case elementName is not overloaded', function () {
    class CaaXbbb extends ComponentABC {
      template () { return 'a-b' }
    }
    CaaXbbb.register()
    expect(CaaXbbb.customElementName).toEqual('caa-xbbb')
  })

  it('binds when registered like a normal component', function () {
    class CX extends ComponentABC {
      constructor (...args) {
        super(...args)
        this.myvalue = 'some parameter value'
      }
      static get customElementName () { return 'test-component' }
      static get template () { return '<div data-bind="text: myvalue"></div>' }
		}
    CX.register()
    applyBindings(outerViewModel, testNode)
    jasmine.Clock.tick(1)

    expect(testNode.childNodes[0])
        	.toContainHtml('<div data-bind="text: myvalue">some parameter value</div>')
  })

  it('registers on the components', function () {
    class CX extends ComponentABC {
      constructor (...args) {
        super(...args)
        this.myvalue = 'some parameter value'
      }
      static get customElementName () { return 'test-component' }
      static get template () { return '<div data-bind="text: myvalue"></div>' }
        }
    CX.register()
    expect(components._allRegisteredComponents['test-component'].viewModel)
            .toEqual(CX)
  })

  it('respects the `element` property', function () {
    class CX extends ComponentABC {
      static get customElementName () { return 'test-component' }
      static get element () {
        const node = document.createElement('div')
        node.innerHTML = '<i>vid</i>'
        return node
      }
        }
    CX.register()
    applyBindings(outerViewModel, testNode)
    jasmine.Clock.tick(1)

    expect(testNode.childNodes[0])
            .toContainHtml('<i>vid</i>')
  })

  it('disposes when the node is removed', function () {
    var disp = false
    class CX extends ComponentABC {
      dispose () {
        super.dispose()
        disp = true
      }
      static get customElementName () { return 'test-component' }
      static get template () { return '<i></i>' }
        }
    CX.register()
    applyBindings(outerViewModel, testNode)
    cleanNode(testNode)
    expect(disp).toEqual(true)
  })

})
