import {
    domData, cleanNode, options, virtualElements
} from '@tko/utils'

import {
    observable as koObservable
} from '@tko/observable'

import type { Observable } from '@tko/observable'

import {
  MultiProvider
} from '@tko/provider.multi'

import {
  VirtualProvider
} from '@tko/provider.virtual'

import {
  DataBindProvider
} from '@tko/provider.databind'

import {
    applyBindings, BindingHandler, contextFor
} from '../dist'

import { bindings as coreBindings } from '@tko/binding.core'
import { bindings as templateBindings } from '@tko/binding.template'
import { bindings as ifBindings } from '@tko/binding.if'

import '@tko/utils/helpers/jasmine-13-helper'

describe('BindingHandler behaviors', function () {
  let bindingHandlers

  let testNode : HTMLElement
  beforeEach(function() { testNode = jasmine.prepareTestNode() })

  beforeEach(function () {
        // Set up the default binding handlers.
    let provider = new MultiProvider({providers: [
      new VirtualProvider(),
      new DataBindProvider()
    ]})
    options.bindingProviderInstance = provider
    bindingHandlers = provider.bindingHandlers
    bindingHandlers.set(coreBindings)
    bindingHandlers.set(templateBindings)
    bindingHandlers.set(ifBindings)
    options.onError = function (e) { throw e }
  })

  describe('BindingHandler class', function () {
    it("has a .computed() property with the node's lifecycle", function () {
      let instance
      let xCalls = 0,
        yCalls = 0
      bindingHandlers.fnHandler = class extends BindingHandler {

        v : Observable
        x : Observable
        y : Observable        
        computed;

        constructor (...args) {
          super(...args)
          let v = this.v = koObservable(0)
          instance = this
          this.x = this.computed(() => {
            xCalls++
            v()  // Add a dependency.
            expect(this).toEqual(instance)
            return 'x'
          })
          this.y = this.computed({
            read: () => {
              yCalls++
              v()
              expect(this).toEqual(instance)
              return 'y'
            }
          })
        }
      }
      testNode.innerHTML = '<i data-bind="fnHandler"></i>'
      applyBindings({}, testNode)
      expect(xCalls).toEqual(1)
      expect(yCalls).toEqual(1)
      expect(instance.x()).toEqual('x')
      expect(instance.y()).toEqual('y')
      expect(xCalls).toEqual(1)
      expect(yCalls).toEqual(1)
      instance.v(1)
      expect(xCalls).toEqual(2)
      expect(yCalls).toEqual(2)

      cleanNode(testNode)
      instance.v(2)
            // Re-computations have stopped.
      expect(xCalls).toEqual(2)
      expect(yCalls).toEqual(2)
    })

    it("has a .subscribe property with the node's lifecycle", function () {
      let obs = koObservable(),
        handlerInstance
      bindingHandlers.fnHandler = class extends BindingHandler {
        subscribe;
        constructor (...args) {
          super(...args)
          handlerInstance = this
          this.subscribe(obs, this.cb)
        }
        cb () {
          expect(this).toEqual(handlerInstance)
        }
      }
      testNode.innerHTML = "<i data-bind='fnHandler'></i>"
      applyBindings({}, testNode)
      expect(obs.getSubscriptionsCount()).toEqual(1)
      cleanNode(testNode)
      expect(obs.getSubscriptionsCount()).toEqual(0)
    })

    it('registers a kind with HandlerClass.register', function () {
      class HC extends BindingHandler {}

      BindingHandler.registerBindingHandler(HC, 'testHCregistration')
      expect(bindingHandlers.testHCregistration).toEqual(HC)
    })
  })

  describe('Function binding handlers', function () {
    it('constructs the element with appropriate params', function () {
      let obj = { 'canary': 42 },
        viewModel = {param: obj}
      bindingHandlers.fnHandler = function (element, valueAccessor, allBindings, $data, $context) {
        expect(valueAccessor()).toEqual(obj)
        expect(element).toEqual(testNode.children[0])
        expect($data).toEqual(viewModel)
        expect($context).toEqual(
                    contextFor(testNode.children[0]))
        expect(allBindings()['bx']).toEqual(43)
        expect(allBindings.get('bx')).toEqual(43)
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
        expect(this).toEqual(instance)
      }
      testNode.innerHTML = '<b data-bind="if: x"><i data-bind="fnHandler"></i></b>'
      applyBindings(viewModel, testNode)
      expect(disposeCalled).toEqual(0)
      viewModel.x(false)
      expect(disposeCalled).toEqual(1)
    })

    it('does not error without a `dispose` property', function () {
      let viewModel = { x: koObservable(true) }
      bindingHandlers.fnHandler = function () {}
      testNode.innerHTML = '<b data-bind="if: x"><i data-bind="fnHandler"></i></b>'
      applyBindings(viewModel, testNode)
      viewModel.x(false)
    })

    it('virtual elements via fn::allowVirtualElements', function () {
      let called = 0
      bindingHandlers.fnHandler = function () { called++ }
      bindingHandlers.fnHandler.allowVirtualElements = true
      testNode.innerHTML = '<b><!-- ko fnHandler --><!-- /ko --></b>'
      applyBindings({}, testNode)
      expect(called).toEqual(1)
    })

    it('virtual elements via fn.allowVirtualElements', function () {
      let called = 0
      bindingHandlers.fnHandler = function () { called++ }
      bindingHandlers.fnHandler.allowVirtualElements = true
      testNode.innerHTML = '<b><!-- ko fnHandler --><!-- /ko --></b>'
      applyBindings({}, testNode)
      expect(called).toEqual(1)
    })

    it('errors when allowVirtualElements is not set', function () {
      let called = 0
      bindingHandlers.fnHandler = function () { called++ }
      testNode.innerHTML = '<b><!-- ko fnHandler --><!-- /ko --></b>'

      expect(function () {
        applyBindings({}, testNode)
      }).toThrowContaining('The binding \'fnHandler\' cannot be used with virtual elements')
      expect(called).toEqual(0)
    })
  })
})
