import {
    applyBindings
} from '@tko/bind'

import {
    triggerEvent
} from '@tko/utils'

import { DataBindProvider } from '@tko/provider.databind'

import {
    observable
} from '@tko/observable'

import {
    options
} from '@tko/utils'

import {bindings as coreBindings} from '../dist'

import '@tko/utils/helpers/jasmine-13-helper'

describe('Binding: Event', function () {
  beforeEach(jasmine.prepareTestNode)

  beforeEach(function () {
    var provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it('Should invoke the supplied function when the event occurs, using model as \'this\' param and first arg, and event as second arg', function () {
    var model = {
      firstWasCalled: false,
      firstHandler: function (passedModel, evt) {
        expect(evt.type).toEqual('click')
        expect(this).toEqual(model)
        expect(passedModel).toEqual(model)

        expect(model.firstWasCalled).toEqual(false)
        model.firstWasCalled = true
      },

      secondWasCalled: false,
      secondHandler: function (passedModel, evt) {
        expect(evt.type).toEqual('mouseover')
        expect(this).toEqual(model)
        expect(passedModel).toEqual(model)

        expect(model.secondWasCalled).toEqual(false)
        model.secondWasCalled = true
      }
    }
    testNode.innerHTML = "<button data-bind='event:{click:firstHandler, mouseover:secondHandler, mouseout:null}'>hey</button>"
    applyBindings(model, testNode)
    triggerEvent(testNode.childNodes[0], 'click')
    expect(model.firstWasCalled).toEqual(true)
    expect(model.secondWasCalled).toEqual(false)
    triggerEvent(testNode.childNodes[0], 'mouseover')
    expect(model.secondWasCalled).toEqual(true)
    triggerEvent(testNode.childNodes[0], 'mouseout') // Shouldn't do anything (specifically, shouldn't throw)
  })

  it('Should invoke lambda when the event occurs, using model as \'this\' param and first arg, and event as second arg', function () {
    testNode.innerHTML = "<button data-bind='event: { click: (data, event) => data.log(event) }'>hey</button>"
    let thing = null;
    applyBindings({
      log (arg) {
        thing = arg
      }
    })
    triggerEvent(testNode.childNodes[0], 'click')
    expect(thing)
    expect(thing.type).toEqual('click')
  })

  it('Should prevent default action', function () {
    testNode.innerHTML = "<a href='http://www.example.com/' data-bind='event: { click: noop }'>hey</a>"
    applyBindings({ noop: function () {} }, testNode)
    triggerEvent(testNode.childNodes[0], 'click')
        // Assuming we haven't been redirected to http://www.example.com/, this spec has now passed
  })

  it('Should allow default action by setting preventDefault:false', function () {
    testNode.innerHTML = "<div data-bind='event: {click: test}'><a href='#' data-bind='event: {click: {preventDefault: false}}'>hey</a></div>"
    let prevented
    applyBindings({
        test: (_, event) => prevented = event.defaultPrevented,
    }, testNode)
    triggerEvent(testNode.childNodes[0].childNodes[0], 'click')
    expect(prevented).toEqual(false)
  })

  it('Should conditionally allow default action when preventDefault is observable', function () {
    testNode.innerHTML = "<div data-bind='event: {click: test}'><a href='#' data-bind='event: {click: {preventDefault: obs}}'>hey</a></div>"
    let prevented
    const obs = observable(true)
    applyBindings({
        test: (_, event) => prevented = event.defaultPrevented,
        obs: obs
    }, testNode)
    triggerEvent(testNode.childNodes[0].childNodes[0], 'click')
    expect(prevented).toEqual(true)
    obs(false)
    triggerEvent(testNode.childNodes[0].childNodes[0], 'click')
    expect(prevented).toEqual(false)
  })

  it('Should let bubblable events bubble to parent elements by default', function () {
    var model = {
      innerWasCalled: false,
      innerDoCall: function () { this.innerWasCalled = true },
      outerWasCalled: false,
      outerDoCall: function () { this.outerWasCalled = true }
    }
    testNode.innerHTML = "<div data-bind='event:{click:outerDoCall}'><button data-bind='event:{click:innerDoCall}'>hey</button></div>"
    applyBindings(model, testNode)
    triggerEvent(testNode.childNodes[0].childNodes[0], 'click')
    expect(model.innerWasCalled).toEqual(true)
    expect(model.outerWasCalled).toEqual(true)
  })

  it('Should be able to prevent bubbling of bubblable events using the (eventname)Bubble:false option', function () {
    var model = {
      innerWasCalled: false,
      innerDoCall: function () { this.innerWasCalled = true },
      outerWasCalled: false,
      outerDoCall: function () { this.outerWasCalled = true }
    }
    testNode.innerHTML = "<div data-bind='event:{click:outerDoCall}'><button data-bind='event:{click:innerDoCall}, clickBubble:false'>hey</button></div>"
    applyBindings(model, testNode)
    triggerEvent(testNode.childNodes[0].childNodes[0], 'click')
    expect(model.innerWasCalled).toEqual(true)
    expect(model.outerWasCalled).toEqual(false)
  })

  it('Should be able to supply handler params using "bind" helper', function () {
        // Using "bind" like this just eliminates the function literal wrapper - it's purely stylistic
    var didCallHandler = false, someObj = {}
    var myHandler = function () {
      expect(this).toEqual(someObj)
      expect(arguments.length).toEqual(5)

            // First x args will be the ones you bound
      expect(arguments[0]).toEqual(123)
      expect(arguments[1]).toEqual('another')
      expect(arguments[2].something).toEqual(true)

            // Then you get the args we normally pass to handlers, i.e., the model then the event
      expect(arguments[3]).toEqual(viewModel)
      expect(arguments[4].type).toEqual('mouseover')

      didCallHandler = true
    }
    testNode.innerHTML = "<button data-bind='event:{ mouseover: myHandler.bind(someObj, 123, \"another\", { something: true }) }'>hey</button>"
    var viewModel = { myHandler: myHandler, someObj: someObj }
    applyBindings(viewModel, testNode)
    triggerEvent(testNode.childNodes[0], 'mouseover')
    expect(didCallHandler).toEqual(true)
  })

  it("ordinarily bubbles and is neither passive nor capturing nore 'once'", function () {
    let handlerCalls = 0
    testNode.innerHTML = "<a data-bind='event: {click: { handler: fn }}'><b></b></a>"
    const fn = (vm, evt) => {
      handlerCalls++
      expect(evt.eventPhase).toEqual(3) // bubbling
    }
    applyBindings({ fn }, testNode)
    triggerEvent(testNode.childNodes[0].childNodes[0], 'click')
    expect(handlerCalls).toEqual(1)
    triggerEvent(testNode.childNodes[0].childNodes[0], 'click')
    expect(handlerCalls).toEqual(2)
  })

  it("prevents bubble", function () {
    let handlerCalls = 0
    testNode.innerHTML = "<a data-bind='click: fn'><b data-bind='event: {click: { bubble: false }}'></b></a>"
    const fn = () => handlerCalls++
    applyBindings({ fn }, testNode)
    triggerEvent(testNode.childNodes[0].childNodes[0], 'click')
    expect(handlerCalls).toEqual(0)
  })

  it('respects the `once` param', function () {
    let handlerCalls = 0
    testNode.innerHTML = "<a data-bind='event: {click: {handler: fn, once: true}}'></a>"
    const fn = () => handlerCalls++
    applyBindings({ fn }, testNode)
    triggerEvent(testNode.childNodes[0], 'click')
    expect(handlerCalls).toEqual(1)
    triggerEvent(testNode.childNodes[0], 'click')
    expect(handlerCalls).toEqual(1)
  })

  it('respects the `capture` param', function () {
    testNode.innerHTML = "<a data-bind='event: {click: {handler: fn, capture: true}}'><b></b></a>"
    const fn = (vm, evt) => {
      expect(evt.eventPhase).toEqual(1) // capturing
    }
    applyBindings({ fn }, testNode)
    triggerEvent(testNode.childNodes[0].childNodes[0], 'click')
  })

  xit('respects the `passive` param', function () {
    /**
     * This does not appear to be testable.  The evt.preventDefault below
     * throws an uncatchable error in Chrome 63.
     */
    testNode.innerHTML = "<a data-bind='event: {click: {handler: fn, passive: true}}'><b></b></a>"
    let preventDefaultThrows = false
    const fn = (vm, evt) => {
      // test passive
      try {
        evt.preventDefault()
      } catch (e) {
        preventDefaultThrows = true
      }
    }
    applyBindings({ fn }, testNode)
    triggerEvent(testNode.childNodes[0].childNodes[0], 'click')
    expect(preventDefaultThrows).toEqual(true)
  })

  it("respects the `debounce` property", function () {
    jasmine.Clock.useMock()
    testNode.innerHTML = "<a data-bind='event: {click: {handler: fn, debounce: 50}}'></a>"
    var calls = 0
    const fn = () => calls++
    applyBindings({ fn }, testNode)
    triggerEvent(testNode.childNodes[0], 'click')
    triggerEvent(testNode.childNodes[0], 'click')
    triggerEvent(testNode.childNodes[0], 'click')
    triggerEvent(testNode.childNodes[0], 'click')
    triggerEvent(testNode.childNodes[0], 'click')
    expect(calls).toEqual(0)
    jasmine.Clock.tick(500)
    expect(calls).toEqual(1)
  })

  it("respects the `throttle` property", function () {
    jasmine.Clock.useMock()
    testNode.innerHTML = "<a data-bind='event: {click: {handler: fn, throttle: 50}}'></a>"
    let calls = 0
    const fn = () => calls++
    applyBindings({ fn }, testNode)
    triggerEvent(testNode.childNodes[0], 'click')
    expect(calls).toEqual(0)
    jasmine.Clock.tick(100)
    expect(calls).toEqual(1)
    triggerEvent(testNode.childNodes[0], 'click')
    expect(calls).toEqual(1)
    jasmine.Clock.tick(100)
    expect(calls).toEqual(2)
    triggerEvent(testNode.childNodes[0], 'click')
    triggerEvent(testNode.childNodes[0], 'click')
    triggerEvent(testNode.childNodes[0], 'click')
    expect(calls).toEqual(2)
    jasmine.Clock.tick(100)
    expect(calls).toEqual(3)
  })
})

describe('Binding: on.', function () {
  beforeEach(jasmine.prepareTestNode)

  beforeEach(function () {
    var provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it('invokes argument as a function on event', function () {
    var obs = observable(false)
    testNode.innerHTML = "<button data-bind='on.click: obs(true)'>hey</button>"
    applyBindings({ obs: obs }, testNode)
    expect(obs()).toEqual(false)
    triggerEvent(testNode.childNodes[0], 'click')
    expect(obs()).toEqual(true)
  })
})
