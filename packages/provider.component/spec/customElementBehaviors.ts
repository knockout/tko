
import {
    options, tasks, objectForEach, cleanNode, triggerEvent
} from '@tko/utils'

import {
    observable, isWritableObservable, isObservable
} from '@tko/observable'

import {
    isComputed
} from '@tko/computed'

import { MultiProvider } from '@tko/provider.multi'
import { DataBindProvider } from '@tko/provider.databind'

import {
    applyBindings, dataFor
} from '@tko/bind'

import {
    bindings as coreBindings
} from '@tko/binding.core'

import {
    bindings as templateBindings
} from '@tko/binding.template'

import {
    bindings as ifBindings
} from '@tko/binding.if'

import components from '@tko/utils.component'

import {
  bindings as componentBindings
} from '@tko/binding.component'

import {ComponentProvider} from '../dist'

import {
    useMockForTasks
} from '@tko/utils/helpers/jasmine-13-helper'

describe('Components: Custom elements', function () {
  var bindingHandlers
  var testNode : HTMLElement

  beforeEach(function () {
    testNode = jasmine.prepareTestNode()
    useMockForTasks(options)
    var provider = new MultiProvider({
      providers: [new DataBindProvider(), new ComponentProvider()]
    })
    options.bindingProviderInstance = provider

    bindingHandlers = provider.bindingHandlers
    bindingHandlers.set(componentBindings)
    bindingHandlers.set(templateBindings)
    bindingHandlers.set(coreBindings)
    bindingHandlers.set(ifBindings)
  })

  afterEach(function () {
    expect(tasks.resetForTesting()).toEqual(0)
    jasmine.Clock.reset()
    components.unregister('test-component')
  })

  it('Inserts components into custom elements with matching names', function () {
    components.register('test-component', {
      template: 'custom element <span data-bind="text: 123"></span>'
    })
    var initialMarkup = '<div>hello <test-component></test-component></div>'
    testNode.innerHTML = initialMarkup

        // Since components are loaded asynchronously, it doesn't show up synchronously
    applyBindings(null, testNode)
    expect(testNode).toContainHtml(initialMarkup)

        // ... but when the component is loaded, it does show up
    jasmine.Clock.tick(1)
    expect(testNode).toContainHtml('<div>hello <test-component>custom element <span data-bind="text: 123">123</span></test-component></div>')
  })

  it('Inserts components into custom elements with matching non-dashed names', function () {
    if (jasmine.ieVersion || window.HTMLUnknownElement) {   // Phantomjs 1.x doesn't include HTMLUnknownElement and will fail this test
      this.after(function () { components.unregister('somefaroutname') })
      components.register('somefaroutname', {
        template: 'custom element <span data-bind="text: 123"></span>',
        ignoreCustomElementWarning: true
      })
      var initialMarkup = '<div>hello <somefaroutname></somefaroutname></div>'
      testNode.innerHTML = initialMarkup

            // Since components are loaded asynchronously, it doesn't show up synchronously
      applyBindings(null, testNode)
      expect(testNode).toContainHtml(initialMarkup)

            // ... but when the component is loaded, it does show up
      jasmine.Clock.tick(1)
      expect(testNode).toContainHtml('<div>hello <somefaroutname>custom element <span data-bind="text: 123">123</span></somefaroutname></div>')
    }
  })

  it('Does not insert components into standard elements with matching names', function () {
    this.after(function () { components.unregister('em') })
    components.register('em', {
      template: 'custom element <span data-bind="text: 123"></span>',
      ignoreCustomElementWarning: true
    })
    var initialMarkup = '<div>hello <em></em></div>'
    testNode.innerHTML = initialMarkup

    applyBindings(null, testNode)
    jasmine.Clock.tick(1)
    expect(testNode).toContainHtml(initialMarkup)
  })

  it('Is possible to override getComponentNameForNode to determine which component goes into which element', function () {
    const cp = new ComponentProvider()
    options.bindingProviderInstance = cp
    cp.bindingHandlers.set(componentBindings)
    cp.getComponentNameForNode = function (node) {
      return node.tagName === 'A' ? 'test-component' : null
    }
    components.register('test-component', {
      template: 'custom element'
    })

      // Set up a getComponentNameForNode function that maps "A" tags to
      // test-component.
    testNode.innerHTML = '<div>hello <a>&nbsp;</a> <b>ignored</b></div>'

      // See the component show up.
    applyBindings(null, testNode)
    jasmine.Clock.tick(1)
    expect(testNode).toContainHtml('<div>hello <a>custom element</a> <b>ignored</b></div>')
  })

  it('Is possible to have regular data-bind bindings on a custom element, as long as they don\'t attempt to control descendants', function () {
    components.register('test-component', {
      template: 'custom element'
    })
    testNode.innerHTML = '<test-component data-bind="visible: shouldshow"></test-component>'

        // Bind with a viewmodel that controls visibility
    var viewModel = { shouldshow: observable(true) }
    applyBindings(viewModel, testNode)
    jasmine.Clock.tick(1)
    expect(testNode).toContainHtml('<test-component data-bind="visible: shouldshow">custom element</test-component>')
    const node = testNode.childNodes[0] as HTMLElement;
    expect(node.style.display).not.toBe('none')

        // See that the 'visible' binding still works
    viewModel.shouldshow(false)
    expect(node.style.display).toBe('none')
    expect(node.innerHTML).toBe('custom element')
  })

  it('Is not possible to have regular data-bind bindings on a custom element if they also attempt to control descendants', function () {
    components.register('test-component', {
      template: 'custom element'
    })
    testNode.innerHTML = '<test-component data-bind="if: true"></test-component>'

    expect(function () { applyBindings(null, testNode) })
            .toThrowContaining('Multiple bindings (if and component) are trying to control descendant bindings of the same element.')

        // Even though applyBindings threw an exception, the component still gets bound (asynchronously)
    jasmine.Clock.tick(1)
  })

  it('Is possible to call applyBindings directly on a custom element', function () {
    components.register('test-component', {
      template: 'custom element'
    })
    testNode.innerHTML = '<test-component></test-component>'
    var customElem = testNode.childNodes[0] as HTMLElement;
    expect(customElem.tagName.toLowerCase()).toBe('test-component')

    applyBindings(null, customElem)
    jasmine.Clock.tick(1)
    expect(customElem.innerHTML).toBe('custom element')
  })

  it('Throws if you try to duplicate the \'component\' binding on a custom element that matches a component', function () {
    components.register('test-component', {
      template: 'custom element'
    })
    testNode.innerHTML = '<test-component data-bind="component: {}"></test-component>'

    expect(function () {
      applyBindings(null, testNode)
    }).toThrowContaining('The binding "component" is duplicated by multiple providers')
  })

  it('Is possible to pass literal values', function () {
    var suppliedParams = new Array()
    components.register('test-component', {
      template: 'Ignored',
      viewModel: function (params) {
        suppliedParams.push(params)

                // The raw value for each param is a computed giving the literal value
        objectForEach(params, function (key, value) {
          if (key !== '$raw') {
            expect(isComputed(params.$raw[key])).toBe(true)
            expect(params.$raw[key]()).toBe(value)
          }
        })
      }
    })

    testNode.innerHTML = '<test-component params="nothing: null, num: 123, bool: true, obj: { abc: 123 }, str: \'mystr\'"></test-component>'
    applyBindings(null, testNode)
    jasmine.Clock.tick(1)

    delete suppliedParams[0].$raw // Don't include '$raw' in the following assertion, as we only want to compare supplied values
    expect(suppliedParams).toEqual([{ nothing: null, num: 123, bool: true, obj: { abc: 123 }, str: 'mystr' }])
  })

  it('Supplies an empty params object (with empty $raw) if a custom element has no params attribute', function () {
    var suppliedParams = new Array
    components.register('test-component', {
      template: 'Ignored',
      viewModel: function (params) { suppliedParams.push(params) }
    })

    testNode.innerHTML = '<test-component></test-component>'
    applyBindings(null, testNode)
    jasmine.Clock.tick(1)
    expect(suppliedParams).toEqual([{ $raw: {} }])
  })

  it('Supplies an empty params object (with empty $raw) if a custom element has an empty whitespace params attribute', function () {
    var suppliedParams = new Array()
    components.register('test-component', {
      template: 'Ignored',
      viewModel: function (params) { suppliedParams.push(params) }
    })

    testNode.innerHTML = '<test-component params=" "></test-component>'
    applyBindings(null, testNode)
    jasmine.Clock.tick(1)
    expect(suppliedParams).toEqual([{ $raw: {} }])
  })

  it('Should not confuse parameters with bindings', function () {
    var called = false
    bindingHandlers.set({
      donotcall: function () { called = true }
    })

    components.register('test-component', {
      template: 'Ignore',
      synchronous: true
    })
    testNode.innerHTML = '<test-component params="donotcall: value"></test-component>'
    applyBindings({value: 123}, testNode)

        // The only binding it should look up is "component"
    expect(called).toBe(false)
  })

  it('Should update component when observable view model changes', function () {
    components.register('test-component', {
      template: '<p>the value: <span data-bind="text: textToShow"></span></p>'
    })

    testNode.innerHTML = '<test-component params="textToShow: value"></test-component>'
    var vm = observable({ value: 'A' })
    applyBindings(vm, testNode)
    jasmine.Clock.tick(1)
    expect(testNode).toContainText('the value: A')

    vm({ value: 'Z' })
    jasmine.Clock.tick(1)
    expect(testNode).toContainText('the value: Z')
  })

  it('Is possible to pass observable instances', function () {
    components.register('test-component', {
      template: '<p>the observable: <span data-bind="text: receivedobservable"></span></p>',
      viewModel: function (params) {
        this.receivedobservable = params.suppliedobservable
        expect(this.receivedobservable.subprop).toBe('subprop')
        this.dispose = function () { this.wasDisposed = true }

                // The $raw value for this param is a computed giving the observable instance
        expect(isComputed(params.$raw.suppliedobservable)).toBe(true)
        expect(params.$raw.suppliedobservable()).toBe(params.suppliedobservable)
      }
    })

        // See we can supply an observable instance, which is received with no wrapper around it
    var myobservable = observable(1)
    myobservable.subprop = 'subprop'
    testNode.innerHTML = '<test-component params="suppliedobservable: myobservable"></test-component>'
    applyBindings({ myobservable: myobservable }, testNode)
    jasmine.Clock.tick(1)
    const node = testNode.childNodes[0].childNodes[0] as HTMLElement;
    var viewModelInstance = dataFor(node)
    expect(testNode.firstChild).toContainText('the observable: 1')

        // See the observable instance can mutate, without causing the component to tear down
    myobservable(2)
    expect(testNode.firstChild).toContainText('the observable: 2')
    expect(dataFor(node)).toBe(viewModelInstance) // Didn't create a new instance
    expect(viewModelInstance.wasDisposed).not.toBe(true)
  })

  it('Is possible to pass expressions that can vary observably', function () {
    var rootViewModel = {
        myobservable: observable('Alpha')
      },
      constructorCallCount = 0

    components.register('test-component', {
      template: '<p>the string reversed: <span data-bind="text: receivedobservable"></span></p>',
      viewModel: function (params) {
        constructorCallCount++
        this.receivedobservable = params.suppliedobservable
        this.dispose = function () { this.wasDisposed = true }

                // See we didn't get the original observable instance. Instead we got a read-only computed property.
        expect(this.receivedobservable).not.toBe(rootViewModel.myobservable)
        expect(isComputed(this.receivedobservable)).toBe(true)
        expect(isWritableObservable(this.receivedobservable)).toBe(false)

                // The $raw value for this param is a computed property whose value is raw result
                // of evaluating the binding value. Since the raw result in this case is itself not
                // observable, it's the same value as the regular (non-$raw) supplied parameter.
        expect(isComputed(params.$raw.suppliedobservable)).toBe(true)
        expect(params.$raw.suppliedobservable()).toBe(params.suppliedobservable())
      }
    })

        // Bind, using an expression that evaluates the observable during binding
    testNode.innerHTML = '<test-component params=\'suppliedobservable: myobservable().split("").reverse().join("")\'></test-component>'
    applyBindings(rootViewModel, testNode)
    jasmine.Clock.tick(1)
    expect(testNode.firstChild).toContainText('the string reversed: ahplA')
    const node = testNode.childNodes[0].childNodes[0] as HTMLElement;
    var componentViewModelInstance = dataFor(node)
    expect(constructorCallCount).toBe(1)
    expect(rootViewModel.myobservable.getSubscriptionsCount()).toBe(1)

        // See that mutating the underlying observable modifies the supplied computed property,
        // but doesn't cause the component to tear down
    rootViewModel.myobservable('Beta')
    expect(testNode.firstChild).toContainText('the string reversed: ateB')
    expect(constructorCallCount).toBe(1)
    expect(dataFor(node)).toBe(componentViewModelInstance) // No new viewmodel needed
    expect(componentViewModelInstance.wasDisposed).not.toBe(true)
    expect(rootViewModel.myobservable.getSubscriptionsCount()).toBe(1) // No extra subscription needed

        // See also that subscriptions to the evaluated observables are disposed
        // when the custom element is cleaned
    cleanNode(testNode)
    expect(componentViewModelInstance.wasDisposed).toBe(true)
    expect(rootViewModel.myobservable.getSubscriptionsCount()).toBe(0)
  })

  it('Is possible to pass expressions that can vary observably and evaluate as writable observable instances', function () {
    var constructorCallCount = 0
    components.register('test-component', {
      template: '<input data-bind="value: myval"/>',
      viewModel: function (params) {
        constructorCallCount++
        this.myval = params.somevalue

                // See we received a writable observable
        expect(isWritableObservable(this.myval)).toBe(true)

                // See we received a computed, not either of the original observables
        expect(isComputed(this.myval)).toBe(true)

                // See we can reach the original inner observable directly if needed via $raw
                // (e.g., because it has subobservables or similar)
        var originalObservable = params.$raw.somevalue()
        expect(isObservable(originalObservable)).toBe(true)
        expect(isComputed(originalObservable)).toBe(false)
        if (originalObservable() === 'inner1') {
          expect(originalObservable).toBe(innerObservable) // See there's no wrapper
        }
      }
    })

        // Bind to a viewmodel with nested observables; see the expression is evaluated as expected
        // The component itself doesn't have to know or care that the supplied value is nested - the
        // custom element syntax takes care of producing a single computed property that gives the
        // unwrapped inner value.
    var innerObservable = observable('inner1'),
      outerObservable = observable({ inner: innerObservable })
    testNode.innerHTML = '<test-component params="somevalue: outer().inner"></test-component>'
    applyBindings({ outer: outerObservable }, testNode)
    jasmine.Clock.tick(1)
    const node = testNode.childNodes[0].childNodes[0] as HTMLInputElement;
    expect(node.value).toEqual('inner1')
    expect(outerObservable.getSubscriptionsCount()).toBe(1)
    expect(innerObservable.getSubscriptionsCount()).toBe(1)
    expect(constructorCallCount).toBe(1)

        // See we can mutate the inner value and see the result show up
    innerObservable('inner2')
    expect(node.value).toEqual('inner2')
    expect(outerObservable.getSubscriptionsCount()).toBe(1)
    expect(innerObservable.getSubscriptionsCount()).toBe(1)
    expect(constructorCallCount).toBe(1)

        // See that we can mutate the observable from within the component
    node.value = 'inner3'
    triggerEvent(node, 'change')
    expect(innerObservable()).toEqual('inner3')

        // See we can mutate the outer value and see the result show up (cleaning subscriptions to the old inner value)
    var newInnerObservable = observable('newinner')
    outerObservable({ inner: newInnerObservable })
    expect(node.value).toEqual('newinner')
    expect(outerObservable.getSubscriptionsCount()).toBe(1)
    expect(innerObservable.getSubscriptionsCount()).toBe(0)
    expect(newInnerObservable.getSubscriptionsCount()).toBe(1)
    expect(constructorCallCount).toBe(1)

        // See that we can mutate the new observable from within the component
    node.value = 'newinner2'
    triggerEvent(node, 'change')
    expect(newInnerObservable()).toEqual('newinner2')
    expect(innerObservable()).toEqual('inner3')    // original one hasn't changed

        // See that subscriptions are disposed when the component is
    cleanNode(testNode)
    expect(outerObservable.getSubscriptionsCount()).toBe(0)
    expect(innerObservable.getSubscriptionsCount()).toBe(0)
    expect(newInnerObservable.getSubscriptionsCount()).toBe(0)
  })

  it('Supplies any custom parameter called "$raw" in preference to the function that yields raw parameter values', function () {
    var constructorCallCount = 0,
      suppliedValue = {}
    components.register('test-component', {
      template: 'Ignored',
      viewModel: function (params) {
        constructorCallCount++
        expect(params.$raw).toBe(suppliedValue)
      }
    })

    testNode.innerHTML = '<test-component params="$raw: suppliedValue"></test-component>'
    applyBindings({ suppliedValue: suppliedValue }, testNode)
    jasmine.Clock.tick(1)
    expect(constructorCallCount).toBe(1)
  })

  it('Disposes the component when the custom element is cleaned', function () {


    interface myModel {
      wasDisposed : boolean
      dispose() : void
    }

    // This is really a behavior of the component binding, not custom elements.
    // This spec just shows that custom elements don't break it for any reason.
    var componentViewModel : myModel = {
      wasDisposed: false,
      dispose: function () {
        this.wasDisposed = true
      }
    }
    components.register('test-component', {
      template: 'custom element',
      viewModel: { instance: componentViewModel }
    })
    testNode.innerHTML = '<test-component></test-component>'

        // See it binds properly
    applyBindings(null, testNode)
    jasmine.Clock.tick(1)
    expect(testNode.firstChild).toContainHtml('custom element')

        // See the viewmodel is disposed when the corresponding DOM element is
    expect(componentViewModel.wasDisposed).not.toBe(true)
    cleanNode(testNode.firstChild!)
    expect(componentViewModel.wasDisposed).toBe(true)
  })

  it('Can nest custom elements', function () {
        // Note that, for custom elements to work properly on IE < 9, you *must*:
        // (1) Reference jQuery
        // (2) Register any component that will be used as a custom element
        //     (e.g., components.register(...)) *before* the browser parses any
        //     markup containing that custom element
        //
        // The reason for (2) is the same as the well-known issue that IE < 9 cannot
        // parse markup containing HTML5 elements unless you've already called
        // document.createElement(thatElementName) first. Our old-IE compatibility
        // code causes this to happen automatically for all registered components.
        //
        // The reason for (1) is that KO's built-in simpleHtmlParse logic uses .innerHTML
        // on a <div> that is not attached to any document, which means the trick from
        // (1) does not work. Referencing jQuery overrides the HTML parsing logic to
        // uses jQuery's, which uses a temporary document fragment, and our old-IE compatibility
        // code has patched createDocumentFragment to enable preregistered components
        // to act as custom elements in that document fragment. If we wanted, we could
        // amend simpleHtmlParse to use a document fragment, but it seems unlikely that
        // anyone targetting IE < 9 would not be using jQuery.

    this.after(function () {
      components.unregister('outer-component')
      components.unregister('inner-component')
    })

    components.register('inner-component', {
      template: 'the inner component with value [<span data-bind="text: innerval"></span>]'
    })
    components.register('outer-component', {
      template: 'the outer component [<inner-component params="innerval: outerval.innerval"></inner-component>] goodbye'
    })
    var initialMarkup = '<div>hello [<outer-component params="outerval: outerval"></outer-component>] world</div>'
    testNode.innerHTML = initialMarkup

    applyBindings({ outerval: { innerval: 'my value' } }, testNode)
    try {
      jasmine.Clock.tick(1)
      expect(testNode).toContainText('hello [the outer component [the inner component with value [my value]] goodbye] world')
    } catch (ex : any) {
      if (ex.message.indexOf('Unexpected call to method or property access.') >= 0) {
                // On IE < 9, this scenario is only supported if you have referenced jQuery.
                // So don't consider this to be a failure if jQuery isn't referenced.
        if (!window.jQuery) {
          return
        }
      }

      throw ex
    }
  })

  it('Is possible to set up components that receive, inject, and bind templates supplied by the user of the component (sometimes called "templated components" or "transclusion")', function () {
        // This spec repeats assertions made in other specs elsewhere, but is useful to prove the end-to-end technique

    this.after(function () {
      components.unregister('special-list')
    })

        // First define a reusable 'special-list' component that produces a <ul> in which the <li>s are filled with the supplied template
        // Note: It would be even simpler to write "template: { nodes: $componentTemplateNodes }", which would also work.
        //       However it's useful to have test coverage for the more longwinded approach of passing nodes via your
        //       viewmodel as well, so retaining the longer syntax for this test.
    components.register('special-list', {
      template: '<ul class="my-special-list" data-bind="foreach: specialListItems">' +
                    '<li data-bind="template: { nodes: $component.suppliedItemTemplate }">' +
                    '</li>' +
                    '</ul>',
      viewModel: {
        createViewModel: function (params, componentInfo) {
          return {
            specialListItems: params.items,
            suppliedItemTemplate: componentInfo.templateNodes
          }
        }
      }
    })

        // Now make some view markup that uses <special-list> and supplies a template to be used inside each list item
    testNode.innerHTML = '<h1>Cheeses</h1>' +
                           '<special-list params="items: cheeses">' +
                           '<em data-bind="text: name">x</em> has quality <em data-bind="text: quality">x</em>' +
                           '</special-list>'

        // Finally, bind it all to some data
    applyBindings({
      cheeses: [
                { name: 'brie', quality: 7 },
                { name: 'cheddar', quality: 9 },
                { name: 'roquefort', quality: 3 }
      ]
    }, testNode)

    jasmine.Clock.tick(1)
    expect(testNode.childNodes[0]).toContainText('Cheeses')
    const node = testNode.childNodes[1].childNodes[0] as HTMLElement
    expect(node.tagName.toLowerCase()).toEqual('ul')
    expect(node.className).toEqual('my-special-list')
    expect(node).toContainHtml(
            '<li data-bind="template: { nodes: $component.supplieditemtemplate }">' +
          '<em data-bind="text: name">brie</em> has quality <em data-bind="text: quality">7</em>' +
          '</li>' +
          '<li data-bind="template: { nodes: $component.supplieditemtemplate }">' +
          '<em data-bind="text: name">cheddar</em> has quality <em data-bind="text: quality">9</em>' +
          '</li>' +
          '<li data-bind="template: { nodes: $component.supplieditemtemplate }">' +
          '<em data-bind="text: name">roquefort</em> has quality <em data-bind="text: quality">3</em>' +
          '</li>'
        )
  })

  it('Should call an afterRender callback function', function () {
    components.register('test-component', { template: 'custom element'})
    testNode.innerHTML = '<test-component data-bind="afterRender: callback"></test-component>'

    var callbacks = 0,
      viewModel = {
        callback: function (nodes, data) {
          expect(nodes.length).toEqual(1)
          expect(nodes[0]).toEqual(testNode.childNodes[0].childNodes[0])
          expect(data).toEqual(undefined)
          callbacks++
        }
      }
    applyBindings(viewModel, testNode)
    expect(callbacks).toEqual(0)

    jasmine.Clock.tick(1)
    expect(testNode).toContainHtml('<test-component data-bind="afterrender: callback">custom element</test-component>')
  })
})
