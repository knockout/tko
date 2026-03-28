import { expect } from 'chai'

import { applyBindings, contextFor } from '@tko/bind'

import { observable, observableArray } from '@tko/observable'

import type { ObservableArray } from '@tko/observable'

import { DataBindProvider } from '@tko/provider.databind'
import { VirtualProvider } from '@tko/provider.virtual'
import { MultiProvider } from '@tko/provider.multi'

import { bindings as templateBindings } from '@tko/binding.template'
import { bindings as coreBindings } from '@tko/binding.core'

import { options, triggerEvent } from '@tko/utils'

import { expectContainHtml, expectContainText, prepareTestNode } from '../../utils/helpers/mocha-test-helpers'

function expectArrayEqual(actual: Array<unknown>, expected: Array<unknown>) {
  expect(actual.length).to.equal(expected.length)
  actual.forEach((value, index) => expect(value).to.equal(expected[index]))
}

function expectHaveValues(node: Node, expectedValues: Array<unknown>) {
  expectArrayEqual(
    Array.from(node.childNodes, child => (child as any).value).filter(value => value !== undefined),
    expectedValues
  )
}

describe('Binding: Using', function () {
  let testNode: HTMLElement

  beforeEach(function () {
    testNode = prepareTestNode()
  })

  beforeEach(function () {
    const provider = new MultiProvider({ providers: [new DataBindProvider(), new VirtualProvider()] })
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
    provider.bindingHandlers.set(templateBindings)
  })

  it('Should leave descendant nodes in the document (and bind them in the context of the supplied value) if the value is truthy', function () {
    testNode.innerHTML = "<div data-bind='using: someItem'><span data-bind='text: existentChildProp'></span></div>"
    expect(testNode.childNodes.length).to.equal(1)
    applyBindings({ someItem: { existentChildProp: 'Child prop value' } }, testNode)
    expect(testNode.childNodes[0].childNodes.length).to.equal(1)
    expectContainText(testNode.childNodes[0].childNodes[0], 'Child prop value')
  })

  it('Should leave descendant nodes in the document (and bind them) if the value is falsy', function () {
    testNode.innerHTML = "<div data-bind='using: someItem'><span data-bind='text: $data'></span></div>"
    applyBindings({ someItem: null }, testNode)
    expect(testNode.childNodes[0].childNodes.length).to.equal(1)
    expectContainText(testNode.childNodes[0].childNodes[0], '')
  })

  it('Should leave descendant nodes unchanged and not bind them more than once if the supplied value notifies a change', function () {
    let countedClicks = 0
    const someItem = observable({
      childProp: observable('Hello'),
      handleClick: function () {
        countedClicks++
      }
    })

    testNode.innerHTML =
      "<div data-bind='using: someItem'><span data-bind='text: childProp, click: handleClick'></span></div>"
    const originalNode = testNode.children[0].children[0]

    applyBindings({ someItem: someItem }, testNode)
    expect(testNode.children[0].children[0]).to.equal(originalNode)

    expectContainText(testNode.children[0].children[0], 'Hello')
    expect(someItem().childProp.getSubscriptionsCount()).to.equal(1)
    triggerEvent(testNode.children[0].children[0], 'click')
    expect(countedClicks).to.equal(1)

    someItem.valueHasMutated()
    expect(someItem().childProp.getSubscriptionsCount()).to.equal(1)

    countedClicks = 0
    triggerEvent(testNode.children[0].children[0], 'click')
    expect(countedClicks).to.equal(1)

    expect(testNode.children[0].children[0]).to.equal(originalNode)
  })

  it('Should be able to access parent binding context via $parent', function () {
    testNode.innerHTML = "<div data-bind='using: someItem'><span data-bind='text: $parent.parentProp'></span></div>"
    applyBindings({ someItem: {}, parentProp: 'Parent prop value' }, testNode)
    expectContainText(testNode.childNodes[0].childNodes[0], 'Parent prop value')
  })

  it('Should be able to access all parent binding contexts via $parents, and root context via $root', function () {
    testNode.innerHTML =
      "<div data-bind='using: topItem'>"
      + "<div data-bind='using: middleItem'>"
      + "<div data-bind='using: bottomItem'>"
      + "<span data-bind='text: name'></span>"
      + "<span data-bind='text: $parent.name'></span>"
      + "<span data-bind='text: $parents[1].name'></span>"
      + "<span data-bind='text: $parents[2].name'></span>"
      + "<span data-bind='text: $root.name'></span>"
      + '</div>'
      + '</div>'
      + '</div>'
    applyBindings(
      { name: 'outer', topItem: { name: 'top', middleItem: { name: 'middle', bottomItem: { name: 'bottom' } } } },
      testNode
    )
    const finalContainer = testNode.childNodes[0].childNodes[0].childNodes[0]
    expectContainText(finalContainer.childNodes[0], 'bottom')
    expectContainText(finalContainer.childNodes[1], 'middle')
    expectContainText(finalContainer.childNodes[2], 'top')
    expectContainText(finalContainer.childNodes[3], 'outer')
    expectContainText(finalContainer.childNodes[4], 'outer')

    expect(contextFor(testNode).$data.name).to.equal('outer')
    expect(contextFor(testNode.childNodes[0] as HTMLElement).$data.name).to.equal('outer')
    expect(contextFor(testNode.childNodes[0].childNodes[0] as HTMLElement).$data.name).to.equal('top')
    expect(contextFor(testNode.childNodes[0].childNodes[0].childNodes[0] as HTMLElement).$data.name).to.equal('middle')
    expect(
      contextFor(testNode.childNodes[0].childNodes[0].childNodes[0].childNodes[0] as HTMLElement).$data.name
    ).to.equal('bottom')
    const firstSpan = testNode.childNodes[0].childNodes[0].childNodes[0].childNodes[0] as HTMLElement
    expect(firstSpan.tagName).to.equal('SPAN')
    expect(contextFor(firstSpan as HTMLElement).$data.name).to.equal('bottom')
    expect(contextFor(firstSpan as HTMLElement).$root.name).to.equal('outer')
    expect(contextFor(firstSpan as HTMLElement).$parents[1].name).to.equal('top')
  })

  it('Should be able to define a "using" region using a containerless binding', function () {
    const someitem = observable({ someItem: 'first value' })
    testNode.innerHTML = 'xxx <!-- ko using: someitem --><span data-bind="text: someItem"></span><!-- /ko -->'
    applyBindings({ someitem: someitem }, testNode)

    expectContainText(testNode, 'xxx first value')

    someitem({ someItem: 'second value' })
    expectContainText(testNode, 'xxx second value')
  })

  it('Should be able to use "using" within an observable top-level view model', function () {
    const vm = observable({ someitem: observable({ someItem: 'first value' }) })
    testNode.innerHTML = 'xxx <!-- ko using: someitem --><span data-bind="text: someItem"></span><!-- /ko -->'
    applyBindings(vm, testNode)

    expectContainText(testNode, 'xxx first value')

    vm({ someitem: observable({ someItem: 'second value' }) })
    expectContainText(testNode, 'xxx second value')
  })

  it('Should be able to nest a template within "using"', function () {
    testNode.innerHTML =
      "<div data-bind='using: someitem'>"
      + "<div data-bind='foreach: childprop'><span data-bind='text: $data'></span></div></div>"

    const childprop = observableArray(new Array())
    const someitem = observable({ childprop: childprop })
    const viewModel = { someitem: someitem }
    applyBindings(viewModel, testNode)

    const container = testNode.childNodes[0] as Element
    expectContainHtml(container, '<div data-bind="foreach: childprop"></div>')

    childprop.push('me')
    expectContainHtml(
      container,
      '<div data-bind="foreach: childprop"><span data-bind=\"text: $data\">me</span></div>'
    )

    childprop.push('me2')
    expectContainHtml(
      container,
      '<div data-bind="foreach: childprop"><span data-bind=\"text: $data\">me</span><span data-bind=\"text: $data\">me2</span></div>'
    )

    someitem({ childprop: ['notme'] })
    expectContainHtml(
      container,
      '<div data-bind="foreach: childprop"><span data-bind=\"text: $data\">notme</span></div>'
    )
  })

  it('Should be able to nest a containerless template within "using"', function () {
    testNode.innerHTML =
      "<div data-bind='using: someitem'>text"
      + "<!-- ko foreach: childprop --><span data-bind='text: $data'></span><!-- /ko --></div>"

    const childprop = observableArray<string>([])
    const someitem = observable({ childprop: childprop })
    const viewModel = { someitem: someitem }
    applyBindings(viewModel, testNode)

    let container = testNode.childNodes[0] as Element
    expectContainHtml(container, 'text<!-- ko foreach: childprop --><!-- /ko -->')

    childprop.push('me')
    expectContainHtml(container, 'text<!-- ko foreach: childprop --><span data-bind="text: $data">me</span><!-- /ko -->')

    childprop.push('me2')
    expectContainHtml(
      container,
      'text<!-- ko foreach: childprop --><span data-bind="text: $data">me</span><span data-bind="text: $data">me2</span><!-- /ko -->'
    )

    someitem({ childprop: ['notme'] })
    container = testNode.childNodes[0] as Element
    expectContainHtml(
      container,
      'text<!-- ko foreach: childprop --><span data-bind="text: $data">notme</span><!-- /ko -->'
    )
  })

  it('Should provide access to an observable viewModel through $rawData', function () {
    testNode.innerHTML = "<div data-bind='using: item'><input data-bind='value: $rawData'/></div>"
    const item = observable('one')
    applyBindings({ item: item }, testNode)
    expect(item.getSubscriptionsCount('change')).to.equal(2)
    expectHaveValues(testNode.childNodes[0], ['one'])

    const inputElement = testNode?.childNodes[0]?.childNodes[0] as HTMLInputElement
    inputElement.value = 'two'
    triggerEvent(inputElement, 'change')
    expect(item()).to.equal('two')

    item('three')
    expectHaveValues(testNode.childNodes[0], ['three'])
  })
})
