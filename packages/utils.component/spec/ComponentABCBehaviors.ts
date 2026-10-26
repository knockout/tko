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

import components, { ComponentABC } from '@tko/utils.component'

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
    expect(() => CX.register()).to.not.throw()
  })

  it('registers when neither template nor element is overloaded (children-as-template mode)', function () {
    class CXTwo extends ComponentABC {
      static override get customElementName() {
        return 'a-b'
      }
    }
    expect(() => CXTwo.register()).to.not.throw()
  })

  it('uses the class name kebab-case elementName is not overloaded', function () {
    class CaaXbbb extends ComponentABC {
      template() {
        return 'a-b'
      }
    }
    CaaXbbb.register()
    expect(CaaXbbb.customElementName).to.equal('caa-xbbb')
  })

  it('binds when registered like a normal component', function () {
    class CX extends ComponentABC {
      myvalue = 'some parameter value'
      static override get customElementName() {
        return 'test-component'
      }
      static override get template() {
        return '<div data-bind="text: myvalue"></div>'
      }
    }
    CX.register()
    applyBindings(outerViewModel, testNode)
    clock.tick(1)

    expectContainHtml(
      testNode.childNodes[0] as HTMLElement,
      '<div data-bind="text: myvalue">some parameter value</div>'
    )
  })

  it('registers on the components', function () {
    class CX extends ComponentABC {
      myvalue = 'some parameter value'
      static override get customElementName() {
        return 'test-component'
      }
      static override get template() {
        return '<div data-bind="text: myvalue"></div>'
      }
    }
    CX.register()
    expect(components._allRegisteredComponents['test-component'].viewModel).to.equal(CX)
  })

  it('respects the `element` property', function () {
    class CX extends ComponentABC {
      static override get customElementName() {
        return 'test-component'
      }
      static override get element() {
        const node = document.createElement('div')
        node.innerHTML = '<i>vid</i>'
        return node
      }
    }
    CX.register()
    applyBindings(outerViewModel, testNode)
    clock.tick(1)

    expectContainHtml(testNode.childNodes[0] as HTMLElement, '<i>vid</i>')
  })

  it('uses <template id="$componentName"> as a shared fallback across instances', function () {
    const tpl = document.createElement('template')
    tpl.id = 'test-component'
    tpl.innerHTML = '<span class="shared" data-bind="text: msg"></span>'
    document.body.appendChild(tpl)
    cleanups.push(() => tpl.remove())

    class CX extends ComponentABC {
      msg = 'from-shared'
      static override get customElementName() {
        return 'test-component'
      }
    }
    CX.register()

    testNode.innerHTML = '<test-component></test-component><test-component></test-component>'
    applyBindings(outerViewModel, testNode)
    clock.tick(1)

    const spans = testNode.querySelectorAll('.shared')
    expect(spans.length).to.equal(2)
    expect(spans[0].textContent).to.equal('from-shared')
    expect(spans[1].textContent).to.equal('from-shared')
  })

  it('falls back to children-as-template when no matching <template id> exists', function () {
    class CX extends ComponentABC {
      msg = 'from-children'
      static override get customElementName() {
        return 'test-component'
      }
    }
    CX.register()

    testNode.innerHTML = '<test-component><span class="inline" data-bind="text: msg"></span></test-component>'
    applyBindings(outerViewModel, testNode)
    clock.tick(1)

    const rendered = testNode.querySelector('.inline')
    expect(rendered).to.not.equal(null)
    expect(rendered!.textContent).to.equal('from-children')
  })

  it('instance children win over the shared <template id> default', function () {
    const tpl = document.createElement('template')
    tpl.id = 'test-component'
    tpl.innerHTML = '<span class="shared" data-bind="text: msg"></span>'
    document.body.appendChild(tpl)
    cleanups.push(() => tpl.remove())

    class CX extends ComponentABC {
      msg = 'vm-msg'
      static override get customElementName() {
        return 'test-component'
      }
    }
    CX.register()

    testNode.innerHTML =
      '<test-component></test-component>' +
      '<test-component><span class="custom" data-bind="text: msg"></span></test-component>'
    applyBindings(outerViewModel, testNode)
    clock.tick(1)

    // First instance — no children → uses shared template
    expect(testNode.children[0].querySelector('.shared')).to.not.equal(null)
    expect(testNode.children[0].querySelector('.custom')).to.equal(null)
    // Second instance — has children → uses them instead of the shared default
    expect(testNode.children[1].querySelector('.shared')).to.equal(null)
    expect(testNode.children[1].querySelector('.custom')).to.not.equal(null)
    expect(testNode.children[1].querySelector('.custom')!.textContent).to.equal('vm-msg')
  })

  it('disposes when the node is removed', function () {
    let disp = false
    class CX extends ComponentABC {
      override dispose() {
        super.dispose()
        disp = true
      }
      static override get customElementName() {
        return 'test-component'
      }
      static override get template() {
        return '<i></i>'
      }
    }
    CX.register()
    applyBindings(outerViewModel, testNode)
    cleanNode(testNode)
    expect(disp).to.equal(true)
  })
})
