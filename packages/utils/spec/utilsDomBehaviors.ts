import { expect } from 'chai'

import * as utils from '../dist'
import { domNodeIsContainedBy, registerEventHandler, virtualElements } from '../dist'
import options from '../dist/options'
import type { KnockoutInstance } from '@tko/builder'
import { prepareTestNode, restoreAfter } from '../helpers/mocha-test-helpers'
import { isHappyDom } from '../helpers/test-env'

const ko: KnockoutInstance = globalThis.ko || {}
ko.utils = utils
ko.options = options

describe('startCommentRegex', function () {
  it('only ie8 has a text property at comment nodes', function () {
    const reg: RegExp = virtualElements.startCommentRegex
    expect(reg.source).to.not.contain('<!..')
  })
})

describe('DOM-Info Tool', function () {
  it('domNodeIsContainedBy with special values', function () {
    const parent = document.createElement('div')
    const test = document.createDocumentFragment()

    expect(domNodeIsContainedBy(parent, test)).to.equals(false)
    expect(domNodeIsContainedBy(test, parent)).to.equals(false)

    expect(domNodeIsContainedBy(parent, undefined)).to.equals(false)
    expect(domNodeIsContainedBy(parent, null)).to.equals(false)
    expect(domNodeIsContainedBy(null, parent)).to.equals(false)

    test.appendChild(parent)

    expect(domNodeIsContainedBy(parent, test)).to.equals(true)
    expect(domNodeIsContainedBy(test, parent)).to.equals(false)

    const testDiv = document.createElement('div')
    const template = document.createElement('template')
    template.content.appendChild(testDiv)
    expect(domNodeIsContainedBy(testDiv, template)).to.equals(false) //Because template.content is a DocumentFragment
    expect(domNodeIsContainedBy(testDiv, template.content)).to.equals(true)

    parent.appendChild(template)
    expect(domNodeIsContainedBy(template, parent)).to.equals(true)
    expect(domNodeIsContainedBy(template, test)).to.equals(true)
    expect(domNodeIsContainedBy(testDiv, parent)).to.equals(false) //Because template.content is a DocumentFragment
  })

  it('Parent Node contains child', function () {
    const parent = document.createElement('div')
    const child = document.createElement('span')
    parent.appendChild(child)

    expect(domNodeIsContainedBy(child, parent)).to.equals(true)
  })

  it('Node not contains node', function () {
    const parent = document.createElement('div')
    const child = document.createElement('span')

    expect(domNodeIsContainedBy(child, parent)).to.equals(false)
  })

  it('Parent Node contains subchild', function () {
    const parent = document.createElement('div')
    const child = document.createElement('span')
    const subchild = document.createElement('em')
    parent.appendChild(child)
    child.appendChild(subchild)

    const node = document.createTextNode('text')

    expect(domNodeIsContainedBy(subchild, parent)).to.equals(true)
    expect(domNodeIsContainedBy(subchild, child)).to.equals(true)
    expect(domNodeIsContainedBy(subchild, subchild)).to.equals(true)
    expect(domNodeIsContainedBy(node, parent)).to.equals(false)
  })

  it('ShadowRoot contains its descendants but its host does not', function () {
    const host = document.createElement('div')
    const shadow = host.attachShadow({ mode: 'open' })
    const child = document.createElement('span')
    shadow.appendChild(child)

    expect(domNodeIsContainedBy(child, shadow)).to.equals(true)
    // Like template.content, the shadow root is a DocumentFragment whose
    // descendants are not part of the host's light-DOM subtree.
    expect(domNodeIsContainedBy(child, host)).to.equals(false)
  })
})

describe('setTextContent', function () {
  let element: HTMLElement

  beforeEach(function () {
    element = document.createElement('DIV')
  })

  // NOTE: will test innerHTML because <IE8 doesn't have textContent
  it('defaults to empty string', function () {
    ko.utils.setTextContent(element)
    expect(element.innerHTML).to.equal('')
  })

  it('sets text from plain values or observables', function () {
    ko.utils.setTextContent(element, 'test')
    expect(element.innerHTML).to.equal('test')

    // We use a function as a proxy for an obsevrable
    ko.utils.setTextContent(element, function () {
      return 'change'
    })
    expect(element.innerHTML).to.equal('change')
  })

  it('overwrites existing text', function () {
    element.innerHTML = 'existing'

    ko.utils.setTextContent(element, 'changed')
    expect(element.innerHTML).to.equal('changed')
  })
})

