import {
    applyBindings
} from 'tko.bind'

import {
    observableArray
} from 'tko.observable'

import {
    DataBindProvider
} from 'tko.provider.databind'

import {
    options, triggerEvent
} from 'tko.utils'

import {bindings as coreBindings} from '../src'

import 'tko.utils/helpers/jasmine-13-helper.js'

import {
    matchers
} from '../src/test-helper'

describe('Binding: Selected Options', function () {
  beforeEach(jasmine.prepareTestNode)

  beforeEach(function () {
    var provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)

    this.addMatchers(matchers)
  })

  it('Should only be applicable to SELECT nodes', function () {
    var threw = false
    testNode.innerHTML = "<input data-bind='selectedOptions:[]' />"
    try { applyBindings({}, testNode) } catch (ex) { threw = true }
    expect(threw).toEqual(true)
  })

  it('Should set selection in the SELECT node to match the model', function () {
    var bObject = {}
    var values = new observableArray(['A', bObject, 'C'])
    var selection = new observableArray([bObject])
    testNode.innerHTML = "<select multiple='multiple' data-bind='options:myValues, selectedOptions:mySelection'></select>"
    applyBindings({ myValues: values, mySelection: selection }, testNode)

    expect(testNode.childNodes[0]).toHaveSelectedValues([bObject])
    selection.push('C')
    expect(testNode.childNodes[0]).toHaveSelectedValues([bObject, 'C'])
  })

  it('Should update the model when selection in the SELECT node changes', function () {
    function setMultiSelectOptionSelectionState (optionElement, state) {
            // Workaround an IE 6 bug (http://benhollis.net/experiments/browserdemos/ie6-adding-options.html)
      if (/MSIE 6/i.test(navigator.userAgent)) { optionElement.setAttribute('selected', state) } else { optionElement.selected = state }
    }

    var cObject = {}
    var values = new observableArray(['A', 'B', cObject])
    var selection = new observableArray(['B'])
    testNode.innerHTML = "<select multiple='multiple' data-bind='options:myValues, selectedOptions:mySelection'></select>"
    applyBindings({ myValues: values, mySelection: selection }, testNode)

    expect(selection()).toEqual(['B'])
    setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0], true)
    setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[1], false)
    setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[2], true)
    triggerEvent(testNode.childNodes[0], 'change')

    expect(selection()).toEqual(['A', cObject])
    expect(selection()[1] === cObject).toEqual(true) // Also check with strict equality, because we don't want to falsely accept [object Object] == cObject
  })

  it('Should update the model when selection in the SELECT node changes for non-observable property values', function () {
    function setMultiSelectOptionSelectionState (optionElement, state) {
            // Workaround an IE 6 bug (http://benhollis.net/experiments/browserdemos/ie6-adding-options.html)
      if (/MSIE 6/i.test(navigator.userAgent)) { optionElement.setAttribute('selected', state) } else { optionElement.selected = state }
    }

    var cObject = {}
    var values = new observableArray(['A', 'B', cObject])
    var selection = ['B']
    var myModel = { myValues: values, mySelection: selection }
    testNode.innerHTML = "<select multiple='multiple' data-bind='options:myValues, selectedOptions:mySelection'></select>"
    applyBindings(myModel, testNode)

    expect(myModel.mySelection).toEqual(['B'])
    setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0], true)
    setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[1], false)
    setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[2], true)
    triggerEvent(testNode.childNodes[0], 'change')

    expect(myModel.mySelection).toEqual(['A', cObject])
    expect(myModel.mySelection[1] === cObject).toEqual(true) // Also check with strict equality, because we don't want to falsely accept [object Object] == cObject
  })

  it('Should update the model when selection in the SELECT node inside an optgroup changes', function () {
    function setMultiSelectOptionSelectionState (optionElement, state) {
            // Workaround an IE 6 bug (http://benhollis.net/experiments/browserdemos/ie6-adding-options.html)
      if (/MSIE 6/i.test(navigator.userAgent)) { optionElement.setAttribute('selected', state) } else { optionElement.selected = state }
    }

    var selection = new observableArray([])
    testNode.innerHTML = "<select multiple='multiple' data-bind='selectedOptions:mySelection'><optgroup label='group'><option value='a'>a-text</option><option value='b'>b-text</option><option value='c'>c-text</option></optgroup></select>"
    applyBindings({ mySelection: selection }, testNode)

    expect(selection()).toEqual([])

    setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0].childNodes[0], true)
    setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0].childNodes[1], false)
    setMultiSelectOptionSelectionState(testNode.childNodes[0].childNodes[0].childNodes[2], true)
    triggerEvent(testNode.childNodes[0], 'change')

    expect(selection()).toEqual(['a', 'c'])
  })

  it('Should set selection in the SELECT node inside an optgroup to match the model', function () {
    var selection = new observableArray(['a'])
    testNode.innerHTML = "<select multiple='multiple' data-bind='selectedOptions:mySelection'><optgroup label='group'><option value='a'>a-text</option><option value='b'>b-text</option><option value='c'>c-text</option></optgroup><optgroup label='group2'><option value='d'>d-text</option></optgroup></select>"
    applyBindings({ mySelection: selection }, testNode)

    expect(testNode.childNodes[0].childNodes[0]).toHaveSelectedValues(['a'])
    expect(testNode.childNodes[0].childNodes[1]).toHaveSelectedValues([])
    selection.push('c')
    expect(testNode.childNodes[0].childNodes[0]).toHaveSelectedValues(['a', 'c'])
    expect(testNode.childNodes[0].childNodes[1]).toHaveSelectedValues([])
    selection.push('d')
    expect(testNode.childNodes[0].childNodes[0]).toHaveSelectedValues(['a', 'c'])
    expect(testNode.childNodes[0].childNodes[1]).toHaveSelectedValues(['d'])
  })

  it('Should not change the scroll position when updating the view', function () {
    var selection = observableArray(), data = []
    for (var i = 1; i < 101; i++) {
      data.push({ code: '0000' + i, name: 'Item ' + i })
    }

    testNode.innerHTML = "<select multiple=\"multiple\" data-bind=\"options: data, optionsText: 'name', optionsValue: 'code', selectedOptions: selectedItems\"></select>"
    applyBindings({ selectedItems: selection, data: data }, testNode)

    var selectElem = testNode.childNodes[0]
    expect(selectElem.scrollTop).toBe(0)
    expect(selectElem).toHaveSelectedValues([])

    selection.push('0000100')
    expect(selectElem.scrollTop).toBe(0)
    expect(selectElem).toHaveSelectedValues(['0000100'])

    selectElem.scrollTop = 80
    var previousScrollTop = selectElem.scrollTop   // some browsers modify the scrollTop right away
    selection.push('000050')
    expect(selectElem.scrollTop).toBe(previousScrollTop)
    expect(selectElem).toHaveSelectedValues(['000050', '0000100'])
  })
})
