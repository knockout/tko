/* global testNode */
import {
    registerEventHandler, triggerEvent, removeNode, arrayForEach, options
} from '@tko/utils'

import {
    applyBindings
} from '@tko/bind'

import {
    observable,
    observableArray
} from '@tko/observable'

import type { Observable, ObservableArray } from '@tko/observable';

import {
    computed
} from '@tko/computed'

import { DataBindProvider } from '@tko/provider.databind'

import { bindings as coreBindings } from '../dist'
import { bindings as templateBindings } from '@tko/binding.template'

import '@tko/utils/helpers/jasmine-13-helper'

describe('Binding: Checked', function () {
  var testNode : HTMLElement
  beforeEach(function() { testNode = jasmine.prepareTestNode() })

  beforeEach(function () {
    var provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
    provider.bindingHandlers.set(templateBindings)
  })

  it('Triggering a click should toggle a checkbox\'s checked state before the event handler fires', function () {
        // This isn't strictly to do with the checked binding, but if this doesn't work, the rest of the specs aren't meaningful
    testNode.innerHTML = "<input type='checkbox' />"
    var input = testNode.children[0] as HTMLInputElement
    var clickHandlerFireCount = 0, expectedCheckedStateInHandler
    registerEventHandler(input, 'click', function () {
      clickHandlerFireCount++
      expect(input.checked).toEqual(expectedCheckedStateInHandler)
    })
    expect(input.checked).toEqual(false)
    expectedCheckedStateInHandler = true
    triggerEvent(input, 'click')
    expect(input.checked).toEqual(true)
    expect(clickHandlerFireCount).toEqual(1)

    expectedCheckedStateInHandler = false
    triggerEvent(input, 'click')
    expect(input.checked).toEqual(false)
    expect(clickHandlerFireCount).toEqual(2)
  })

  it('Should be able to control a checkbox\'s checked state', function () {
    var myobservable = observable(true)
    testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp' />"
    var input = testNode.children[0] as HTMLInputElement

    applyBindings({ someProp: myobservable }, testNode)
    expect(input.checked).toEqual(true)

    myobservable(false)
    expect(input.checked).toEqual(false)
  })

  it('Should update observable properties on the underlying model when the checkbox click event fires', function () {
    var myobservable = observable(false)
    testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp' />"
    applyBindings({ someProp: myobservable }, testNode)

    triggerEvent(testNode.children[0], 'click')
    expect(myobservable()).toEqual(true)
  })

  it('Should only notify observable properties on the underlying model *once* even if the checkbox change events fire multiple times', function () {
    var myobservable = observable()
    var timesNotified = 0
    myobservable.subscribe(function () { timesNotified++ })
    testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp' />"
    applyBindings({ someProp: myobservable }, testNode)

        // Multiple events only cause one notification...
    triggerEvent(testNode.children[0], 'click')
    triggerEvent(testNode.children[0], 'change')
    triggerEvent(testNode.children[0], 'change')
    expect(timesNotified).toEqual(1)

        // ... until the checkbox value actually changes
    triggerEvent(testNode.children[0], 'click')
    triggerEvent(testNode.children[0], 'change')
    expect(timesNotified).toEqual(2)
  })

  it('Should update non-observable properties on the underlying model when the checkbox click event fires', function () {
    var model = { someProp: false }
    testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp' />"
    applyBindings(model, testNode)

    triggerEvent(testNode.children[0], 'click')
    expect(model.someProp).toEqual(true)
  })

  it('Should make a radio button checked if and only if its value matches the bound model property', function () {
    var myobservable = observable('another value')
    testNode.innerHTML = "<input type='radio' value='This Radio Button Value' data-bind='checked:someProp' />"

    applyBindings({ someProp: myobservable }, testNode)
    var input = testNode.children[0] as HTMLInputElement

    expect(input.checked).toEqual(false)

    myobservable('This Radio Button Value')
    expect(input.checked).toEqual(true)
  })

  it('Should set an observable model property to this radio button\'s value when checked', function () {
    var myobservable = observable('another value')
    testNode.innerHTML = "<input type='radio' value='this radio button value' data-bind='checked:someProp' />"
    applyBindings({ someProp: myobservable }, testNode)

    expect(myobservable()).toEqual('another value')
    var input = testNode.children[0] as HTMLInputElement
    input.click()
    expect(myobservable()).toEqual('this radio button value')
  })

  it('Should only notify observable properties on the underlying model *once* even if the radio button change/click events fire multiple times', function () {
    var myobservable = observable('original value')
    var timesNotified = 0
    myobservable.subscribe(function () { timesNotified++ })
    testNode.innerHTML = "<input type='radio' value='this radio button value' data-bind='checked:someProp' /><input type='radio' value='different value' data-bind='checked:someProp' />"
    applyBindings({ someProp: myobservable }, testNode)

        // Multiple events only cause one notification...
    triggerEvent(testNode.children[0], 'click')
    triggerEvent(testNode.children[0], 'change')
    triggerEvent(testNode.children[0], 'click')
    triggerEvent(testNode.children[0], 'change')
    expect(timesNotified).toEqual(1)

        // ... until you click something with a different value
    triggerEvent(testNode.children[1], 'click')
    triggerEvent(testNode.children[1], 'change')
    expect(timesNotified).toEqual(2)
  })

  it('Should set a non-observable model property to this radio button\'s value when checked', function () {
    var model = { someProp: 'another value' }
    testNode.innerHTML = "<input type='radio' value='this radio button value' data-bind='checked:someProp' />"
    applyBindings(model, testNode)

    triggerEvent(testNode.children[0], 'click')
    expect(model.someProp).toEqual('this radio button value')
  })

  it('When a checkbox is bound to an array, the checkbox should control whether its value is in that array', function () {
    var model = { myArray: ['Existing value', 'Unrelated value'] }
    testNode.innerHTML = "<input type='checkbox' value='Existing value' data-bind='checked:myArray' />" +
                           "<input type='checkbox' value='New value'      data-bind='checked:myArray' />"
    applyBindings(model, testNode)

    expect(model.myArray).toEqual(['Existing value', 'Unrelated value'])

    // Checkbox initial state is determined by whether the value is in the array
    expect(testNode).toHaveCheckedStates([true, false])
        // Checking the checkbox puts it in the array
    triggerEvent(testNode.children[1], 'click')
    expect(testNode).toHaveCheckedStates([true, true])
    expect(model.myArray).toEqual(['Existing value', 'Unrelated value', 'New value'])
        // Unchecking the checkbox removes it from the array
    triggerEvent(testNode.children[1], 'click')
    expect(testNode).toHaveCheckedStates([true, false])
    expect(model.myArray).toEqual(['Existing value', 'Unrelated value'])
  })

  it('When a checkbox is bound to an observable array, the checkbox checked state responds to changes in the array', function () {
    var model = { myObservableArray: observableArray(['Unrelated value']) }
    testNode.innerHTML = "<input type='checkbox' value='My value' data-bind='checked:myObservableArray' />"
    applyBindings(model, testNode)
    var input = testNode.children[0] as HTMLInputElement
    expect(input.checked).toEqual(false)

        // Put the value in the array; observe the checkbox reflect this
    model.myObservableArray.push('My value')
    expect(input.checked).toEqual(true)

        // Remove the value from the array; observe the checkbox reflect this
    model.myObservableArray.remove('My value')
    expect(input.checked).toEqual(false)
  })

  it('When a checkbox is bound to a computed array, the checkbox and the computed observable should update each other', function () {
    var myObservable = observable([]),
      myComputed = computed({
        read: function () {
          return myObservable().slice(0)   // return a copy of the array so that we know that writes to the computed are really working
        },
        write: myObservable   // just pass writes on to the observable
      })

    testNode.innerHTML = "<input type='checkbox' value='A' data-bind='checked: myComputed' /><input type='checkbox' value='B' data-bind='checked: myComputed' />"
    applyBindings({ myComputed: myComputed }, testNode)

        // Binding adds an item to the observable
    triggerEvent(testNode.children[1], 'click')
    expect(testNode).toHaveCheckedStates([false, true])
    expect(myObservable()).toEqual(['B'])

        // Updating the observable updates the view
    myObservable(['A'])
    expect(testNode).toHaveCheckedStates([true, false])

        // Binding removes an item from the observable
    triggerEvent(testNode.children[0], 'click')
    expect(testNode).toHaveCheckedStates([false, false])
    expect(myObservable()).toEqual([])
  })

  it('When the radio button \'value\' attribute is set via attr binding, should set initial checked state correctly (attr before checked)', function () {
    var myObservable = observable('this radio button value')
    testNode.innerHTML = "<input type='radio' data-bind='attr:{value:\"this radio button value\"}, checked:someProp' />"
    applyBindings({ someProp: myObservable }, testNode)

    var input = testNode.children[0] as HTMLInputElement
    expect(input.checked).toEqual(true)
    myObservable('another value')
    expect(input.checked).toEqual(false)
  })

  it('When the radio button \'value\' attribute is set via attr binding, should set initial checked state correctly (checked before attr)', function () {
    var myobservable = observable('this radio button value')
    testNode.innerHTML = "<input type='radio' data-bind='checked:someProp, attr:{value:\"this radio button value\"}' />"
    applyBindings({ someProp: myobservable }, testNode)

    var input = testNode.children[0] as HTMLInputElement
    expect(input.checked).toEqual(true)
    myobservable('another value')
    expect(input.checked).toEqual(false)
  })

  it('When the bound observable is updated in a subscription in response to a radio click, view and model should stay in sync', function () {
        // This test failed when jQuery was included before the changes made in #1191
    testNode.innerHTML = '<input type="radio" value="1" name="x" data-bind="checked: choice" />' +
            '<input type="radio" value="2" name="x" data-bind="checked: choice" />' +
            '<input type="radio" value="3" name="x" data-bind="checked: choice" />'
    var choice = observable('1')
    choice.subscribe(function (newValue) {
      if (newValue == '3')        // don't allow item 3 to be selected; revert to item 1
            {
        choice('1')
      }
    })
    applyBindings({choice: choice}, testNode)
    expect(testNode).toHaveCheckedStates([true, false, false])

        // Click on item 2; verify it's selected
    triggerEvent(testNode.children[1], 'click')
    expect(testNode).toHaveCheckedStates([false, true, false])

        // Click on item 3; verify item 1 is selected
    triggerEvent(testNode.children[2], 'click')
    expect(testNode).toHaveCheckedStates([true, false, false])
  })

  arrayForEach([
    { binding: 'checkedValue', label: "With \'checkedValue\'" },
    { binding: 'value', label: 'With \'value\' treated like \'checkedValue\' when used with \'checked\'' }
  ], function (data) {
    var binding = data.binding

    describe(data.label, function () {
      it('Should use that value as the checkbox value in the array', function () {
        var model = { myArray: observableArray([1, 3]) }
        testNode.innerHTML = "<input type='checkbox' data-bind='checked:myArray, " + binding + ":1' />"
                      + "<input value='off' type='checkbox' data-bind='checked:myArray, " + binding + ":2' />"
        applyBindings(model, testNode)

        expect(model.myArray()).toEqual([1, 3])   // initial value is unchanged

                  // Checkbox initial state is determined by whether the value is in the array
        expect(testNode).toHaveCheckedStates([true, false])

                  // Verify that binding sets element value
        expect(testNode).toHaveValues(['1', '2'])

                  // Checking the checkbox puts it in the array
        triggerEvent(testNode.children[1], 'click')
        expect(testNode).toHaveCheckedStates([true, true])
        expect(model.myArray()).toEqual([1, 3, 2])

                  // Unchecking the checkbox removes it from the array
        triggerEvent(testNode.children[1], 'click')
        expect(testNode).toHaveCheckedStates([true, false])
        expect(model.myArray()).toEqual([1, 3])

                  // Put the value in the array; observe the checkbox reflect this
        model.myArray.push(2)
        expect(testNode).toHaveCheckedStates([true, true])

                  // Remove the value from the array; observe the checkbox reflect this
        model.myArray.remove(1)
        expect(testNode).toHaveCheckedStates([false, true])
      })

      it('Should be able to use objects as value of checkboxes', function () {
        var object1 = {x: 1},
          object2 = {y: 1},
          model = { values: [object1], choices: [object1, object2] }
        testNode.innerHTML = "<div data-bind='foreach: choices'><input type='checkbox' data-bind='checked:$parent.values, " + binding + ":$data' /></div>"
        applyBindings(model, testNode)

                  // Checkbox initial state is determined by whether the value is in the array
        expect(testNode.children[0]).toHaveCheckedStates([true, false])

                  // Checking the checkbox puts it in the array
        triggerEvent(testNode.children[0].children[1], 'click')
        expect(testNode.children[0]).toHaveCheckedStates([true, true])
        expect(model.values).toEqual([object1, object2])

                  // Unchecking the checkbox removes it from the array
        triggerEvent(testNode.children[0].children[1], 'click')
        expect(testNode.children[0]).toHaveCheckedStates([true, false])
        expect(model.values).toEqual([object1])
      })

      it('Should be able to use observables as value of checkboxes', function () {
        var object1 = {id: observable(1)},
          object2 = {id: observable(2)},
          model = { values: observableArray([1]), choices: [object1, object2] }
        testNode.innerHTML = "<div data-bind='foreach: choices'><input type='checkbox' data-bind='" + binding + ":id, checked:$parent.values' /></div>"
        applyBindings(model, testNode)

        expect(model.values()).toEqual([1])
        expect(testNode.children[0]).toHaveCheckedStates([true, false])

                  // Update the value observable of the checked item; should update the selected values and leave checked values unchanged
        object1.id(3)
        expect(model.values()).toEqual([3])
        expect(testNode.children[0]).toHaveCheckedStates([true, false])

                  // Update the value observable of the unchecked item; should do nothing
        object2.id(4)
        expect(model.values()).toEqual([3])
        expect(testNode.children[0]).toHaveCheckedStates([true, false])

                  // Update the value observable of the unchecked item to the current model value; should set to checked
        object2.id(3)
        expect(model.values()).toEqual([3])
        expect(testNode.children[0]).toHaveCheckedStates([true, true])

                  // Update the value again; should leave checked and replace item in the selected values (other checkbox should be unchecked)
        object2.id(4)
        expect(model.values()).toEqual([4])
        expect(testNode.children[0]).toHaveCheckedStates([false, true])

                  // Revert to original value; should update value in selected values
        object2.id(2)
        expect(model.values()).toEqual([2])
        expect(testNode.children[0]).toHaveCheckedStates([false, true])
      })

      it('When node is removed, subscription to observable bound to \'' + binding + '\' is disposed', function () {
        var model = { values: [1], checkedValue: observable(1) }
        testNode.innerHTML = "<input type='checkbox' data-bind='" + binding + ":checkedValue, checked:values' />"
        applyBindings(model, testNode)

        var input = testNode.children[0] as HTMLInputElement
        expect(model.values).toEqual([1])
        expect(input.checked).toEqual(true)
        expect(model.checkedValue.getSubscriptionsCount()).toBeGreaterThan(0)

        removeNode(input)
        expect(model.checkedValue.getSubscriptionsCount()).toEqual(0)
      })

      it('Should use that value as the radio button\'s value', function () {
        var myobservable = observable(false)
        testNode.innerHTML = "<input type='radio' data-bind='checked:someProp, " + binding + ":true' />" +
                      "<input type='radio' data-bind='checked:someProp, " + binding + ":false' />"
        applyBindings({ someProp: myobservable }, testNode)
        
        expect(myobservable()).toEqual(false)

        // Check initial state
        expect(testNode).toHaveCheckedStates([false, true])
        // Update observable; verify elements
        myobservable(true)
        expect(testNode).toHaveCheckedStates([true, false])

        // "Click" a button; verify observable and elements
        var inputElement = testNode.children[1] as HTMLInputElement;
        inputElement.click()
        expect(myobservable()).toEqual(false)
        expect(testNode).toHaveCheckedStates([false, true])
      })

      it('Should be able to use observables as value of radio buttons', function () {
        var object1 = {id: observable(1)},
          object2 = {id: observable(2)},
          model = { value: observable(1), choices: [object1, object2] }
        testNode.innerHTML = "<div data-bind='foreach: choices'><input type='radio' data-bind='" + binding + ":id, checked:$parent.value' /></div>"
        applyBindings(model, testNode)

        expect(model.value()).toEqual(1)
        expect(testNode.children[0]).toHaveCheckedStates([true, false])

                  // Update the value observable of the checked item; should update the selected value and leave checked values unchanged
        object1.id(3)
        expect(model.value()).toEqual(3)
        expect(testNode.children[0]).toHaveCheckedStates([true, false])

                  // Update the value observable of the unchecked item; should do nothing
        object2.id(4)
        expect(model.value()).toEqual(3)
        expect(testNode.children[0]).toHaveCheckedStates([true, false])

                  // Update the value observable of the unchecked item to the current model value; should set to checked
        object2.id(3)
        expect(model.value()).toEqual(3)
        expect(testNode.children[0]).toHaveCheckedStates([true, true])

                  // Update the value again; should leave checked and replace selected value (other button should be unchecked)
        object2.id(4)
        expect(model.value()).toEqual(4)
        expect(testNode.children[0]).toHaveCheckedStates([false, true])

                  // Revert to original value; should update selected value
        object2.id(2)
        expect(model.value()).toEqual(2)
        expect(testNode.children[0]).toHaveCheckedStates([false, true])
      })

      if (binding === 'checkedValue') {
                  // When bound to a checkbox, the "checkedValue" binding will affect a non-array
                  // "checked" binding, but "value" won't.

        it('Should use that value as the checkbox\'s value when not bound to an array', function () {
          var myobservable = observable('random value')
          testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp, " + binding + ":true' />" +
                          "<input type='checkbox' data-bind='checked:someProp, " + binding + ":false' />"
          applyBindings({ someProp: myobservable }, testNode)

          expect(myobservable()).toEqual('random value')

                      // Check initial state: both are unchecked because neither has a matching value
          expect(testNode).toHaveCheckedStates([false, false])

                      // Update observable; verify element states
          myobservable(false)
          expect(testNode).toHaveCheckedStates([false, true])
          myobservable(true)
          expect(testNode).toHaveCheckedStates([true, false])

          var inputElement = testNode.children[1] as HTMLInputElement;

          // "check" a box; verify observable and elements
          inputElement.click()
          expect(myobservable()).toEqual(false)
          expect(testNode).toHaveCheckedStates([false, true])

          // "uncheck" a box; verify observable and elements
          inputElement.click()
          expect(myobservable()).toEqual(undefined)
          expect(testNode).toHaveCheckedStates([false, false])
        })

        it('Should be able to use observables as value of checkboxes when not bound to an array', function () {
          var object1 = {id: observable(1)},
            object2 = {id: observable(2)},
            model = { value: observable(1), choices: [object1, object2] }
          testNode.innerHTML = "<div data-bind='foreach: choices'><input type='checkbox' data-bind='" + binding + ":id, checked:$parent.value' /></div>"
          applyBindings(model, testNode)

          expect(model.value()).toEqual(1)
          expect(testNode.children[0]).toHaveCheckedStates([true, false])

                      // Update the value observable of the checked item; should update the selected values and leave checked values unchanged
          object1.id(3)
          expect(model.value()).toEqual(3)
          expect(testNode.children[0]).toHaveCheckedStates([true, false])

                      // Update the value observable of the unchecked item; should do nothing
          object2.id(4)
          expect(model.value()).toEqual(3)
          expect(testNode.children[0]).toHaveCheckedStates([true, false])

                      // Update the value observable of the unchecked item to the current model value; should set to checked
          object2.id(3)
          expect(model.value()).toEqual(3)
          expect(testNode.children[0]).toHaveCheckedStates([true, true])

                      // Update the value again; should leave checked and replace selected value (other button should be unchecked)
          object2.id(4)
          expect(model.value()).toEqual(4)
          expect(testNode.children[0]).toHaveCheckedStates([false, true])

                      // Revert to original value; should update selected value
          object2.id(2)
          expect(model.value()).toEqual(2)
          expect(testNode.children[0]).toHaveCheckedStates([false, true])
        })
      }

      it('Should ignore \'undefined\' value for checkbox', function () {
        var myobservable = observable(true)
        testNode.innerHTML = "<input type='checkbox' data-bind='checked: someProp, " + binding + ":undefined' />"
        applyBindings({ someProp: myobservable }, testNode)

        var input = testNode.children[0] as HTMLInputElement
        // ignores 'undefined' value and treats checkbox value as true/false
        expect(input.checked).toEqual(true)
        myobservable(false)
        expect(input.checked).toEqual(false)

        triggerEvent(input, 'click')
        expect(myobservable()).toEqual(true)
        triggerEvent(input, 'click')
        expect(myobservable()).toEqual(false)
      })
    })
  })
})
