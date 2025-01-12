import {
    triggerEvent, options
} from '@tko/utils'

import {
    applyBindings, contextFor
} from '@tko/bind'

import {
    observable, observableArray
} from '@tko/observable'

import { DataBindProvider } from '@tko/provider.databind'
import { VirtualProvider } from '@tko/provider.virtual'
import { MultiProvider } from '@tko/provider.multi'

import {bindings as templateBindings} from '@tko/binding.template'
import {bindings as coreBindings} from '@tko/binding.core'

import '@tko/utils/helpers/jasmine-13-helper'

describe('Binding: Using', function () {
  beforeEach(jasmine.prepareTestNode)

  beforeEach(function () {
    var provider = new MultiProvider({
      providers: [
        new DataBindProvider(),
        new VirtualProvider()
      ]
    })
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
    provider.bindingHandlers.set(templateBindings)
  })

  it('Should leave descendant nodes in the document (and bind them in the context of the supplied value) if the value is truthy', function () {
    testNode.innerHTML = "<div data-bind='using: someItem'><span data-bind='text: existentChildProp'></span></div>"
    expect(testNode.childNodes.length).toEqual(1)
    applyBindings({ someItem: { existentChildProp: 'Child prop value' } }, testNode)
    expect(testNode.childNodes[0].childNodes.length).toEqual(1)
    expect(testNode.childNodes[0].childNodes[0]).toContainText('Child prop value')
  })

  it('Should leave descendant nodes in the document (and bind them) if the value is falsy', function () {
    testNode.innerHTML = "<div data-bind='using: someItem'><span data-bind='text: $data'></span></div>"
    applyBindings({ someItem: null }, testNode)
    expect(testNode.childNodes[0].childNodes.length).toEqual(1)
    expect(testNode.childNodes[0].childNodes[0]).toContainText('')
  })

  it('Should leave descendant nodes unchanged and not bind them more than once if the supplied value notifies a change', function () {
    var countedClicks = 0
    var someItem = observable({
      childProp: observable('Hello'),
      handleClick: function () { countedClicks++ }
    })

    testNode.innerHTML = "<div data-bind='using: someItem'><span data-bind='text: childProp, click: handleClick'></span></div>"
    var originalNode = testNode.childNodes[0].childNodes[0]

    applyBindings({ someItem: someItem }, testNode)
    expect(testNode.childNodes[0].childNodes[0]).toEqual(originalNode)

        // Initial state is one subscriber, one click handler
    expect(testNode.childNodes[0].childNodes[0]).toContainText('Hello')
    expect(someItem().childProp.getSubscriptionsCount()).toEqual(1)
    triggerEvent(testNode.childNodes[0].childNodes[0], 'click')
    expect(countedClicks).toEqual(1)

        // Force "update" binding handler to fire, then check we still have one subscriber...
    someItem.valueHasMutated()
    expect(someItem().childProp.getSubscriptionsCount()).toEqual(1)

        // ... and one click handler
    countedClicks = 0
    triggerEvent(testNode.childNodes[0].childNodes[0], 'click')
    expect(countedClicks).toEqual(1)

        // and the node is still the same
    expect(testNode.childNodes[0].childNodes[0]).toEqual(originalNode)
  })

  it('Should be able to access parent binding context via $parent', function () {
    testNode.innerHTML = "<div data-bind='using: someItem'><span data-bind='text: $parent.parentProp'></span></div>"
    applyBindings({ someItem: { }, parentProp: 'Parent prop value' }, testNode)
    expect(testNode.childNodes[0].childNodes[0]).toContainText('Parent prop value')
  })

  it('Should be able to access all parent binding contexts via $parents, and root context via $root', function () {
    testNode.innerHTML = "<div data-bind='using: topItem'>" +
                                "<div data-bind='using: middleItem'>" +
                                    "<div data-bind='using: bottomItem'>" +
                                        "<span data-bind='text: name'></span>" +
                                        "<span data-bind='text: $parent.name'></span>" +
                                        "<span data-bind='text: $parents[1].name'></span>" +
                                        "<span data-bind='text: $parents[2].name'></span>" +
                                        "<span data-bind='text: $root.name'></span>" +
                                    '</div>' +
                                '</div>' +
                              '</div>'
    applyBindings({
      name: 'outer',
      topItem: {
        name: 'top',
        middleItem: {
          name: 'middle',
          bottomItem: {
            name: 'bottom'
          }
        }
      }
    }, testNode)
    var finalContainer = testNode.childNodes[0].childNodes[0].childNodes[0]
    expect(finalContainer.childNodes[0]).toContainText('bottom')
    expect(finalContainer.childNodes[1]).toContainText('middle')
    expect(finalContainer.childNodes[2]).toContainText('top')
    expect(finalContainer.childNodes[3]).toContainText('outer')
    expect(finalContainer.childNodes[4]).toContainText('outer')

        // Also check that, when we later retrieve the binding contexts, we get consistent results
    expect(contextFor(testNode).$data.name).toEqual('outer')
    expect(contextFor(testNode.childNodes[0]).$data.name).toEqual('outer')
    expect(contextFor(testNode.childNodes[0].childNodes[0]).$data.name).toEqual('top')
    expect(contextFor(testNode.childNodes[0].childNodes[0].childNodes[0]).$data.name).toEqual('middle')
    expect(contextFor(testNode.childNodes[0].childNodes[0].childNodes[0].childNodes[0]).$data.name).toEqual('bottom')
    var firstSpan = testNode.childNodes[0].childNodes[0].childNodes[0].childNodes[0]
    expect(firstSpan.tagName).toEqual('SPAN')
    expect(contextFor(firstSpan).$data.name).toEqual('bottom')
    expect(contextFor(firstSpan).$root.name).toEqual('outer')
    expect(contextFor(firstSpan).$parents[1].name).toEqual('top')
  })

  it('Should be able to define a \"using\" region using a containerless binding', function () {
    var someitem = observable({someItem: 'first value'})
    testNode.innerHTML = 'xxx <!-- ko using: someitem --><span data-bind="text: someItem"></span><!-- /ko -->'
    applyBindings({ someitem: someitem }, testNode)

    expect(testNode).toContainText('xxx first value')

    someitem({ someItem: 'second value' })
    expect(testNode).toContainText('xxx second value')
  })

  it('Should be able to use \"using\" within an observable top-level view model', function () {
    var vm = observable({someitem: observable({someItem: 'first value'})})
    testNode.innerHTML = 'xxx <!-- ko using: someitem --><span data-bind="text: someItem"></span><!-- /ko -->'
    applyBindings(vm, testNode)

    expect(testNode).toContainText('xxx first value')

    vm({someitem: observable({ someItem: 'second value' })})
    expect(testNode).toContainText('xxx second value')
  })

  it('Should be able to nest a template within \"using\"', function () {
    testNode.innerHTML = "<div data-bind='using: someitem'>" +
            "<div data-bind='foreach: childprop'><span data-bind='text: $data'></span></div></div>"

    var childprop = observableArray([])
    var someitem = observable({childprop: childprop})
    var viewModel = {someitem: someitem}
    applyBindings(viewModel, testNode)

        // First it's not there (by template)
    var container = testNode.childNodes[0]
    expect(container).toContainHtml('<div data-bind="foreach: childprop"></div>')

        // Then it's there
    childprop.push('me')
    expect(container).toContainHtml('<div data-bind="foreach: childprop"><span data-bind=\"text: $data\">me</span></div>')

        // Then there's a second one
    childprop.push('me2')
    expect(container).toContainHtml('<div data-bind="foreach: childprop"><span data-bind=\"text: $data\">me</span><span data-bind=\"text: $data\">me2</span></div>')

        // Then it changes
    someitem({childprop: ['notme']})
    expect(container).toContainHtml('<div data-bind="foreach: childprop"><span data-bind=\"text: $data\">notme</span></div>')
  })

  it('Should be able to nest a containerless template within \"using\"', function () {
    testNode.innerHTML = "<div data-bind='using: someitem'>text" +
            "<!-- ko foreach: childprop --><span data-bind='text: $data'></span><!-- /ko --></div>"

    var childprop = observableArray([])
    var someitem = observable({childprop: childprop})
    var viewModel = {someitem: someitem}
    applyBindings(viewModel, testNode)

        // First it's not there (by template)
    var container = testNode.childNodes[0]
    expect(container).toContainHtml('text<!-- ko foreach: childprop --><!-- /ko -->')

        // Then it's there
    childprop.push('me')
    expect(container).toContainHtml('text<!-- ko foreach: childprop --><span data-bind="text: $data">me</span><!-- /ko -->')

        // Then there's a second one
    childprop.push('me2')
    expect(container).toContainHtml('text<!-- ko foreach: childprop --><span data-bind="text: $data">me</span><span data-bind="text: $data">me2</span><!-- /ko -->')

        // Then it changes
    someitem({childprop: ['notme']})
    container = testNode.childNodes[0]
    expect(container).toContainHtml('text<!-- ko foreach: childprop --><span data-bind="text: $data">notme</span><!-- /ko -->')
  })

  it('Should provide access to an observable viewModel through $rawData', function () {
    testNode.innerHTML = "<div data-bind='using: item'><input data-bind='value: $rawData'/></div>"
    var item = observable('one')
    applyBindings({ item: item }, testNode)
    expect(item.getSubscriptionsCount('change')).toEqual(2)    // only subscriptions are the using and value bindings
    expect(testNode.childNodes[0]).toHaveValues(['one'])

        // Should update observable when input is changed
    var inputElement = testNode?.childNodes[0]?.childNodes[0] as HTMLInputElement
    inputElement.value = 'two'
    triggerEvent(inputElement, 'change')
    expect(item()).toEqual('two')

        // Should update the input when the observable changes
    item('three')
    expect(testNode.childNodes[0]).toHaveValues(['three'])
  })
})