describe('registerEventHandler', function () {
  let testNode: HTMLElement
  let cleanups: Array<() => void>
  beforeEach(function () {
    cleanups = []
    testNode = prepareTestNode()
  })
  afterEach(function () {
    while (cleanups.length) {
      cleanups.pop()!()
    }
  })
  //TODO it looks like jquery3.7+ and trigger doesn't works with tko, useOnlyNativeEvents should be always true if jquery is used.
  it.skip('if jQuery is referenced, should use jQuery eventing with useOnlyNativeEvents option set to false', function () {
    const jQuery = options.jQuery

    if (!options.jQuery) console.log('------- JQUERY is disabled -------')

    if (typeof jQuery === 'undefined') {
      return // Nothing to test. Run the specs with jQuery referenced for this to do anything.
    }

    restoreAfter(cleanups, ko.options, 'useOnlyNativeEvents')

    const element = document.createElement('button')
    let eventFired = false
    let jQueryModified = false

    testNode.appendChild(element)

    // Set the option to true.
    ko.options.useOnlyNativeEvents = false

    // Verify jQuery is used in event binding.
    registerEventHandler(element, 'click', function (eventArgs) {
      eventFired = true
      jQueryModified = !!eventArgs.originalEvent
    })

    // Trigger the event natively (jQuery intercepts and creates new event object, which we can test)
    element.click()
    expect(eventFired && jQueryModified).to.equal(true)

    // Also trigger an event through ko.utils.triggerEvent to show that it creates a jQuery event directly
    eventFired = jQueryModified = false
    ko.utils.triggerEvent(element, 'click')
    expect(eventFired && !jQueryModified).to.equal(true)
  })

  it('if jQuery is referenced, useOnlyNativeEvents option set to true', function () {
    const jQuery = options.jQuery

    if (!jQuery) {
      console.log('------- JQUERY is disabled -------')
      return // Nothing to test. Run the specs with jQuery referenced for this to do anything.
    }
    //see upper test-case, the JQUERY 3.7 trigger-function currently doesn't work with tko..
    expect(ko.options.useOnlyNativeEvents).to.equal(true)
  })

  it('should not use jQuery eventing with useOnlyNativeEvents option set to true', function () {
    restoreAfter(cleanups, ko.options, 'useOnlyNativeEvents')

    const element = document.createElement('button')
    let eventFired = false
    let jQueryModified = false

    testNode.appendChild(element)

    // Set the option to true.
    ko.options.useOnlyNativeEvents = true

    // Verify jQuery is not used in event binding.
    registerEventHandler(element, 'click', function (eventArgs) {
      eventFired = true
      jQueryModified = !!eventArgs.originalEvent
    })

    // Trigger the event natively
    element.click()
    expect(eventFired && !jQueryModified).to.equal(true)

    // Also trigger an event through ko.utils.triggerEvent to show that it triggers a native event
    eventFired = jQueryModified = false
    ko.utils.triggerEvent(element, 'click')
    expect(eventFired && !jQueryModified).to.equal(true)
  })
})

describe('cloneNodes', function () {
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = prepareTestNode()
  })

  it('should return clones', function () {
    const newNodes = ko.utils.cloneNodes([testNode])
    const isClone = !testNode.isSameNode(newNodes[0]) && testNode.isEqualNode(newNodes[0])
    expect(isClone).to.equal(true)
  })

  it('should clone deeply', function () {
    const child = document.createElement('DIV')
    testNode.appendChild(child)

    const newNodes = ko.utils.cloneNodes([testNode])
    const newChild = newNodes[0].childNodes[0]

    const childIsClone = !child.isSameNode(newChild) && child.isEqualNode(newChild)

    expect(childIsClone).to.equal(true)
  })
})

describe('selectExtensions', () => {
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = prepareTestNode()
  })

  it('should use loose equality for select value', function (ctx: any) {
    if (isHappyDom()) return ctx.skip('happy-dom: `selected` attribute via innerHTML does not set selectedIndex')
    const select = document.createElement('select')
    select.innerHTML = `
      <option value="42" selected>Forty-two</option>
      <option value="84">Eighty-four</option>
    `
    testNode.appendChild(select)

    expect(select.selectedIndex).to.equal(0)
    expect(utils.selectExtensions.readValue(select)).to.equal('42')
    utils.selectExtensions.writeValue(select, 84, true)
    expect(select.selectedIndex).to.equal(1)
  })
})
