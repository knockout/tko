import { options, tasks, cleanNode } from '@tko/utils'

import { MultiProvider } from '@tko/provider.multi'
import { DataBindProvider } from '@tko/provider.databind'
import { VirtualProvider } from '@tko/provider.virtual'
import { ComponentProvider } from '@tko/provider.component'

import { applyBindings } from '@tko/bind'

import { bindings as coreBindings } from '@tko/binding.core'
import { bindings as templateBindings } from '@tko/binding.template'
import { bindings as ifBindings } from '@tko/binding.if'
import { bindings as componentBindings } from '@tko/binding.component'

import components from '../dist'
const { ComponentABC } = components

import { expect } from 'chai'
import sinon from 'sinon'
import { expectContainHtml, prepareTestNode, useMockForTasks } from '../../utils/helpers/mocha-test-helpers'

describe('ComponentABC', function () {
  let testComponentName = 'test-component',
    testComponentBindingValue,
    testComponentParams,
    outerViewModel
  let testNode: HTMLElement
  let clock: sinon.SinonFakeTimers
  let cleanups: Array<() => void>

  beforeEach(function () {
    cleanups = []
    clock = sinon.useFakeTimers()
    useMockForTasks(cleanups)
    testNode = prepareTestNode()
    testComponentParams = {}
    testComponentBindingValue = { name: testComponentName, params: testComponentParams }
    outerViewModel = { testComponentBindingValue: testComponentBindingValue, isOuterViewModel: true }
    testNode.innerHTML = '<div data-bind="component: testComponentBindingValue"></div>'

    const provider = new MultiProvider({
      providers: [new DataBindProvider(), new ComponentProvider(), new VirtualProvider()]
    })
    options.bindingProviderInstance = provider

    provider.bindingHandlers.set(templateBindings)
    provider.bindingHandlers.set(ifBindings)
    provider.bindingHandlers.set(coreBindings)
    provider.bindingHandlers.set(componentBindings)
  })

  afterEach(function () {
    expect(tasks.resetForTesting()).to.equal(0)
    while (cleanups.length) {
      cleanups.pop()!()
    }
    clock.restore()
    components.unregister(testComponentName)
  })

  it('registers without overloading (children-as-template mode)', function () {
    class CX extends ComponentABC {}
    expect(() => (CX as any).register()).to.not.throw()
  })

  it('registers when neither template nor element is overloaded (children-as-template mode)', function () {
    class CXTwo extends ComponentABC {
      customElementName() {
        return 'a-b'
      }
    }
    expect(() => (CXTwo as any).register()).to.not.throw()
  })

  it('uses the class name kebab-case elementName is not overloaded', function () {
    class CaaXbbb extends ComponentABC {
      template() {
        return 'a-b'
      }
    }
    ;(CaaXbbb as any).register()
    expect((CaaXbbb as any).customElementName).to.equal('caa-xbbb')
  })

  it('binds when registered like a normal component', function () {
    class CX extends ComponentABC {
      myvalue: string
      constructor(...args) {
        super(...args)
        this.myvalue = 'some parameter value'
      }
      static get customElementName() {
        return 'test-component'
      }
      static get template() {
        return '<div data-bind="text: myvalue"></div>'
      }
    }
    ;(CX as any).register()
    applyBindings(outerViewModel, testNode)
    clock.tick(1)

    expectContainHtml(
      testNode.childNodes[0] as HTMLElement,
      '<div data-bind="text: myvalue">some parameter value</div>'
    )
  })

  it('registers on the components', function () {
    class CX extends ComponentABC {
      myvalue: string
      constructor(...args) {
        super(...args)
        this.myvalue = 'some parameter value'
      }
      static get customElementName() {
        return 'test-component'
      }
      static get template() {
        return '<div data-bind="text: myvalue"></div>'
      }
    }
    ;(CX as any).register()
    expect(components._allRegisteredComponents['test-component'].viewModel).to.equal(CX)
  })

  it('respects the `element` property', function () {
    class CX extends ComponentABC {
      static get customElementName() {
        return 'test-component'
      }
      static get element() {
        const node = document.createElement('div')
        node.innerHTML = '<i>vid</i>'
        return node
      }
    }
    ;(CX as any).register()
    applyBindings(outerViewModel, testNode)
    clock.tick(1)

    expectContainHtml(testNode.childNodes[0] as HTMLElement, '<i>vid</i>')
  })

  it('disposes when the node is removed', function () {
    let disp = false
    class CX extends ComponentABC {
      dispose() {
        super.dispose()
        disp = true
      }
      static get customElementName() {
        return 'test-component'
      }
      static get template() {
        return '<i></i>'
      }
    }
    ;(CX as any).register()
    applyBindings(outerViewModel, testNode)
    cleanNode(testNode)
    expect(disp).to.equal(true)
  })
})
