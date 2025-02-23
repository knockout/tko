
import {
    tagNameLower, arrayFilter, arrayMap, setTextContent, arrayIndexOf,
    setOptionNodeSelectionState, triggerEvent,
    ensureSelectElementIsRenderedCorrectly, selectExtensions,
} from '@tko/utils'

import { unwrap, dependencyDetection } from '@tko/observable'
import { setDomNodeChildrenFromArrayMapping } from '@tko/bind'
import type { AllBindings } from '@tko/bind'
var captionPlaceholder = {}

export var options = {
  init: function (element) {
    if (tagNameLower(element) !== 'select') { throw new Error('options binding applies only to SELECT elements') }

        // Remove all existing <option>s.
    while (element.length > 0) {
      element.remove(0)
    }

        // Ensures that the binding processor doesn't try to bind the options
    return { 'controlsDescendantBindings': true }
  },
  update: function (element, valueAccessor, allBindings: AllBindings) {
    function selectedOptions () {
      return arrayFilter(element.options, function (node) { return node.selected })
    }

    var selectWasPreviouslyEmpty = element.length == 0,
      multiple = element.multiple,
      previousScrollTop = (!selectWasPreviouslyEmpty && multiple) ? element.scrollTop : null,
      unwrappedArray = unwrap(valueAccessor()),
      valueAllowUnset = allBindings.get('valueAllowUnset') && allBindings['has']('value'),
      includeDestroyed = allBindings.get('optionsIncludeDestroyed'),
      arrayToDomNodeChildrenOptions = {},
      captionValue,
      filteredArray,
      previousSelectedValues = new Array()

    if (!valueAllowUnset) {
      if (multiple) {
        previousSelectedValues = arrayMap(selectedOptions(), selectExtensions.readValue)
      } else if (element.selectedIndex >= 0) {
        previousSelectedValues.push(selectExtensions.readValue(element.options[element.selectedIndex]))
      }
    }

    if (unwrappedArray) {
      if (typeof unwrappedArray.length === 'undefined') // Coerce single value into array
        { unwrappedArray = [unwrappedArray] }

            // Filter out any entries marked as destroyed
      filteredArray = arrayFilter(unwrappedArray, function (item) {
        return includeDestroyed || item === undefined || item === null || !unwrap(item['_destroy'])
      })

            // If caption is included, add it to the array
      if (allBindings['has']('optionsCaption')) {
        captionValue = unwrap(allBindings.get('optionsCaption'))
                // If caption value is null or undefined, don't show a caption
        if (captionValue !== null && captionValue !== undefined) {
          filteredArray.unshift(captionPlaceholder)
        }
      }
    } else {
            // If a falsy value is provided (e.g. null), we'll simply empty the select element
    }

    function applyToObject (object, predicate, defaultValue) {
      var predicateType = typeof predicate
      if (predicateType === 'function')    // Given a function; run it against the data value
              { return predicate(object) } else if (predicateType == 'string') // Given a string; treat it as a property name on the data value
              { return object[predicate] } else                                // Given no optionsText arg; use the data value itself
                { return defaultValue }
    }

        // The following functions can run at two different times:
        // The first is when the whole array is being updated directly from this binding handler.
        // The second is when an observable value for a specific array entry is updated.
        // oldOptions will be empty in the first case, but will be filled with the previously generated option in the second.
    var itemUpdate = false
    function optionForArrayItem (arrayEntry, index, oldOptions) {
      if (oldOptions.length) {
        previousSelectedValues = !valueAllowUnset && oldOptions[0].selected ? [ selectExtensions.readValue(oldOptions[0]) ] : []
        itemUpdate = true
      }
      var option = element.ownerDocument.createElement('option')
      if (arrayEntry === captionPlaceholder) {
        setTextContent(option, allBindings.get('optionsCaption'))
        selectExtensions.writeValue(option, undefined)
      } else {
                // Apply a value to the option element
        var optionValue = applyToObject(arrayEntry, allBindings.get('optionsValue'), arrayEntry)
        selectExtensions.writeValue(option, unwrap(optionValue))

                // Apply some text to the option element
        var optionText = applyToObject(arrayEntry, allBindings.get('optionsText'), optionValue)
        setTextContent(option, optionText)
      }
      return [option]
    }

        // By using a beforeRemove callback, we delay the removal until after new items are added. This fixes a selection
        // problem in IE<=8 and Firefox. See https://github.com/knockout/knockout/issues/1208
    arrayToDomNodeChildrenOptions['beforeRemove'] =
            function (option) {
              element.removeChild(option)
            }

    function setSelectionCallback (arrayEntry, newOptions) {
      if (itemUpdate && valueAllowUnset) {
                // The model value is authoritative, so make sure its value is the one selected
                // There is no need to use dependencyDetection.ignore since setDomNodeChildrenFromArrayMapping does so already.
        selectExtensions.writeValue(element, unwrap(allBindings.get('value')), true /* allowUnset */)
      } else if (previousSelectedValues.length) {
                // IE6 doesn't like us to assign selection to OPTION nodes before they're added to the document.
                // That's why we first added them without selection. Now it's time to set the selection.
        var isSelected = arrayIndexOf(previousSelectedValues, selectExtensions.readValue(newOptions[0])) >= 0
        setOptionNodeSelectionState(newOptions[0], isSelected)

                // If this option was changed from being selected during a single-item update, notify the change
        if (itemUpdate && !isSelected) {
          dependencyDetection.ignore(triggerEvent, null, [element, 'change'])
        }
      }
    }

    var callback = setSelectionCallback
    if (allBindings['has']('optionsAfterRender') && typeof allBindings.get('optionsAfterRender') === 'function') {
      callback = function (arrayEntry, newOptions) {
        setSelectionCallback(arrayEntry, newOptions)
        dependencyDetection.ignore(allBindings.get('optionsAfterRender'), null, [newOptions[0], arrayEntry !== captionPlaceholder ? arrayEntry : undefined])
      }
    }

    setDomNodeChildrenFromArrayMapping(element, filteredArray, optionForArrayItem, arrayToDomNodeChildrenOptions, callback)

    dependencyDetection.ignore(function () {
      if (valueAllowUnset) {
                // The model value is authoritative, so make sure its value is the one selected
        selectExtensions.writeValue(element, unwrap(allBindings.get('value')), true /* allowUnset */)
      } else {
                // Determine if the selection has changed as a result of updating the options list
        var selectionChanged
        if (multiple) {
                    // For a multiple-select box, compare the new selection count to the previous one
                    // But if nothing was selected before, the selection can't have changed
          selectionChanged = previousSelectedValues.length && selectedOptions().length < previousSelectedValues.length
        } else {
                    // For a single-select box, compare the current value to the previous value
                    // But if nothing was selected before or nothing is selected now, just look for a change in selection
          selectionChanged = (previousSelectedValues.length && element.selectedIndex >= 0)
                        ? (selectExtensions.readValue(element.options[element.selectedIndex]) !== previousSelectedValues[0])
                        : (previousSelectedValues.length || element.selectedIndex >= 0)
        }

                // Ensure consistency between model value and selected option.
                // If the dropdown was changed so that selection is no longer the same,
                // notify the value or selectedOptions binding.
        if (selectionChanged) {
          triggerEvent(element, 'change')
        }
      }
    })

        // Workaround for IE bug
    ensureSelectElementIsRenderedCorrectly(element)

    if (previousScrollTop && Math.abs(previousScrollTop - element.scrollTop) > 20) { element.scrollTop = previousScrollTop }
  }
}
