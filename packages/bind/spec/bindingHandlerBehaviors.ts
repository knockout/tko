import { expect } from 'chai'

import { cleanNode, options } from '@tko/utils'

import { observable as koObservable } from '@tko/observable'

import type { Observable } from '@tko/observable'

import { MultiProvider } from '@tko/provider.multi'

import { VirtualProvider } from '@tko/provider.virtual'

import { DataBindProvider } from '@tko/provider.databind'

import { applyBindings, BindingHandler, contextFor } from '../dist'

import { bindings as coreBindings } from '@tko/binding.core'
import { bindings as templateBindings } from '@tko/binding.template'
import { bindings as ifBindings } from '@tko/binding.if'

import { prepareTestNode } from '../../utils/helpers/mocha-test-helpers'

describe('BindingHandler behaviors', function () {
  let bindingHandlers

  let testNode: HTMLElement
  beforeEach(function () {
    testNode = prepareTestNode()
  })

  beforeEach(function () {
    // Set up the default binding handlers.
    const provider = new MultiProvider({ providers: [new VirtualProvider(), new DataBindProvider()] })
    options.bindingProviderInstance = provider
    bindingHandlers = provider.bindingHandlers
    bindingHandlers.set(coreBindings)
    bindingHandlers.set(templateBindings)
    bindingHandlers.set(ifBindings)
    options.onError = function (e) {
      throw e
    }
  })

  describe('BindingHandler class', function () {
    it("has a .computed() property with the node's lifecycle", function () {
      let instance
      let xCalls = 0,
        yCalls = 0
      bindingHandlers.fnHandler = class extends BindingHandler {
        v: Observable
        x: Observable
        y: Observable
        computed

        constructor(...args) {
          super(...args)
          const v = (this.v = koObservable(0))
          instance = this
          this.x = this.computed(() => {
            xCalls++
            v() // Add a dependency.
            expect(this).to.equal(instance)
            return 'x'
          })
          this.y = this.computed({
            read: () => {
              yCalls++
              v()
              expect(this).to.equal(instance)
              return 'y'
            }
          })
        }
      }
      testNode.innerHTML = '<i data-bind="fnHandler"></i>'
      applyBindings({}, testNode)
      expect(xCalls).to.equal(1)
      expect(yCalls).to.equal(1)
      expect(instance.x()).to.equal('x')
      expect(instance.y()).to.equal('y')
      expect(xCalls).to.equal(1)
      expect(yCalls).to.equal(1)
      instance.v(1)
      expect(xCalls).to.equal(2)
      expect(yCalls).to.equal(2)

      cleanNode(testNode)
      instance.v(2)
      // Re-computations have stopped.
      expect(xCalls).to.equal(2)
      expect(yCalls).to.equal(2)
    })

    it("has a .subscribe property with the node's lifecycle", function () {
      let obs = koObservable(),
        handlerInstance
      bindingHandlers.fnHandler = class extends BindingHandler {
        subscribe
        constructor(...args) {
          super(...args)
          handlerInstance = this
          this.subscribe(obs, this.cb)
        }
        cb() {
          expect(this).to.equal(handlerInstance)
        }
      }
      testNode.innerHTML = "<i data-bind='fnHandler'></i>"
      applyBindings({}, testNode)
      expect(obs.getSubscriptionsCount()).to.equal(1)
      cleanNode(testNode)
      expect(obs.getSubscriptionsCount()).to.equal(0)
    })

    it('registers a kind with HandlerClass.register', function () {
      class HC extends BindingHandler {}

      BindingHandler.registerBindingHandler(HC, 'testHCregistration')
      expect(bindingHandlers.testHCregistration).to.equal(HC)
    })
  })

  describe('Function binding handlers', function () {
    it('constructs the element with appropriate params', function () {
      const obj = { canary: 42 },
        viewModel = { param: obj }
      bindingHandlers.fnHandler = function (element, valueAccessor, allBindings, $data, $context) {
        expect(valueAccessor()).to.equal(obj)
        expect(element).to.equal(testNode.children[0])
        expect($data).to.equal(viewModel)
        expect($context).to.equal(contextFor(testNode.children[0]))
        expect(allBindings()['bx']).to.equal(43)
        expect(allBindings.get('bx')).to.equal(43)
      }
      testNode.innerHTML = "<p data-bind='fnHandler: param, bx: 43'>"
      applyBindings(viewModel, testNode)
    })

    it('calls the `fn.dispose` when cleaned up', function () {
      let viewModel = { x: koObservable(true) },
        instance = null,
        disposeCalled = 0
      bindingHandlers.fnHandler = function () {
        instance = this
      }
      bindingHandlers.fnHandler.dispose = function () {
        disposeCalled++
        expect(this).to.equal(instance)
      }
      testNode.innerHTML = '<b data-bind="if: x"><i data-bind="fnHandler"></i></b>'
      applyBindings(viewModel, testNode)
      expect(disposeCalled).to.equal(0)
      viewModel.x(false)
      expect(disposeCalled).to.equal(1)
    })

    it('does not error without a `dispose` property', function () {
      const viewModel = { x: koObservable(true) }
      bindingHandlers.fnHandler = function () {}
      testNode.innerHTML = '<b data-bind="if: x"><i data-bind="fnHandler"></i></b>'
      applyBindings(viewModel, testNode)
      viewModel.x(false)
    })

    it('virtual elements via fn::allowVirtualElements', function () {
      let called = 0
      bindingHandlers.fnHandler = function () {
        called++
      }
      bindingHandlers.fnHandler.allowVirtualElements = true
      testNode.innerHTML = '<b><!-- ko fnHandler --><!-- /ko --></b>'
      applyBindings({}, testNode)
      expect(called).to.equal(1)
    })

    it('virtual elements via fn.allowVirtualElements', function () {
      let called = 0
      bindingHandlers.fnHandler = function () {
        called++
      }
      bindingHandlers.fnHandler.allowVirtualElements = true
      testNode.innerHTML = '<b><!-- ko fnHandler --><!-- /ko --></b>'
      applyBindings({}, testNode)
      expect(called).to.equal(1)
    })

    it('errors when allowVirtualElements is not set', function () {
      let called = 0
      bindingHandlers.fnHandler = function () {
        called++
      }
      testNode.innerHTML = '<b><!-- ko fnHandler --><!-- /ko --></b>'

      expect(function () {
        applyBindings({}, testNode)
      }).to.throw("The binding 'fnHandler' cannot be used with virtual elements")
      expect(called).to.equal(0)
    })
  })
})
