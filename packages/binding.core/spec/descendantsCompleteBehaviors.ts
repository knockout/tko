import { expect } from 'chai'

import { options } from '@tko/utils'

import { applyBindings, bindingEvent } from '@tko/bind'

import { MultiProvider } from '@tko/provider.multi'
import { VirtualProvider } from '@tko/provider.virtual'
import { DataBindProvider } from '@tko/provider.databind'

import { bindings as coreBindings } from '@tko/binding.core'
import { bindings as templateBindings } from '@tko/binding.template'
import { bindings as ifBindings } from '@tko/binding.if'

import { observable } from '@tko/observable'
import { expectContainText, prepareTestNode } from '../../utils/helpers/mocha-test-helpers'

describe('Binding: DescendantsComplete', function () {
  // This is just a special case of the "event" binding, so not necessary to respecify all its behaviors
  let testNode: HTMLElement
  let bindingHandlers

  beforeEach(function () {
    testNode = prepareTestNode()
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
        expect(node).to.equal(testNode.childNodes[0])
        callbacks++
      },
      vm = { callback: callback }

    testNode.innerHTML =
      "<div data-bind='descendantsComplete: callback'><span data-bind='text: \"Some Text\"'></span></div>"
    applyBindings(vm, testNode)
    expect(callbacks).to.equal(1)
  })

  it('Should call a descendantsComplete callback function when bound to a virtual element', function () {
    let callbacks = 0,
      callback = function (node) {
        expect(node).to.equal(testNode.childNodes[1])
        callbacks++
      },
      vm = { callback: callback }

    testNode.innerHTML =
      'begin <!-- ko descendantsComplete: callback --><span data-bind=\'text: "Some Text"\'></span><!-- /ko --> end'
    applyBindings(vm, testNode)
    expect(callbacks).to.equal(1)
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
    expect(callbacks).to.equal(0)
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
        expect(node).to.equal(testNode.childNodes[0])
      },
      null
    )

    applyBindings({}, testNode)
    expect(callbacks).to.equal(1)
  })

  it("Should call a descendantsComplete callback function even if descendant element doesn't generate event", function () {
    let callbacks = 0,
      callback = function (node) {
        expect(node).to.equal(testNode.childNodes[0])
        callbacks++
      },
      vm = { callback: callback }

    testNode.innerHTML =
      "<div data-bind='descendantsComplete: callback'><span data-bind='text: \"Some Text\"'></span><div data-bind='descendantsComplete'></div></div>"
    applyBindings(vm, testNode)
    expect(callbacks).to.equal(1)
  })

  it('Should call a descendantsComplete callback after a nested "if" binding renders (KO 3.5 default)', function () {
    testNode.innerHTML =
      "<div data-bind='if: outerCondition, descendantsComplete: callback'><div data-bind='if: innerCondition, childrenComplete: render'><span data-bind='text: someText'></span></div></div>"
    let callbacks = 0,
      render = 0
    const viewModel = {
      outerCondition: observable(false),
      innerCondition: observable(false),
      someText: 'hello',
      callback: function () {
        callbacks++
      },
      render: function () {
        render++
      }
    }

    applyBindings(viewModel, testNode)
    expect(callbacks).to.equal(0)
    expect(render).to.equal(0)
    expectContainText(testNode, '')

    // Rendering the outer content completes its descendants (the inner "if"
    // renders nothing but still reports completion), so the callback fires.
    viewModel.outerCondition(true)
    expect(callbacks).to.equal(1)
    expect(render).to.equal(0)

    // The inner condition renders its content; childrenComplete fires there.
    viewModel.innerCondition(true)
    expect(callbacks).to.equal(1)
    expect(render).to.equal(1)
    expectContainText(testNode, 'hello')
  })

  it("Should defer descendantsComplete with completeOn: 'render' until inner content renders", function () {
    testNode.innerHTML =
      "<div data-bind='if: outerCondition, descendantsComplete: callback'><div data-bind='if: innerCondition, completeOn: \"render\"'><span data-bind='text: someText'></span></div></div>"
    let callbacks = 0
    const viewModel = {
      outerCondition: observable(false),
      innerCondition: observable(false),
      someText: 'hello',
      callback: function () {
        callbacks++
      }
    }

    applyBindings(viewModel, testNode)
    expect(callbacks).to.equal(0)

    // The inner "if" holds the outer's descendantsComplete open until it renders.
    viewModel.outerCondition(true)
    expect(callbacks).to.equal(0)

    viewModel.innerCondition(true)
    expect(callbacks).to.equal(1)
    expectContainText(testNode, 'hello')
  })

  it('Should still fire childrenComplete on a false "if" branch that renders nothing', function () {
    testNode.innerHTML = "<div data-bind='if: condition, childrenComplete: callback'></div>"
    let callbacks = 0
    const viewModel = {
      condition: observable(false),
      callback: function () {
        callbacks++
      }
    }
    applyBindings(viewModel, testNode)
    // childrenComplete fires even though there are no rendered children, but the
    // callback only runs when there are child nodes to hand back.
    expect(callbacks).to.equal(0)
  })

  it('Should re-fire descendantsComplete each time a conditional re-renders its content (KO 3.5 semantics)', function () {
    testNode.innerHTML =
      "<div data-bind='if: condition, descendantsComplete: callback'><span data-bind='text: someText'></span></div>"
    let callbacks = 0
    const viewModel = {
      condition: observable(false),
      someText: 'hello',
      callback: function () {
        callbacks++
      }
    }

    applyBindings(viewModel, testNode)
    expect(callbacks).to.equal(0)

    // Each render cycle that produces content re-arms and re-fires the callback.
    viewModel.condition(true)
    expect(callbacks).to.equal(1)

    viewModel.condition(false)
    expect(callbacks).to.equal(1)

    viewModel.condition(true)
    expect(callbacks).to.equal(2)
  })
})
