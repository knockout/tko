import { options } from '@tko/utils'

import { applyBindings, bindingEvent } from '@tko/bind'

import { MultiProvider } from '@tko/provider.multi'
import { VirtualProvider } from '@tko/provider.virtual'
import { DataBindProvider } from '@tko/provider.databind'

import { bindings as coreBindings } from '@tko/binding.core'
import { bindings as templateBindings } from '@tko/binding.template'
import { bindings as ifBindings } from '@tko/binding.if'

import '@tko/utils/helpers/jasmine-13-helper'

describe('Binding: DescendantsComplete', function () {
  // This is just a special case of the "event" binding, so not necessary to respecify all its behaviors
  let testNode: HTMLElement
  let bindingHandlers

  beforeEach(function () {
    testNode = jasmine.prepareTestNode()
  })

  beforeEach(function () {
    const provider = new MultiProvider({ providers: [new VirtualProvider(), new DataBindProvider()] })
    options.bindingProviderInstance = provider

    bindingHandlers = provider.bindingHandlers
    bindingHandlers.set(coreBindings)
    bindingHandlers.set(templateBindings)
    bindingHandlers.set(ifBindings)
  })

  it('Should call a descendantsComplete callback function after descendant elements are bound', function () {
    let callbacks = 0,
      callback = function (node) {
        expect(node).toEqual(testNode.childNodes[0])
        callbacks++
      },
      vm = { callback: callback }

    testNode.innerHTML =
      "<div data-bind='descendantsComplete: callback'><span data-bind='text: \"Some Text\"'></span></div>"
    applyBindings(vm, testNode)
    expect(callbacks).toEqual(1)
  })

  it('Should call a descendantsComplete callback function when bound to a virtual element', function () {
    let callbacks = 0,
      callback = function (node) {
        expect(node).toEqual(testNode.childNodes[1])
        callbacks++
      },
      vm = { callback: callback }

    testNode.innerHTML =
      'begin <!-- ko descendantsComplete: callback --><span data-bind=\'text: "Some Text"\'></span><!-- /ko --> end'
    applyBindings(vm, testNode)
    expect(callbacks).toEqual(1)
  })

  it('Should not call a descendantsComplete callback function when there are no descendant nodes', function () {
    let callbacks = 0

    testNode.innerHTML = "<div data-bind='descendantsComplete: callback'></div>"
    applyBindings(
      {
        callback: function () {
          callbacks++
        }
      },
      testNode
    )
    expect(callbacks).toEqual(0)
  })

  it('Should ignore (and not throw an error) for a null descendantsComplete callback', function () {
    testNode.innerHTML =
      "<div data-bind='descendantsComplete: null'><span data-bind='text: \"Some Text\"'></span></div>"
    applyBindings({}, testNode)
  })

  it('Should call descendantsComplete callback registered with ko.bindingEvent.subscribe, if descendantsComplete is also present in the binding', function () {
    let callbacks = 0

    testNode.innerHTML = "<div data-bind='descendantsComplete'><div></div></div>"
    bindingEvent.subscribe(
      testNode.childNodes[0],
      bindingEvent.descendantsComplete,
      function (node) {
        callbacks++
        expect(node).toEqual(testNode.childNodes[0])
      },
      null
    )

    applyBindings({}, testNode)
    expect(callbacks).toEqual(1)
  })

  it("Should call a descendantsComplete callback function even if descendant element doesn't generate event", function () {
    let callbacks = 0,
      callback = function (node) {
        expect(node).toEqual(testNode.childNodes[0])
        callbacks++
      },
      vm = { callback: callback }

    testNode.innerHTML =
      "<div data-bind='descendantsComplete: callback'><span data-bind='text: \"Some Text\"'></span><div data-bind='descendantsComplete'></div></div>"
    applyBindings(vm, testNode)
    expect(callbacks).toEqual(1)
  })
})
