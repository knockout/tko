import { expect } from 'chai'
import sinon from 'sinon'

import { applyBindings } from '@tko/bind'

import { triggerEvent } from '@tko/utils'

import { DataBindProvider } from '@tko/provider.databind'

import { observable } from '@tko/observable'

import { options } from '@tko/utils'

import { bindings as coreBindings } from '../dist'

import { prepareTestNode } from '../../utils/helpers/mocha-test-helpers'

describe('Binding: Event', function () {
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = prepareTestNode()
  })

  beforeEach(function () {
    const provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it("Should invoke the supplied function when the event occurs, using model as 'this' param and first arg, and event as second arg", function () {
    const model = {
      firstWasCalled: false,
      firstHandler: function (passedModel, evt) {
        expect(evt.type).to.equal('click')
        expect(this).to.equal(model)
        expect(passedModel).to.equal(model)

        expect(model.firstWasCalled).to.equal(false)
        model.firstWasCalled = true
      },

      secondWasCalled: false,
      secondHandler: function (passedModel, evt) {
        expect(evt.type).to.equal('mouseover')
        expect(this).to.equal(model)
        expect(passedModel).to.equal(model)

        expect(model.secondWasCalled).to.equal(false)
        model.secondWasCalled = true
      }
    }
    testNode.innerHTML =
      "<button data-bind='event:{click:firstHandler, mouseover:secondHandler, mouseout:null}'>hey</button>"
    applyBindings(model, testNode)
    triggerEvent(testNode.children[0], 'click')
    expect(model.firstWasCalled).to.equal(true)
    expect(model.secondWasCalled).to.equal(false)
    triggerEvent(testNode.children[0], 'mouseover')
    expect(model.secondWasCalled).to.equal(true)
    triggerEvent(testNode.children[0], 'mouseout') // Shouldn't do anything (specifically, shouldn't throw)
  })

  it("Should invoke lambda when the event occurs, using model as 'this' param and first arg, and event as second arg", function () {
    testNode.innerHTML = "<button data-bind='event: { click: (data, event) => data.log(event) }'>hey</button>"
    let thing: any = null
    applyBindings(
      {
        log(arg) {
          thing = arg
        }
      },
      testNode
    )
    triggerEvent(testNode.children[0], 'click')
    expect(thing)
    expect(thing.type).to.equal('click')
  })

  it('Should prevent default action', function () {
    testNode.innerHTML = "<a href='http://www.example.com/' data-bind='event: { click: noop }'>hey</a>"
    applyBindings({ noop: function () {} }, testNode)
    triggerEvent(testNode.children[0], 'click')
    // Assuming we haven't been redirected to http://www.example.com/, this spec has now passed
  })

  it('Should allow default action by setting preventDefault:false', function () {
    testNode.innerHTML =
      "<div data-bind='event: {click: test}'><a href='#' data-bind='event: {click: {preventDefault: false}}'>hey</a></div>"
    let prevented
    applyBindings({ test: (_, event) => (prevented = event.defaultPrevented) }, testNode)
    triggerEvent(testNode.children[0].children[0], 'click')
    expect(prevented).to.equal(false)
  })

  it('Should conditionally allow default action when preventDefault is observable', function () {
    testNode.innerHTML =
      "<div data-bind='event: {click: test}'><a href='#' data-bind='event: {click: {preventDefault: obs}}'>hey</a></div>"
    let prevented
    const obs = observable(true)
    applyBindings({ test: (_, event) => (prevented = event.defaultPrevented), obs: obs }, testNode)
    triggerEvent(testNode.children[0].children[0], 'click')
    expect(prevented).to.equal(true)
    obs(false)
    triggerEvent(testNode.children[0].children[0], 'click')
    expect(prevented).to.equal(false)
  })

  it('Should let bubblable events bubble to parent elements by default', function () {
    const model = {
      innerWasCalled: false,
      innerDoCall: function () {
        this.innerWasCalled = true
      },
      outerWasCalled: false,
      outerDoCall: function () {
        this.outerWasCalled = true
      }
    }
    testNode.innerHTML =
      "<div data-bind='event:{click:outerDoCall}'><button data-bind='event:{click:innerDoCall}'>hey</button></div>"
    applyBindings(model, testNode)
    triggerEvent(testNode.children[0].children[0], 'click')
    expect(model.innerWasCalled).to.equal(true)
    expect(model.outerWasCalled).to.equal(true)
  })

  it('Should be able to prevent bubbling of bubblable events using the (eventname)Bubble:false option', function () {
    const model = {
      innerWasCalled: false,
      innerDoCall: function () {
        this.innerWasCalled = true
      },
      outerWasCalled: false,
      outerDoCall: function () {
        this.outerWasCalled = true
      }
    }
    testNode.innerHTML =
      "<div data-bind='event:{click:outerDoCall}'><button data-bind='event:{click:innerDoCall}, clickBubble:false'>hey</button></div>"
    applyBindings(model, testNode)
    triggerEvent(testNode.children[0].children[0], 'click')
    expect(model.innerWasCalled).to.equal(true)
    expect(model.outerWasCalled).to.equal(false)
  })

  it('Should be able to supply handler params using "bind" helper', function () {
    // Using "bind" like this just eliminates the function literal wrapper - it's purely stylistic
    let didCallHandler = false,
      someObj = {}
    const myHandler = function () {
      expect(this).to.equal(someObj)
      expect(arguments.length).to.equal(5)

      // First x args will be the ones you bound
      expect(arguments[0]).to.equal(123)
      expect(arguments[1]).to.equal('another')
      expect(arguments[2].something).to.equal(true)

      // Then you get the args we normally pass to handlers, i.e., the model then the event
      expect(arguments[3]).to.equal(viewModel)
      expect(arguments[4].type).to.equal('mouseover')

      didCallHandler = true
    }
    testNode.innerHTML =
      '<button data-bind=\'event:{ mouseover: myHandler.bind(someObj, 123, "another", { something: true }) }\'>hey</button>'
    const viewModel = { myHandler: myHandler, someObj: someObj }
    applyBindings(viewModel, testNode)
    triggerEvent(testNode.children[0], 'mouseover')
    expect(didCallHandler).to.equal(true)
  })

  it("ordinarily bubbles and is neither passive nor capturing nore 'once'", function () {
    let handlerCalls = 0
    testNode.innerHTML = "<a data-bind='event: {click: { handler: fn }}'><b></b></a>"
    const fn = (vm, evt) => {
      handlerCalls++
      expect(evt.eventPhase).to.equal(3) // bubbling
    }
    applyBindings({ fn }, testNode)
    triggerEvent(testNode.children[0].children[0], 'click')
    expect(handlerCalls).to.equal(1)
    triggerEvent(testNode.children[0].children[0], 'click')
    expect(handlerCalls).to.equal(2)
  })

  it('prevents bubble', function () {
    let handlerCalls = 0
    testNode.innerHTML = "<a data-bind='click: fn'><b data-bind='event: {click: { bubble: false }}'></b></a>"
    const fn = () => handlerCalls++
    applyBindings({ fn }, testNode)
    triggerEvent(testNode.children[0].children[0], 'click')
    expect(handlerCalls).to.equal(0)
  })

  it('respects the `once` param', function () {
    let handlerCalls = 0
    testNode.innerHTML = "<a data-bind='event: {click: {handler: fn, once: true}}'></a>"
    const fn = () => handlerCalls++
    applyBindings({ fn }, testNode)
    triggerEvent(testNode.children[0], 'click')
    expect(handlerCalls).to.equal(1)
    triggerEvent(testNode.children[0], 'click')
    expect(handlerCalls).to.equal(1)
  })

  it('respects the `capture` param', function () {
    testNode.innerHTML = "<a data-bind='event: {click: {handler: fn, capture: true}}'><b></b></a>"
    const fn = (vm, evt) => {
      expect(evt.eventPhase).to.equal(1) // capturing
    }
    applyBindings({ fn }, testNode)
    triggerEvent(testNode.children[0].children[0], 'click')
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
    triggerEvent(testNode.children[0].children[0], 'click')
    expect(preventDefaultThrows).to.equal(true)
  })

  it('respects the `debounce` property', function () {
    const clock = sinon.useFakeTimers()
    try {
      testNode.innerHTML = "<a data-bind='event: {click: {handler: fn, debounce: 50}}'></a>"
      let calls = 0
      const fn = () => calls++
      applyBindings({ fn }, testNode)
      triggerEvent(testNode.children[0], 'click')
      triggerEvent(testNode.children[0], 'click')
      triggerEvent(testNode.children[0], 'click')
      triggerEvent(testNode.children[0], 'click')
      triggerEvent(testNode.children[0], 'click')
      expect(calls).to.equal(0)
      clock.tick(500)
      expect(calls).to.equal(1)
    } finally {
      clock.restore()
    }
  })

  it('respects the `throttle` property', function () {
    const clock = sinon.useFakeTimers()
    try {
      testNode.innerHTML = "<a data-bind='event: {click: {handler: fn, throttle: 50}}'></a>"
      let calls = 0
      const fn = () => calls++
      applyBindings({ fn }, testNode)
      triggerEvent(testNode.children[0], 'click')
      expect(calls).to.equal(0)
      clock.tick(100)
      expect(calls).to.equal(1)
      triggerEvent(testNode.children[0], 'click')
      expect(calls).to.equal(1)
      clock.tick(100)
      expect(calls).to.equal(2)
      triggerEvent(testNode.children[0], 'click')
      triggerEvent(testNode.children[0], 'click')
      triggerEvent(testNode.children[0], 'click')
      expect(calls).to.equal(2)
      clock.tick(100)
      expect(calls).to.equal(3)
    } finally {
      clock.restore()
    }
  })
})

describe('Binding: on.', function () {
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = prepareTestNode()
  })

  beforeEach(function () {
    const provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it('invokes argument as a function on event', function () {
    const obs = observable(false)
    testNode.innerHTML = "<button data-bind='on.click: obs(true)'>hey</button>"
    applyBindings({ obs: obs }, testNode)
    expect(obs()).to.equal(false)
    triggerEvent(testNode.children[0], 'click')
    expect(obs()).to.equal(true)
  })
})
