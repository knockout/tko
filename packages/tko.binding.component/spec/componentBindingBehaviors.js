
import {
    options, tasks, domData, triggerEvent, cleanNode
} from 'tko.utils'

import {
    observableArray, observable, isWritableObservable
} from 'tko.observable'

import { MultiProvider } from 'tko.provider.multi'
import { DataBindProvider } from 'tko.provider.databind'
import { VirtualProvider } from 'tko.provider.virtual'
import { ComponentProvider } from 'tko.provider.component'

import {
    applyBindings, dataFor
} from 'tko.bind'

import {
    bindings as coreBindings
} from 'tko.binding.core'

import {
    bindings as templateBindings
} from 'tko.binding.template'

import {
    bindings as ifBindings
} from 'tko.binding.if'

import {
  bindings as componentBindings
} from '../src'

import components from 'tko.utils.component'

import {
    useMockForTasks
} from 'tko.utils/helpers/jasmine-13-helper.js'

describe('Components: Component binding', function () {
  var testComponentName = 'test-component',
    testComponentBindingValue,
    testComponentParams,
    outerViewModel

  beforeEach(function () {
    useMockForTasks(options)
    jasmine.prepareTestNode()
    testComponentParams = {}
    testComponentBindingValue = { name: testComponentName, params: testComponentParams }
    outerViewModel = { testComponentBindingValue: testComponentBindingValue, isOuterViewModel: true }
    testNode.innerHTML = '<div data-bind="component: testComponentBindingValue"></div>'

    var provider = new MultiProvider({
      providers: [
        new DataBindProvider(),
        new ComponentProvider(),
        new VirtualProvider()
      ]
    })
    options.bindingProviderInstance = provider

    provider.bindingHandlers.set(templateBindings)
    provider.bindingHandlers.set(ifBindings)
    provider.bindingHandlers.set(coreBindings)
    provider.bindingHandlers.set(componentBindings)
  })

  afterEach(function () {
    expect(tasks.resetForTesting()).toEqual(0)
    jasmine.Clock.reset()
    components.unregister(testComponentName)
  })

  it('Throws if no name is specified (name provided directly)', function () {
    testNode.innerHTML = '<div data-bind="component: \'\'"></div>'
    expect(function () { applyBindings(null, testNode) })
            .toThrowContaining('No component name specified')
  })

  it('Throws if no name is specified (using options object)', function () {
    delete testComponentBindingValue.name
    expect(function () { applyBindings(outerViewModel, testNode) })
            .toThrowContaining('No component name specified')
  })

  it('Throws if the component name is unknown', function () {
    expect(function () {
      applyBindings(outerViewModel, testNode)
      jasmine.Clock.tick(1)
    }).toThrow("Unknown component 'test-component'")
  })

  it('Throws if the component definition has no template', function () {
    components.register(testComponentName, {})
    expect(function () {
      applyBindings(outerViewModel, testNode)
      jasmine.Clock.tick(1)
    }).toThrow("Component 'test-component' has no template")
  })

  it('Controls descendant bindings', function () {
    components.register(testComponentName, { template: 'x' })
    testNode.innerHTML = '<div data-bind="if: true, component: $data"></div>'
    expect(function () { applyBindings(testComponentName, testNode) })
            .toThrowContaining('Multiple bindings (if and component) are trying to control descendant bindings of the same element.')

        // Even though applyBindings threw an exception, the component still gets bound (asynchronously)
    jasmine.Clock.tick(1)
  })

  it('Replaces the element\'s contents with a clone of the template', function () {
    var testTemplate = document.createDocumentFragment()
    testTemplate.appendChild(document.createElement('div'))
    testTemplate.appendChild(document.createTextNode(' '))
    testTemplate.appendChild(document.createElement('span'))
    testTemplate.childNodes[0].innerHTML = 'hello'
    testTemplate.childNodes[2].innerHTML = 'world'
    components.register(testComponentName, { template: testTemplate })

        // Bind using just the component name since we're not setting any params
    applyBindings({ testComponentBindingValue: testComponentName }, testNode)

        // See the template asynchronously shows up
    jasmine.Clock.tick(1)
    expect(testNode.childNodes[0]).toContainHtml('<div>hello</div> <span>world</span>')

        // Also be sure it's a clone
    expect(testNode.childNodes[0].childNodes[0]).not.toBe(testTemplate[0])
  })

  it('Passes params and componentInfo (with prepopulated element and templateNodes) to the component\'s viewmodel factory', function () {
    var componentConfig = {
      template: '<div data-bind="text: 123">I have been prepopulated and not bound yet</div>',
      viewModel: {
        createViewModel: function (params, componentInfo) {
          expect(componentInfo.element).toContainText('I have been prepopulated and not bound yet')
          expect(params).toBe(testComponentParams)
          expect(componentInfo.templateNodes.length).toEqual(3)
          expect(componentInfo.templateNodes[0]).toContainText('Here are some ')
          expect(componentInfo.templateNodes[1]).toContainText('template')
          expect(componentInfo.templateNodes[2]).toContainText(' nodes')
          expect(componentInfo.templateNodes[1].tagName.toLowerCase()).toEqual('em')

                    // verify that createViewModel is the same function and was called with the component definition as the context
          expect(this.createViewModel).toBe(componentConfig.viewModel.createViewModel)
          expect(this.template).toBeDefined()

          componentInfo.element.childNodes[0].setAttribute('data-bind', 'text: someValue')
          return { someValue: 'From the viewmodel' }
        }
      }
    }
    testNode.innerHTML = '<div data-bind="component: testComponentBindingValue">Here are some <em>template</em> nodes</div>'

    components.register(testComponentName, componentConfig)
    applyBindings(outerViewModel, testNode)
    jasmine.Clock.tick(1)

    expect(testNode).toContainText('From the viewmodel')
  })

  it('Handles absence of viewmodel by using the params', function () {
    components.register(testComponentName, { template: '<div data-bind="text: myvalue"></div>' })
    testComponentParams.myvalue = 'some parameter value'
    applyBindings(outerViewModel, testNode)
    jasmine.Clock.tick(1)

    expect(testNode.childNodes[0]).toContainHtml('<div data-bind="text: myvalue">some parameter value</div>')
  })

  it('Injects and binds the component synchronously if it is flagged as synchronous and loads synchronously', function () {
    components.register(testComponentName, {
      synchronous: true,
      template: '<div data-bind="text: myvalue"></div>',
      viewModel: function () { this.myvalue = 123 }
    })

        // Notice the absence of any 'jasmine.Clock.tick' call here. This is synchronous.
    applyBindings(outerViewModel, testNode)
    expect(testNode.childNodes[0]).toContainHtml('<div data-bind="text: myvalue">123</div>')
  })

  it('Injects and binds the component synchronously if it is flagged as synchronous and already cached, even if it previously loaded asynchronously', function () {
        // Set up a component that loads asynchronously, but is flagged as being injectable synchronously
    this.restoreAfter(window, 'require')
        // var requireCallbacks = {};
    window.require = function (moduleNames, callback) {
      expect(moduleNames[0]).toBe('testViewModelModule')
      setTimeout(function () {
        var constructor = function (params) {
          this.viewModelProperty = params
        }
        callback(constructor)
      }, 0)
    }

    components.register(testComponentName, {
      synchronous: true,
      template: '<div data-bind="text: viewModelProperty"></div>',
      viewModel: { require: 'testViewModelModule' }
    })

    var testList = observableArray(['first'])
    testNode.innerHTML = '<div data-bind="foreach: testList">' +
                                '<div data-bind="component: { name: \'test-component\', params: $data }"></div>' +
                             '</div>'

        // First injection is async, because the loader completes asynchronously
    applyBindings({ testList: testList }, testNode)
    expect(testNode.childNodes[0]).toContainText('')
    jasmine.Clock.tick(0)
    expect(testNode.childNodes[0]).toContainText('first')

        // Second (cached) injection is synchronous, because the component config says so.
        // Notice the absence of any 'jasmine.Clock.tick' call here. This is synchronous.
    testList.push('second')
    expect(testNode.childNodes[0]).toContainText('firstsecond', /* ignoreSpaces */ true) // Ignore spaces because old-IE is inconsistent
  })

  it('Creates a binding context with the correct parent', function () {
    components.register(testComponentName, {
      template: 'Parent is outer view model: <span data-bind="text: $parent.isOuterViewModel"></span>'
    })
    applyBindings(outerViewModel, testNode)
    jasmine.Clock.tick(1)

    expect(testNode.childNodes[0]).toContainText('Parent is outer view model: true')
  })

  it('Creates a binding context with $componentTemplateNodes giving the original child nodes', function () {
    components.register(testComponentName, {
      template: 'Start<span data-bind="template: { nodes: $componentTemplateNodes }"></span>End'
    })
    testNode.innerHTML = '<div data-bind="component: testComponentBindingValue"><em>original</em> child nodes</div>'
    applyBindings(outerViewModel, testNode)
    jasmine.Clock.tick(1)

    expect(testNode.childNodes[0]).toContainHtml('start<span data-bind="template: { nodes: $componenttemplatenodes }"><em>original</em> child nodes</span>end')
  })

  it('Creates a binding context with $component to reference the closest component viewmodel', function () {
    this.after(function () {
      components.unregister('sub-component')
    })

    components.register(testComponentName, {
      template: '<span data-bind="with: { childContext: 123 }">' +
                          'In child context <!-- ko text: childContext --><!-- /ko -->, ' +
                          'inside component with property <!-- ko text: $component.componentProp --><!-- /ko -->. ' +
                          '<div data-bind="component: \'sub-component\'"></div>' +
                      '</span>',
      viewModel: function () { return { componentProp: 456 } }
    })

        // See it works with nesting - $component always refers to the *closest* component root
    components.register('sub-component', {
      template: 'Now in sub-component with property <!-- ko text: $component.componentProp --><!-- /ko -->.',
      viewModel: function () { return { componentProp: 789 } }
    })

    applyBindings(outerViewModel, testNode)
    jasmine.Clock.tick(1)

    expect(testNode.childNodes[0]).toContainText('In child context 123, inside component with property 456. Now in sub-component with property 789.', /* ignoreSpaces */ true) // Ignore spaces because old-IE is inconsistent
  })

  it('Passes nonobservable params to the component', function () {
        // Set up a component that logs its constructor params
    var receivedParams = []
    components.register(testComponentName, {
      viewModel: function (params) { receivedParams.push(params) },
      template: 'Ignored'
    })
    testComponentParams.someValue = 123

        // Instantiate it
    applyBindings(outerViewModel, testNode)
    jasmine.Clock.tick(1)

        // See the params arrived as expected
    expect(receivedParams).toEqual([testComponentParams])
    expect(testComponentParams.someValue).toBe(123) // Just to be sure it doesn't get mutated
  })

  it('Passes through observable params without unwrapping them (so a given component instance can observe them changing)', function () {
        // Set up a component that logs its constructor params
    var receivedParams = []
    components.register(testComponentName, {
      viewModel: function (params) {
        receivedParams.push(params)
        this.someValue = params.someValue
      },
      template: 'The value is <span data-bind="text: someValue"></span>.'
    })
    testComponentParams.someValue = observable(123)

        // Instantiate it
    applyBindings(outerViewModel, testNode)
    jasmine.Clock.tick(1)

        // See the params arrived as expected
    expect(receivedParams).toEqual([testComponentParams])
    expect(testNode).toContainText('The value is 123.')

        // Mutating the observable doesn't trigger creation of a new component
    testComponentParams.someValue(456)
    expect(receivedParams.length).toBe(1) // i.e., no additional constructor call occurred
    expect(testNode).toContainText('The value is 456.')
  })

  it('Supports observable component names, rebuilding the component if the name changes, disposing the old viewmodel and nodes', function () {
    this.after(function () {
      components.unregister('component-alpha')
      components.unregister('component-beta')
    })

    function alphaViewModel (params) { this.alphaValue = params.suppliedValue }
    function betaViewModel (params) { this.betaValue = params.suppliedValue }

    alphaViewModel.prototype.dispose = function () {
      expect(arguments.length).toBe(0)
      this.alphaWasDisposed = true

            // Disposal happens *before* the DOM is torn down, in case some custom cleanup is required
            // Note that you'd have to have captured the element via createViewModel, so this is only
            // for extensibility scenarios - we don't generally recommend that component viewmodels
            // should interact directly with their DOM, as that breaks MVVM encapsulation.
      expect(testNode).toContainText('Alpha value is 234.')
    }

    components.register('component-alpha', {
      viewModel: alphaViewModel,
      template: '<div class="alpha">Alpha value is <span data-bind="text: alphaValue"></span>.</div>'
    })

    components.register('component-beta', {
      viewModel: betaViewModel,
      template: '<div class="beta">Beta value is <span data-bind="text: betaValue"></span>.</div>'
    })

        // Instantiate the first component
    testComponentBindingValue.name = observable('component-alpha')
    testComponentParams.suppliedValue = observable(123)
    applyBindings(outerViewModel, testNode)
    jasmine.Clock.tick(1)

        // See it appeared, and the expected subscriptions were registered
    var firstAlphaTemplateNode = testNode.firstChild.firstChild,
      alphaViewModelInstance = dataFor(firstAlphaTemplateNode)
    expect(firstAlphaTemplateNode.className).toBe('alpha')
    expect(testNode).toContainText('Alpha value is 123.')
    expect(testComponentBindingValue.name.getSubscriptionsCount()).toBe(1)
    expect(testComponentParams.suppliedValue.getSubscriptionsCount()).toBe(1)
    expect(alphaViewModelInstance.alphaWasDisposed).not.toBe(true)

        // Store some data on a DOM node so we can check it was cleaned later
    domData.set(firstAlphaTemplateNode, 'TestValue', 'Hello')

        // Mutating an observable param doesn't change the set of subscriptions or replace the DOM nodes
    testComponentParams.suppliedValue(234)
    expect(testNode).toContainText('Alpha value is 234.')
    expect(testComponentBindingValue.name.getSubscriptionsCount()).toBe(1)
    expect(testComponentParams.suppliedValue.getSubscriptionsCount()).toBe(1)
    expect(testNode.firstChild.firstChild).toBe(firstAlphaTemplateNode) // Same node
    expect(domData.get(firstAlphaTemplateNode, 'TestValue')).toBe('Hello') // Not cleaned
    expect(alphaViewModelInstance.alphaWasDisposed).not.toBe(true)

        // Can switch to the other component by observably changing the component name,
        // but it happens asynchronously (because the component has to be loaded)
    testComponentBindingValue.name('component-beta')
    expect(testNode).toContainText('Alpha value is 234.')
    jasmine.Clock.tick(1)
    expect(testNode).toContainText('Beta value is 234.')

        // Cleans up by disposing obsolete subscriptions, viewmodels, and cleans DOM nodes
    expect(testComponentBindingValue.name.getSubscriptionsCount()).toBe(1)
    expect(testComponentParams.suppliedValue.getSubscriptionsCount()).toBe(1)
    expect(domData.get(firstAlphaTemplateNode, 'TestValue')).toBe(undefined) // Got cleaned
    expect(alphaViewModelInstance.alphaWasDisposed).toBe(true)
  })

  it('Supports binding to an observable that contains name/params, rebuilding the component if that observable changes, disposing the old viewmodel and nodes', function () {
    this.after(function () {
      components.unregister('component-alpha')
      components.unregister('component-beta')
    })

    function alphaViewModel (params) { this.alphaValue = params.suppliedValue }
    function betaViewModel (params) { this.betaValue = params.suppliedValue }

    alphaViewModel.prototype.dispose = function () {
      expect(arguments.length).toBe(0)
      this.alphaWasDisposed = true

            // Disposal happens *before* the DOM is torn down, in case some custom cleanup is required
            // Note that you'd have to have captured the element via createViewModel, so this is only
            // for extensibility scenarios - we don't generally recommend that component viewmodels
            // should interact directly with their DOM, as that breaks MVVM encapsulation.
      expect(testNode).toContainText('Alpha value is 123.')
    }

    components.register('component-alpha', {
      viewModel: alphaViewModel,
      template: '<div class="alpha">Alpha value is <span data-bind="text: alphaValue"></span>.</div>'
    })

    components.register('component-beta', {
      viewModel: betaViewModel,
      template: '<div class="beta">Beta value is <span data-bind="text: betaValue"></span>.</div>'
    })

    outerViewModel.testComponentBindingValue = observable({
      name: 'component-alpha',
      params: {
        suppliedValue: 123
      }
    })

        // Instantiate the first component
    applyBindings(outerViewModel, testNode)
    jasmine.Clock.tick(1)

        // See it appeared, and the expected subscriptions were registered
    var firstAlphaTemplateNode = testNode.firstChild.firstChild,
      alphaViewModelInstance = dataFor(firstAlphaTemplateNode)
    expect(firstAlphaTemplateNode.className).toBe('alpha')
    expect(testNode).toContainText('Alpha value is 123.')
    expect(outerViewModel.testComponentBindingValue.getSubscriptionsCount()).toBe(1)
    expect(alphaViewModelInstance.alphaWasDisposed).not.toBe(true)

        // Store some data on a DOM node so we can check it was cleaned later
    domData.set(firstAlphaTemplateNode, 'TestValue', 'Hello')

        // Can switch to the other component by changing observable,
        // but it happens asynchronously (because the component has to be loaded)
    outerViewModel.testComponentBindingValue({
      name: 'component-beta',
      params: {
        suppliedValue: 456
      }
    })

    expect(testNode).toContainText('Alpha value is 123.')
    jasmine.Clock.tick(1)
    expect(testNode).toContainText('Beta value is 456.')

        // Cleans up by disposing obsolete subscriptions, viewmodels, and cleans DOM nodes
    expect(outerViewModel.testComponentBindingValue.getSubscriptionsCount()).toBe(1)
    expect(domData.get(firstAlphaTemplateNode, 'TestValue')).toBe(undefined) // Got cleaned
    expect(alphaViewModelInstance.alphaWasDisposed).toBe(true)
  })

  it('Rebuilds the component if params change in a way that is forced to unwrap inside the binding, disposing the old viewmodel and nodes', function () {
    function testViewModel (params) {
      this.myData = params.someData
    }
    testViewModel.prototype.dispose = function () {
      this.wasDisposed = true
    }

    components.register(testComponentName, {
      viewModel: testViewModel,
      template: '<div>Value is <span data-bind="text: myData"></span>.</div>'
    })

        // Instantiate the first component, via a binding that unwraps an observable before it reaches the component
    var someObservable = observable('First')
    testNode.innerHTML = '<div data-bind="component: { name: \'' + testComponentName + '\', params: { someData: someObservable() } }"></div>'
    applyBindings({ someObservable: someObservable }, testNode)
    jasmine.Clock.tick(1)

    var firstTemplateNode = testNode.firstChild.firstChild,
      firstViewModelInstance = dataFor(firstTemplateNode)
    expect(firstViewModelInstance instanceof testViewModel).toBe(true)
    expect(testNode).toContainText('Value is First.')
    expect(firstViewModelInstance.wasDisposed).not.toBe(true)
    domData.set(firstTemplateNode, 'TestValue', 'Hello')

        // Make an observable change that forces the component to rebuild (asynchronously, for consistency)
    someObservable('Second')
    expect(testNode).toContainText('Value is First.')
    expect(firstViewModelInstance.wasDisposed).not.toBe(true)
    expect(domData.get(firstTemplateNode, 'TestValue')).toBe('Hello')
    jasmine.Clock.tick(1)
    expect(testNode).toContainText('Value is Second.')
    expect(firstViewModelInstance.wasDisposed).toBe(true)
    expect(domData.get(firstTemplateNode, 'TestValue')).toBe(undefined)

        // New viewmodel is a new instance
    var secondViewModelInstance = dataFor(testNode.firstChild.firstChild)
    expect(secondViewModelInstance instanceof testViewModel).toBe(true)
    expect(secondViewModelInstance).not.toBe(firstViewModelInstance)
  })

  it('Is possible to pass expressions that can vary observably and evaluate as writable observable instances', function () {
        // This spec is copied, with small modifications, from customElementBehaviors.js to show that the same component
        // definition can be used with the component binding and with custom elements.
    var constructorCallCount = 0
    components.register('test-component', {
      template: '<input data-bind="value: myval"/>',
      viewModel: function (params) {
        constructorCallCount++
        this.myval = params.somevalue

                // See we received a writable observable
        expect(isWritableObservable(this.myval)).toBe(true)
      }
    })

        // Bind to a viewmodel with nested observables; see the expression is evaluated as expected
        // The component itself doesn't have to know or care that the supplied value is nested - the
        // custom element syntax takes care of producing a single computed property that gives the
        // unwrapped inner value.
    var innerObservable = observable('inner1'),
      outerObservable = observable({ inner: innerObservable })
    testNode.innerHTML = '<div data-bind="component: { name: \'' + testComponentName + '\', params: { somevalue: outer().inner } }"></div>'
    applyBindings({ outer: outerObservable }, testNode)
    jasmine.Clock.tick(1)
    expect(testNode.childNodes[0].childNodes[0].value).toEqual('inner1')
    expect(outerObservable.getSubscriptionsCount()).toBe(1)
    expect(innerObservable.getSubscriptionsCount()).toBe(1)
    expect(constructorCallCount).toBe(1)

        // See we can mutate the inner value and see the result show up
    innerObservable('inner2')
    expect(testNode.childNodes[0].childNodes[0].value).toEqual('inner2')
    expect(outerObservable.getSubscriptionsCount()).toBe(1)
    expect(innerObservable.getSubscriptionsCount()).toBe(1)
    expect(constructorCallCount).toBe(1)

        // See that we can mutate the observable from within the component
    testNode.childNodes[0].childNodes[0].value = 'inner3'
    triggerEvent(testNode.childNodes[0].childNodes[0], 'change')
    expect(innerObservable()).toEqual('inner3')

        // See we can mutate the outer value and see the result show up (cleaning subscriptions to the old inner value)
    var newInnerObservable = observable('newinner')
    outerObservable({ inner: newInnerObservable })
    jasmine.Clock.tick(1)              // modifying the outer observable causes the component to reload, which happens asynchronously
    expect(testNode.childNodes[0].childNodes[0].value).toEqual('newinner')
    expect(outerObservable.getSubscriptionsCount()).toBe(1)
    expect(innerObservable.getSubscriptionsCount()).toBe(0)
    expect(newInnerObservable.getSubscriptionsCount()).toBe(1)
    expect(constructorCallCount).toBe(2)

        // See that we can mutate the new observable from within the component
    testNode.childNodes[0].childNodes[0].value = 'newinner2'
    triggerEvent(testNode.childNodes[0].childNodes[0], 'change')
    expect(newInnerObservable()).toEqual('newinner2')
    expect(innerObservable()).toEqual('inner3')    // original one hasn't changed

        // See that subscriptions are disposed when the component is
    cleanNode(testNode)
    expect(outerObservable.getSubscriptionsCount()).toBe(0)
    expect(innerObservable.getSubscriptionsCount()).toBe(0)
    expect(newInnerObservable.getSubscriptionsCount()).toBe(0)
  })

  it('Disposes the viewmodel if the element is cleaned', function () {
    class TestViewModel {
      dispose () { this.wasDisposed = true }
        }

    components.register(testComponentName, {
      viewModel: TestViewModel,
      template: '<div>Ignored</div>'
    })

        // Bind an instance of the component; grab its viewmodel
    applyBindings(outerViewModel, testNode)
    jasmine.Clock.tick(1)
    var firstTemplateNode = testNode.firstChild.firstChild,
      viewModelInstance = dataFor(firstTemplateNode)
    expect(viewModelInstance instanceof TestViewModel).toBe(true)
    expect(viewModelInstance.wasDisposed).not.toBe(true)

        // See that cleaning the associated element automatically disposes the viewmodel
    cleanNode(testNode.firstChild)
    expect(viewModelInstance.wasDisposed).toBe(true)
  })

  it('Does not inject the template or instantiate the viewmodel if the element was cleaned before component loading completed', function () {
    var numConstructorCalls = 0
    components.register(testComponentName, {
      viewModel: function () { numConstructorCalls++ },
      template: '<div>Should not be used</div>'
    })

        // Bind an instance of the component; grab its viewmodel
    applyBindings(outerViewModel, testNode)

        // Before the component finishes loading, clean the DOM
    cleanNode(testNode.firstChild)

        // Now wait and see that, after loading finishes, the component wasn't used
    jasmine.Clock.tick(1)
    expect(numConstructorCalls).toBe(0)
    expect(testNode.firstChild).toContainHtml('')
  })

  it('Disregards component load completions that are no longer relevant', function () {
        // This spec addresses the possibility of a race condition: if you change the
        // component name faster than the component loads complete, then we need to
        // ignore any load completions that don't correspond to the latest name.
        // Otherwise it's inefficient if the loads complete in order (pointless extra
        // binding), and broken if they complete out of order (wrong final result).

        // Set up a mock module loader, so we can control asynchronous load completion
    this.restoreAfter(window, 'require')
    var requireCallbacks = {}
    window.require = function (moduleNames, callback) {
      expect(moduleNames.length).toBe(1) // In this scenario, it always will be
      expect(moduleNames[0] in requireCallbacks).toBe(false) // In this scenario, we only require each module once
      requireCallbacks[moduleNames[0]] = callback
    }

        // Define four separate components so we can switch between them
    var constructorCallLog = []
    function testViewModel1 (params) { constructorCallLog.push([1, params]) }
    function testViewModel2 (params) { constructorCallLog.push([2, params]) }
    function testViewModel3 (params) { constructorCallLog.push([3, params]) }
    function testViewModel4 (params) { constructorCallLog.push([4, params]) }
    testViewModel3.prototype.dispose = function () { this.wasDisposed = true }
    components.register('component-1', { viewModel: { require: 'module-1' }, template: '<div>Component 1 template</div>' })
    components.register('component-2', { viewModel: { require: 'module-2' }, template: '<div>Component 2 template</div>' })
    components.register('component-3', { viewModel: { require: 'module-3' }, template: '<div>Component 3 template</div>' })
    components.register('component-4', { viewModel: { require: 'module-4' }, template: '<div>Component 4 template</div>' })
    this.after(function () {
      for (var i = 0; i < 4; i++) {
        components.unregister('component-' + i)
      }
    })

        // Start by requesting component 1
    testComponentBindingValue.name = observable('component-1')
    applyBindings(outerViewModel, testNode)

        // Even if we wait a while, it's not yet loaded, because we're still waiting for the module
    jasmine.Clock.tick(10)
    expect(constructorCallLog.length).toBe(0)
    expect(testNode.firstChild.childNodes.length).toBe(0)

        // In the meantime, switch to requesting component 2 and then 3
    testComponentBindingValue.name('component-2')
    jasmine.Clock.tick(1)
    testComponentBindingValue.name('component-3')
    expect(constructorCallLog.length).toBe(0)

        // Now if component 1 finishes loading, it's irrelevant, so nothing happens
    requireCallbacks['module-1'](testViewModel1)
    jasmine.Clock.tick(1) // ... even if we wait a bit longer
    expect(constructorCallLog.length).toBe(0)
    expect(testNode.firstChild.childNodes.length).toBe(0)

        // Now if component 3 finishes loading, it's the current one, so we instantiate and bind to it.
        // Notice this happens synchronously (at least, relative to the time now), because the completion
        // is already asynchronous relative to when it began.
    requireCallbacks['module-3'](testViewModel3)
    expect(constructorCallLog).toEqual([ [3, testComponentParams] ])
    expect(testNode).toContainText('Component 3 template')
    var viewModelInstance = dataFor(testNode.firstChild.firstChild)
    expect(viewModelInstance instanceof testViewModel3).toBe(true)
    expect(viewModelInstance.wasDisposed).not.toBe(true)

        // Now if component 2 finishes loading, it's irrelevant, so nothing happens.
        // In particular, the viewmodel isn't disposed.
    requireCallbacks['module-2'](testViewModel2)
    jasmine.Clock.tick(1) // ... even if we wait a bit longer
    expect(constructorCallLog.length).toBe(1)
    expect(testNode).toContainText('Component 3 template')
    expect(viewModelInstance.wasDisposed).not.toBe(true)

        // However, if we now switch to component 2, the old viewmodel is disposed,
        // and the new component is used without any further module load calls.
    testComponentBindingValue.name('component-2')
    jasmine.Clock.tick(1)
    expect(constructorCallLog.length).toBe(2)
    expect(testNode).toContainText('Component 2 template')
    expect(viewModelInstance.wasDisposed).toBe(true)

        // Show also that we won't leak memory by applying bindings to nodes
        // after they were disposed (e.g., because they were removed from the document)
    testComponentBindingValue.name('component-4')
    jasmine.Clock.tick(1)
    cleanNode(testNode.firstChild) // Dispose the node before the module loading completes
    requireCallbacks['module-4'](testViewModel4)
    expect(constructorCallLog.length).toBe(2) // No extra constructor calls
    expect(testNode).toContainText('Component 2 template') // No attempt to modify the DOM
  })

  it('Supports virtual elements', function () {
    testNode.innerHTML = 'Hello! <!-- ko component: testComponentBindingValue -->&nbsp;<!-- /ko --> Goodbye.'
    components.register(testComponentName, {
      template: 'Your param is <span data-bind="text: someData">&nbsp;</span>'
    })
    testComponentParams.someData = observable(123)

    applyBindings(outerViewModel, testNode)
    jasmine.Clock.tick(1)
    expect(testNode).toContainText('Hello! Your param is 123 Goodbye.')

    testComponentParams.someData(456)
    expect(testNode).toContainText('Hello! Your param is 456 Goodbye.')
  })

  it('Should call a childrenComplete callback function', function () {
    testNode.innerHTML = '<div data-bind="component: testComponentBindingValue, childrenComplete: callback"></div>'
    components.register(testComponentName, { template: '<div data-bind="text: myvalue"></div>' })
    testComponentParams.myvalue = 'some parameter value'

    var callbacks = 0
    outerViewModel.callback = function (nodes, data) {
      expect(nodes.length).toEqual(1)
      expect(nodes[0]).toEqual(testNode.childNodes[0].childNodes[0])
      expect(data).toEqual(testComponentParams)
      callbacks++
    }

    applyBindings(outerViewModel, testNode)
    expect(callbacks).toEqual(0)

    jasmine.Clock.tick(1)
    expect(testNode.childNodes[0]).toContainHtml('<div data-bind="text: myvalue">some parameter value</div>')
    expect(callbacks).toEqual(1)
  })

  describe('Component `bindingHandlers`', function () {
    it('overloads existing and provides new bindings', function () {
      const calls = []
      testNode.innerHTML = `<with-my-bindings></with-my-bindings>`

      class ViewModel {
        getBindingHandler (bindingKey) {
          return {
            text: () => calls.push('text'),
            text2: () => calls.push('text2')
          }[bindingKey]
        }
        }

      const template = `
          <span data-bind='text: "123"'></span>
          <span data-bind='text2: "123"'></span>`

      components.register('with-my-bindings', {viewModel: ViewModel, template, synchronous: true})
      applyBindings({}, testNode)
      expect(calls).toEqual(['text', 'text2'])
    })
  })

  describe('Does not automatically subscribe to any observables you evaluate during createViewModel or a viewmodel constructor', function () {
        // This clarifies that, if a developer wants to react when some observable parameter
        // changes, then it's their responsibility to subscribe to it or use a computed.
        // We don't rebuild the component just because you evaluated an observable from inside
        // your viewmodel constructor, just like we don't if you evaluate one elsewhere
        // in the viewmodel code.

    it('when loaded asynchronously', function () {
      components.register(testComponentName, {
        viewModel: {
          createViewModel: function (params/*, componentInfo */) {
            return { someData: params.someData() }
          }
        },
        template: '<div data-bind="text: someData"></div>'
      })

            // Bind an instance
      testComponentParams.someData = observable('First')
      applyBindings(outerViewModel, testNode)
      jasmine.Clock.tick(1)
      expect(testNode).toContainText('First')
      expect(testComponentParams.someData.getSubscriptionsCount()).toBe(0)

            // See that changing the observable will have no effect
      testComponentParams.someData('Second')
      jasmine.Clock.tick(1)
      expect(testNode).toContainText('First')
    })

    it('when loaded synchronously', function () {
      components.register(testComponentName, {
        synchronous: true,
        viewModel: {
          createViewModel: function (params/*, componentInfo */) {
            return { someData: params.someData() }
          }
        },
        template: '<div data-bind="text: someData"></div>'
      })

            // Bind an instance
      testComponentParams.someData = observable('First')
      applyBindings(outerViewModel, testNode)
      expect(testNode).toContainText('First')
      expect(testComponentParams.someData.getSubscriptionsCount()).toBe(0)

            // See that changing the observable will have no effect
      testComponentParams.someData('Second')
      expect(testNode).toContainText('First')
    })

    it('when cached component is loaded synchronously', function () {
      components.register(testComponentName, {
        synchronous: true,
        viewModel: {
          createViewModel: function (params/*, componentInfo */) {
            return { someData: params.someData() }
          }
        },
        template: '<div data-bind="text: someData"></div>'
      })

            // Load the component manually so that the next load happens from the cache
      components.get(testComponentName, function () {})

            // Bind an instance
      testComponentParams.someData = observable('First')
      applyBindings(outerViewModel, testNode)
      expect(testNode).toContainText('First')
      expect(testComponentParams.someData.getSubscriptionsCount()).toBe(0)

            // See that changing the observable will have no effect
      testComponentParams.someData('Second')
      expect(testNode).toContainText('First')
    })
  })

  describe('jsx', function () {
    it('accepts and uses jsx', function () {
      class ViewModel extends components.ComponentABC {
        static get template () {
          return {
            elementName: 'div',
            attributes: { attr: '123' },
            children: ['téxt']
          }
        }
      }

      ViewModel.register('test-component')

      applyBindings(outerViewModel, testNode)
      expect(testNode.children[0].innerHTML).toEqual('<div attr="123">téxt</div>')
    })

    it('updates jsx on changes', function () {
      const obs = observable('v0')
      const o2 = observable('text')
      class ViewModel extends components.ComponentABC {
        static get template () {
          // Passing <div attr={obs}>{o2}</div> through
          // babel-plugin-transform-jsx will yield:
          return {
            elementName: 'div',
            attributes: { attr: obs },
            children: [o2]
          }
        }
      }

      ViewModel.register('test-component')

      applyBindings(outerViewModel, testNode)
      expect(testNode.children[0].innerHTML).toEqual('<div attr="v0">text</div>')

      obs('v1')
      expect(testNode.children[0].innerHTML).toEqual('<div attr="v1">text</div>')

      obs(undefined)
      expect(testNode.children[0].innerHTML).toEqual('<div>text</div>')

      o2({ elementName: 'i', children: ['g'], attributes: {} })
      expect(testNode.children[0].innerHTML).toEqual('<div><i>g</i></div>')

      o2(undefined)
      expect(testNode.children[0].innerHTML).toEqual('<div><!--[jsx placeholder]--></div>')
    })
  })

  describe('slots', function () {
    it('inserts into <slot> content with the named slot template', function () {
      testNode.innerHTML = `
        <test-component>
          <template slot='alpha'>beep</template>
        </test-component>
      `
      class ViewModel extends components.ComponentABC {
        static get template () {
          return `
            <div>
              <i data-bind='slot: "alpha"'></i>
            </div>
          `
        }
      }
      ViewModel.register('test-component')

      applyBindings(outerViewModel, testNode)
      expect(testNode.children[0].innerText.trim()).toEqual(`beep`)
    })

    it('inserts into virtual element slot with the slot template', function () {
      testNode.innerHTML = `
        <test-component>
          <template slot='alpha'>beep</template>
        </test-component>
      `
      class ViewModel extends components.ComponentABC {
        static get template () {
          return `
            <div>
              <!-- ko slot: "alpha" --><!-- /ko -->
            </div>
          `
        }
      }
      ViewModel.register('test-component')

      applyBindings(outerViewModel, testNode)
      expect(testNode.children[0].innerText.trim()).toEqual(`beep`)
    })

    it('inserts multiple times into virtual element slot with the slot template', function () {
      testNode.innerHTML = `
        <test-component>
          <template slot='alpha'>beep</template>
        </test-component>
      `
      class ViewModel extends components.ComponentABC {
        static get template () {
          return `
            <div>
              <!-- ko slot: "alpha" --><!-- /ko -->
              <!-- ko slot: "alpha" --><!-- /ko -->
            </div>
          `
        }
      }
      ViewModel.register('test-component')

      applyBindings(outerViewModel, testNode)
      expect(testNode.children[0].innerText.trim()).toEqual(`beep beep`)
    })

    it('inserts into nested elements', function () {
      testNode.innerHTML = `
        <test-component>
          <template slot='alpha'>beep</template>
        </test-component>
      `
      class ViewModel extends components.ComponentABC {
        static get template () {
          return `
            <div><i><span>
              <!-- ko slot: "alpha" --><!-- /ko -->
            </span></i></div>
          `
        }
      }
      ViewModel.register('test-component')

      applyBindings(outerViewModel, testNode)
      expect(testNode.children[0].innerText.trim()).toEqual(`beep`)
    })

    it('inserts the node with the slot name', function () {
      testNode.innerHTML = `
        <test-component>
          <em slot='alpha'>beep</em>
        </test-component>
      `
      class ViewModel extends components.ComponentABC {
        static get template () {
          return `
            <div>
              <!-- ko slot: "alpha" --><!-- /ko -->
            </div>
          `
        }
      }
      ViewModel.register('test-component')

      applyBindings(outerViewModel, testNode)
      expect(testNode.children[0].innerText.trim()).toEqual(`beep`)
      const em = testNode.children[0].children[0].children[0]
      expect(em.tagName).toEqual('EM')
      expect(em.getAttribute('slot')).toEqual('alpha')
    })

    it('ignores missing slots', function () {
      testNode.innerHTML = `
        <test-component>
          <template slot='beta'>beep</template>
        </test-component>
      `
      class ViewModel extends components.ComponentABC {
        static get template () {
          return `
            <div>
              <!-- ko slot: "alpha" --><!-- /ko -->
            </div>
          `
        }
      }
      ViewModel.register('test-component')

      applyBindings(outerViewModel, testNode)
      expect(testNode.children[0].innerText.trim()).toEqual(``)
    })

    it('preprocesses <slot> nodes', function () {
      testNode.innerHTML = `
        <test-component>
          <template slot='alpha'>beep</template>
        </test-component>
      `
      class ViewModel extends components.ComponentABC {
        static get template () {
          return `
            <div>
              <slot name='alpha'></slot>
            </div>
          `
        }
      }
      ViewModel.register('test-component')

      applyBindings(outerViewModel, testNode)
      expect(testNode.children[0].innerText.trim()).toEqual(`beep`)
    })
  })
})
