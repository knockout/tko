import '../helpers/jasmine-13-helper'

import * as utils from '../dist'
import { registerEventHandler, virtualElements } from '../dist'
import options from '../dist/options'
import type { KnockoutInstance } from '@tko/builder'

let ko : KnockoutInstance = globalThis.ko || {}
ko.utils = utils
ko.options = options

describe('startCommentRegex', function () {

  it('only ie8 has a text property at comment nodes', function () {
    const reg : RegExp = virtualElements.startCommentRegex
    expect(reg.source).not.toContain('<!..')
  })

})

describe('setTextContent', function () {
  let element : HTMLElement

  beforeEach(function () {
    element = document.createElement('DIV')
  })

    // NOTE: will test innerHTML because <IE8 doesn't have textContent
  it('defaults to empty string', function () {
    ko.utils.setTextContent(element)
    expect(element.innerHTML).toEqual('')
  }) 

  it('sets text from plain values or observables', function () {
    ko.utils.setTextContent(element, 'test')
    expect(element.innerHTML).toEqual('test')

        // We use a function as a proxy for an obsevrable
    ko.utils.setTextContent(element, function () { return 'change' })
    expect(element.innerHTML).toEqual('change')
  })

  it('overwrites existing text', function () {
    element.innerHTML = 'existing'

    ko.utils.setTextContent(element, 'changed')
    expect(element.innerHTML).toEqual('changed')
  })
})

describe('registerEventHandler', function () {
  let testNode : HTMLElement
  beforeEach(function() { testNode = jasmine.prepareTestNode() })
  //TODO it looks like jquery3.7+ and trigger doesn't works with tko, useOnlyNativeEvents should be always true if jquery is used.
  xit('if jQuery is referenced, should use jQuery eventing with useOnlyNativeEvents option set to false', function () {
    const jQuery = options.jQuery
    
    if(!options.jQuery)
      console.log('------- JQUERY is disabled -------')

    if (typeof jQuery === 'undefined') {
      return // Nothing to test. Run the specs with jQuery referenced for this to do anything.
    }

    this.restoreAfter(ko.options, 'useOnlyNativeEvents')

    let element = document.createElement('button')
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
    expect(eventFired && jQueryModified).toBe(true)

        // Also trigger an event through ko.utils.triggerEvent to show that it creates a jQuery event directly
    eventFired = jQueryModified = false
    ko.utils.triggerEvent(element, 'click')
    expect(eventFired && !jQueryModified).toBe(true)
  })

  it('if jQuery is referenced, useOnlyNativeEvents option set to true', function () {

    const jQuery = options.jQuery

    if (!jQuery) {
      console.log('------- JQUERY is disabled -------')
      return // Nothing to test. Run the specs with jQuery referenced for this to do anything.
    }
    //see upper test-case, the JQUERY 3.7 trigger-function currently doesn't work with tko..
    expect(ko.options.useOnlyNativeEvents).toBe(true)
  })


  it('should not use jQuery eventing with useOnlyNativeEvents option set to true', function () {
    this.restoreAfter(ko.options, 'useOnlyNativeEvents')

    let element = document.createElement('button')
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
    expect(eventFired && !jQueryModified).toBe(true)

        // Also trigger an event through ko.utils.triggerEvent to show that it triggers a native event
    eventFired = jQueryModified = false
    ko.utils.triggerEvent(element, 'click')
    expect(eventFired && !jQueryModified).toBe(true)
  })
})

describe('cloneNodes', function () {
  let testNode : HTMLElement
  beforeEach(function() { testNode = jasmine.prepareTestNode() })

  it('should return clones', function () {
    let newNodes = ko.utils.cloneNodes([testNode])
    let isClone = !testNode.isSameNode(newNodes[0]) && testNode.isEqualNode(newNodes[0])
    expect(isClone).toBe(true)
  })

  it('should clone deeply', function () {
    let child = document.createElement('DIV')
    testNode.appendChild(child)

    let newNodes = ko.utils.cloneNodes([testNode])
    let newChild = newNodes[0].childNodes[0]

    let childIsClone = !child.isSameNode(newChild) && child.isEqualNode(newChild)

    expect(childIsClone).toBe(true)
  })
})

describe('selectExtensions', () => {
  let testNode : HTMLElement
  beforeEach(function() { testNode = jasmine.prepareTestNode() })

  it('should use loose equality for select value', () => {
    const select = document.createElement('select')
    select.innerHTML = `
      <option value="42" selected>Forty-two</option>
      <option value="84">Eighty-four</option>
    `
    testNode.appendChild(select)

    expect(select.selectedIndex).toBe(0)
    expect(utils.selectExtensions.readValue(select)).toBe('42')
    utils.selectExtensions.writeValue(select, 84, true)
    expect(select.selectedIndex).toBe(1)
  })
})
