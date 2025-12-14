
import {
    registerEventHandler, arrayIndexOf, addOrRemoveItem
} from '@tko/utils'

import {
    unwrap, dependencyDetection, isWriteableObservable
} from '@tko/observable'

import {
    computed, pureComputed
} from '@tko/computed'

import type { AllBindings } from '@tko/bind'

export var checked = {
  after: ['value', 'attr'],
  init: function (element, valueAccessor, allBindings: AllBindings) {
    let checkedValue = pureComputed(function () {
      // Treat "value" like "checkedValue" when it is included with "checked" binding
      if (allBindings.has('checkedValue')) {
        return unwrap(allBindings.get('checkedValue'))
      } else if (useElementValue) {
        if (allBindings.has('value')) {
          return unwrap(allBindings.get('value'))
        } else {
          return element.value
        }
      }
    })

    function updateModel () {
      // This updates the model value from the view value.
      // It runs in response to DOM events (click) and changes in checkedValue.
      let isChecked = element.checked,
        elemValue = checkedValue()

      // When we're first setting up this computed, don't change any model state.
      if (dependencyDetection.isInitial()) {
        return
      }

      // We can ignore unchecked radio buttons, because some other radio
      // button will be checked, and that one can take care of updating state.
      // button will be checked, and that one can take care of updating state
      if (!isChecked && (isRadio || dependencyDetection.getDependenciesCount())) {
        return
      }

      let modelValue = dependencyDetection.ignore(valueAccessor)
      if (valueIsArray) {
        let writableValue = rawValueIsNonArrayObservable ? modelValue.peek() : modelValue,
          saveOldValue = oldElemValue
        oldElemValue = elemValue

        if (saveOldValue !== elemValue) {
          // When we're responding to the checkedValue changing, and the element is
          // currently checked, replace the old elem value with the new elem value
          // in the model array.
          if (isChecked) {
            addOrRemoveItem(writableValue, elemValue, true)
            addOrRemoveItem(writableValue, saveOldValue, false)
          }

          oldElemValue = elemValue
        } else {
          // When we're responding to the user having checked/unchecked a checkbox,
          // add/remove the element value to the model array.
          addOrRemoveItem(writableValue, elemValue, isChecked)
        }
        if (rawValueIsNonArrayObservable && isWriteableObservable(modelValue)) {
          modelValue(writableValue)
        }
      } else {
        if (isCheckbox) {
          if (elemValue === undefined) {
            elemValue = isChecked
          } else if (!isChecked) {
            elemValue = undefined
          }
        }
        // valueAccessor(elemValue, {onlyIfChanged: true})
        const modelValue = valueAccessor(elemValue, {onlyIfChanged: true});
        if (isWriteableObservable(modelValue) && (modelValue.peek() !== elemValue)) {
          modelValue(elemValue);
        }
      }
    };

    function updateView () {
            // This updates the view value from the model value.
            // It runs in response to changes in the bound (checked) value.
      var modelValue = modelValue = unwrap(valueAccessor())
      let elemValue = checkedValue()

      if (valueIsArray) {
                // When a checkbox is bound to an array, being checked represents its value being present in that array
        element.checked = arrayIndexOf(modelValue, elemValue) >= 0
        oldElemValue = elemValue
      } else if (isCheckbox && elemValue === undefined) {
                                 // When a checkbox is bound to any other value (not an array) and "checkedValue" is not defined,
                                 // being checked represents the value being trueish
        element.checked = !!modelValue
      } else {
        // Otherwise, being checked means that the checkbox or radio button's value corresponds to the model value
        element.checked = (checkedValue() === modelValue)
      }
    };

    const isCheckbox = element.type == 'checkbox',
      isRadio = element.type == 'radio'

        // Only bind to check boxes and radio buttons
    if (!isCheckbox && !isRadio) {
      return
    }

    let rawValue = valueAccessor(),
      valueIsArray = isCheckbox && (unwrap(rawValue) instanceof Array),
      rawValueIsNonArrayObservable = !(valueIsArray && rawValue.push && rawValue.splice),
      useElementValue = isRadio || valueIsArray,
      oldElemValue = valueIsArray ? checkedValue() : undefined

        // Set up two computeds to update the binding:

        // The first responds to changes in the checkedValue value and to element clicks
    computed(updateModel, null, { disposeWhenNodeIsRemoved: element })
    registerEventHandler(element, 'click', updateModel)

        // The second responds to changes in the model value (the one associated with the checked binding)
    computed(updateView, null, { disposeWhenNodeIsRemoved: element })

    rawValue = undefined
  }
}

export var checkedValue = {
  update: function (element, valueAccessor) {
    element.value = unwrap(valueAccessor())
  }
}
