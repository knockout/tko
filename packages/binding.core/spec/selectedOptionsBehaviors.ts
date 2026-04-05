import { expect } from 'chai'

import { applyBindings } from '@tko/bind'

import { observableArray } from '@tko/observable'

import { DataBindProvider } from '@tko/provider.databind'

import { options, selectExtensions, triggerEvent } from '@tko/utils'

import { bindings as coreBindings } from '../dist'

import { prepareTestNode } from '../../utils/helpers/mocha-test-helpers'

function expectArrayEqual(actual: Array<unknown>, expected: Array<unknown>) {
  expect(actual.length).to.equal(expected.length)
  actual.forEach((value, index) => expect(value).to.equal(expected[index]))
}

function expectHaveSelectedValues(node: Node, expectedValues: Array<unknown>) {
  expectArrayEqual(
    Array.from(node.childNodes)
      .filter(child => (child as HTMLOptionElement).selected)
      .map(child => selectExtensions.readValue(child as HTMLElement)),
    expectedValues
  )
}

describe('Binding: Selected Options', function () {
  let testNode: HTMLElement

  beforeEach(function () {
    testNode = prepareTestNode()
  })

  beforeEach(function () {
    const provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it('Should only be applicable to SELECT nodes', function () {
    let threw = false
    testNode.innerHTML = "<input data-bind='selectedOptions:[]' />"
    try {
      applyBindings({}, testNode)
    } catch (ex) {
      threw = true
    }
    expect(threw).to.equal(true)
  })

  it('Should set selection in the SELECT node to match the model', function () {
    const bObject = {}
    const values = observableArray(['A', bObject, 'C'])
    const selection = observableArray([bObject])
    testNode.innerHTML =
      "<select multiple='multiple' data-bind='options:myValues, selectedOptions:mySelection'></select>"
    applyBindings({ myValues: values, mySelection: selection }, testNode)

    expectHaveSelectedValues(testNode.childNodes[0], [bObject])
    selection.push('C')
    expectHaveSelectedValues(testNode.childNodes[0], [bObject, 'C'])
  })

  it('Should update the model when selection in the SELECT node changes', function () {
    function setMultiSelectOptionSelectionState(optionElement, state) {
      optionElement.selected = state
    }

    const cObject = {}
    const values = observableArray(['A', 'B', cObject])
    const selection = observableArray(['B'])
    testNode.innerHTML =
      "<select multiple='multiple' data-bind='options:myValues, selectedOptions:mySelection'></select>"
    applyBindings({ myValues: values, mySelection: selection }, testNode)

    expect(selection()).to.deep.equal(['B'])
    setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0], true)
    setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[1], false)
    setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[2], true)
    triggerEvent(testNode.children[0], 'change')

    expect(selection()).to.deep.equal(['A', cObject])
    expect(selection()[1]).to.equal(cObject)
  })

  it('Should update the model when selection in the SELECT node changes for non-observable property values', function () {
    function setMultiSelectOptionSelectionState(optionElement, state) {
      optionElement.selected = state
    }

    const cObject = {}
    const values = observableArray(['A', 'B', cObject])
    const selection = ['B']
    const myModel = { myValues: values, mySelection: selection }
    testNode.innerHTML =
      "<select multiple='multiple' data-bind='options:myValues, selectedOptions:mySelection'></select>"
    applyBindings(myModel, testNode)

    expect(myModel.mySelection).to.deep.equal(['B'])
    setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0], true)
    setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[1], false)
    setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[2], true)
    triggerEvent(testNode.children[0], 'change')

    expect(myModel.mySelection).to.deep.equal(['A', cObject])
    expect(myModel.mySelection[1]).to.equal(cObject)
  })

  it('Should update the model when selection in the SELECT node inside an optgroup changes', function () {
    function setMultiSelectOptionSelectionState(optionElement, state) {
      optionElement.selected = state
    }

    const selection = observableArray([])
    testNode.innerHTML =
      "<select multiple='multiple' data-bind='selectedOptions:mySelection'><optgroup label='group'><option value='a'>a-text</option><option value='b'>b-text</option><option value='c'>c-text</option></optgroup></select>"
    applyBindings({ mySelection: selection }, testNode)

    expect(selection()).to.deep.equal([])

    setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0].childNodes[0], true)
    setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0].childNodes[1], false)
    setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0].childNodes[2], true)
    triggerEvent(testNode.children[0], 'change')

    expect(selection()).to.deep.equal(['a', 'c'])
  })

  it('Should set selection in the SELECT node inside an optgroup to match the model', function () {
    const selection = observableArray(['a'])
    testNode.innerHTML =
      "<select multiple='multiple' data-bind='selectedOptions:mySelection'><optgroup label='group'><option value='a'>a-text</option><option value='b'>b-text</option><option value='c'>c-text</option></optgroup><optgroup label='group2'><option value='d'>d-text</option></optgroup></select>"
    applyBindings({ mySelection: selection }, testNode)

    expectHaveSelectedValues(testNode.childNodes[0].childNodes[0], ['a'])
    expectHaveSelectedValues(testNode.childNodes[0].childNodes[1], [])
    selection.push('c')
    expectHaveSelectedValues(testNode.childNodes[0].childNodes[0], ['a', 'c'])
    expectHaveSelectedValues(testNode.childNodes[0].childNodes[1], [])
    selection.push('d')
    expectHaveSelectedValues(testNode.childNodes[0].childNodes[0], ['a', 'c'])
    expectHaveSelectedValues(testNode.childNodes[0].childNodes[1], ['d'])
  })

  it('Should not change the scroll position when updating the view', function () {
    const selection = observableArray(),
      data = new Array()
    for (let i = 1; i < 101; i++) {
      data.push({ code: '0000' + i, name: 'Item ' + i })
    }

    testNode.innerHTML =
      '<select multiple="multiple" data-bind="options: data, optionsText: \'name\', optionsValue: \'code\', selectedOptions: selectedItems"></select>'
    applyBindings({ selectedItems: selection, data: data }, testNode)

    const selectElem = testNode.childNodes[0] as HTMLElement
    expect(selectElem.scrollTop).to.equal(0)
    expectHaveSelectedValues(selectElem, [])

    selection.push('0000100')
    expect(selectElem.scrollTop).to.equal(0)
    expectHaveSelectedValues(selectElem, ['0000100'])

    selectElem.scrollTop = 80
    const previousScrollTop = selectElem.scrollTop
    selection.push('000050')
    expect(selectElem.scrollTop).to.equal(previousScrollTop)
    expectHaveSelectedValues(selectElem, ['000050', '0000100'])
  })
})
