
import {
    arrayForEach, setOptionNodeSelectionState, arrayIndexOf,
    registerEventHandler, tagNameLower, selectExtensions
} from '@tko/utils'

import {
    unwrap
} from '@tko/observable'

import type { AllBindings } from '@tko/bind'

export const selectedOptions = {
  after: ['options', 'foreach'],

  init: function (element, valueAccessor, _allBindings: AllBindings) {
    registerEventHandler(element, 'change', function () {
      let value = valueAccessor(), valueToWrite = new Array()
      arrayForEach(element.getElementsByTagName('option'), function (node) {
        if (node.selected) { valueToWrite.push(selectExtensions.readValue(node)) }
      })
      valueAccessor(valueToWrite)
    })
  },

  update: function (element, valueAccessor) {
    if (tagNameLower(element) != 'select') { throw new Error('values binding applies only to SELECT elements') }

    let newValue = unwrap(valueAccessor()),
      previousScrollTop = element.scrollTop

    if (newValue && typeof newValue.length === 'number') {
      arrayForEach(element.getElementsByTagName('option'), function (node) {
        let isSelected = arrayIndexOf(newValue, selectExtensions.readValue(node)) >= 0
        if (node.selected != isSelected) {      // This check prevents flashing of the select element in IE
          setOptionNodeSelectionState(node, isSelected)
        }
      })
    }

    element.scrollTop = previousScrollTop
  }
}
