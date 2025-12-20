import { triggerEvent, domData } from '@tko/utils'

import { computed } from '@tko/computed'

import { observable, observableArray } from '@tko/observable'

import { applyBindings } from '@tko/bind'

import { DataBindProvider } from '@tko/provider.databind'

import { options } from '@tko/utils'

import { bindings as coreBindings } from '../dist'

import '@tko/utils/helpers/jasmine-13-helper'

describe('Binding: Value', function () {
  let testNode: any //TODO HTMLElement will be better
  beforeEach(function () {
    testNode = jasmine.prepareTestNode()
  })

  beforeEach(function () {
    let provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    provider.bindingHandlers.set(coreBindings)
  })

  it('Should assign the value to the node', function () {
    testNode.innerHTML = "<input data-bind='value:123' />"
    applyBindings(null, testNode)
    expect(testNode.childNodes[0].value).toEqual('123')
  })

  it('Should treat null values as empty strings', function () {
    testNode.innerHTML = "<input data-bind='value:myProp' />"
    applyBindings({ myProp: observable(0) }, testNode)
    expect(testNode.childNodes[0].value).toEqual('0')
  })

  it('Should assign an empty string as value if the model value is null', function () {
    testNode.innerHTML = "<input data-bind='value:(null)' />"
    applyBindings(null, testNode)
    expect(testNode.childNodes[0].value).toEqual('')
  })

  it('Should assign an empty string as value if the model value is undefined', function () {
    testNode.innerHTML = "<input data-bind='value:undefined' />"
    applyBindings(null, testNode)
    expect(testNode.childNodes[0].value).toEqual('')
  })

  it('For observable values, should unwrap the value and update on change', function () {
    let myObservable = observable(123)
    testNode.innerHTML = "<input data-bind='value:someProp' />"
    applyBindings({ someProp: myObservable }, testNode)
    expect(testNode.childNodes[0].value).toEqual('123')
    myObservable(456)
    expect(testNode.childNodes[0].value).toEqual('456')
  })

  it("For observable values, should update on change if new value is 'strictly' different from previous value", function () {
    let myObservable = observable('+123')
    testNode.innerHTML = "<input data-bind='value:someProp' />"
    applyBindings({ someProp: myObservable }, testNode)
    expect(testNode.childNodes[0].value).toEqual('+123')
    myObservable(123)
    expect(testNode.childNodes[0].value).toEqual('123')
  })

  it("For writeable observable values, should catch the node's onchange and write values back to the observable", function () {
    let myObservable = observable(123)
    testNode.innerHTML = "<input data-bind='value:someProp' />"
    applyBindings({ someProp: myObservable }, testNode)
    testNode.childNodes[0].value = 'some user-entered value'
    triggerEvent(testNode.childNodes[0], 'change')
    expect(myObservable()).toEqual('some user-entered value')
  })

  it('For writeable observable values, should always write when triggered, even when value is the same', function () {
    let validValue = observable(123)
    let isValid = observable(true)
    let valueForEditing = computed({
      read: validValue,
      write: function (newValue) {
        if (!isNaN(newValue)) {
          isValid(true)
          validValue(newValue)
        } else {
          isValid(false)
        }
      }
    })

    testNode.innerHTML = "<input data-bind='value: valueForEditing' />"
    applyBindings({ valueForEditing: valueForEditing }, testNode)

    // set initial valid value
    testNode.childNodes[0].value = '1234'
    triggerEvent(testNode.childNodes[0], 'change')
    expect(validValue()).toEqual('1234')
    expect(isValid()).toEqual(true)

    // set to an invalid value
    testNode.childNodes[0].value = '1234a'
    triggerEvent(testNode.childNodes[0], 'change')
    expect(validValue()).toEqual('1234')
    expect(isValid()).toEqual(false)

    // set to a valid value where the current value of the writeable computed is the same as the written value
    testNode.childNodes[0].value = '1234'
    triggerEvent(testNode.childNodes[0], 'change')
    expect(validValue()).toEqual('1234')
    expect(isValid()).toEqual(true)
  })

  it('Should ignore node changes when bound to a read-only observable', function () {
    let computedValue = computed(function () {
      return 'zzz'
    })
    let vm = { prop: computedValue }

    testNode.innerHTML = "<input data-bind='value: prop' />"
    applyBindings(vm, testNode)
    expect(testNode.childNodes[0].value).toEqual('zzz')

    // Change the input value and trigger change event; verify that the view model wasn't changed
    testNode.childNodes[0].value = 'yyy'
    triggerEvent(testNode.childNodes[0], 'change')
    expect(vm.prop).toEqual(computedValue)
    expect(computedValue()).toEqual('zzz')
  })

  it("For non-observable property values, should catch the node's onchange and write values back to the property", function () {
    let model = { modelProperty123: 456 }
    testNode.innerHTML = "<input data-bind='value: modelProperty123' />"
    applyBindings(model, testNode)
    expect(testNode.childNodes[0].value).toEqual('456')

    testNode.childNodes[0].value = 789
    triggerEvent(testNode.childNodes[0], 'change')
    expect(model.modelProperty123).toEqual('789')
  })

  it('Should be able to read and write to a property of an object returned by a function', function () {
    let mySetter = { set: 666 }
    let model = {
      getSetter: function () {
        return mySetter
      }
    }
    testNode.innerHTML =
      "<input data-bind='value: getSetter().set' />"
      + '<input data-bind=\'value: getSetter()["set"]\' />'
      + '<input data-bind="value: getSetter()[\'set\']" />'
    applyBindings(model, testNode)
    expect(testNode.childNodes[0].value).toEqual('666')
    expect(testNode.childNodes[1].value).toEqual('666')
    expect(testNode.childNodes[2].value).toEqual('666')

    // .property
    testNode.childNodes[0].value = 667
    triggerEvent(testNode.childNodes[0], 'change')
    expect(mySetter.set).toEqual('667')

    // ["property"]
    testNode.childNodes[1].value = 668
    triggerEvent(testNode.childNodes[1], 'change')
    expect(mySetter.set).toEqual('668')

    // ['property']
    testNode.childNodes[0].value = 669
    triggerEvent(testNode.childNodes[0], 'change')
    expect(mySetter.set).toEqual('669')
  })

  it('Should be able to write to observable subproperties of an observable, even after the parent observable has changed', function () {
    // This spec represents https://github.com/SteveSanderson/knockout/issues#issue/13
    let originalSubproperty = observable('original value')
    let newSubproperty = observable()
    let model = { myprop: observable({ subproperty: originalSubproperty }) }

    // Set up a text box whose value is linked to the subproperty of the observable's current value
    testNode.innerHTML = "<input data-bind='value: myprop().subproperty' />"
    applyBindings(model, testNode)
    expect(testNode.childNodes[0].value).toEqual('original value')

    model.myprop({ subproperty: newSubproperty }) // Note that myprop (and hence its subproperty) is changed *after* the bindings are applied
    testNode.childNodes[0].value = 'Some new value'
    triggerEvent(testNode.childNodes[0], 'change')

    // Verify that the change was written to the *new* subproperty, not the one referenced when the bindings were first established
    expect(newSubproperty()).toEqual('Some new value')
    expect(originalSubproperty()).toEqual('original value')
  })

  it('Should only register one single onchange handler', function () {
    let notifiedValues = new Array()
    let myObservable = observable(123)
    myObservable.subscribe(function (value) {
      notifiedValues.push(value)
    })
    expect(notifiedValues.length).toEqual(0)

    testNode.innerHTML = "<input data-bind='value:someProp' />"
    applyBindings({ someProp: myObservable }, testNode)

    // Implicitly observe the number of handlers by seeing how many times "myObservable"
    // receives a new value for each onchange on the text box. If there's just one handler,
    // we'll see one new value per onchange event. More handlers cause more notifications.
    testNode.childNodes[0].value = 'ABC'
    triggerEvent(testNode.childNodes[0], 'change')
    expect(notifiedValues.length).toEqual(1)

    testNode.childNodes[0].value = 'DEF'
    triggerEvent(testNode.childNodes[0], 'change')
    expect(notifiedValues.length).toEqual(2)
  })

  it('Should be able to catch updates after specific events (e.g., keyup) instead of onchange', function () {
    let myObservable = observable(123)
    testNode.innerHTML = '<input data-bind=\'value:someProp, valueUpdate: "keyup"\' />'
    applyBindings({ someProp: myObservable }, testNode)
    testNode.childNodes[0].value = 'some user-entered value'
    triggerEvent(testNode.childNodes[0], 'keyup')
    expect(myObservable()).toEqual('some user-entered value')
  })

  it('Should catch updates on change as well as the nominated valueUpdate event', function () {
    // Represents issue #102 (https://github.com/SteveSanderson/knockout/issues/102)
    let myObservable = observable(123)
    testNode.innerHTML = '<input data-bind=\'value:someProp, valueUpdate: "keyup"\' />'
    applyBindings({ someProp: myObservable }, testNode)
    testNode.childNodes[0].value = 'some user-entered value'
    triggerEvent(testNode.childNodes[0], 'change')
    expect(myObservable()).toEqual('some user-entered value')
  })

  it('Should delay reading value and updating observable when prefixing an event with "after"', function () {
    jasmine.Clock.useMock()

    let myObservable = observable('123')
    testNode.innerHTML = '<input data-bind=\'value:someProp, valueUpdate: "afterkeyup"\' />'
    applyBindings({ someProp: myObservable }, testNode)
    triggerEvent(testNode.childNodes[0], 'keyup')
    testNode.childNodes[0].value = 'some user-entered value'
    expect(myObservable()).toEqual('123') // observable is not changed yet

    jasmine.Clock.tick(20)
    expect(myObservable()).toEqual('some user-entered value') // it's changed after a delay
  })

  it('Should ignore "unchanged" notifications from observable during delayed event processing', function () {
    jasmine.Clock.useMock()

    let myObservable = observable('123')
    testNode.innerHTML = '<input data-bind=\'value:someProp, valueUpdate: "afterkeyup"\' />'
    applyBindings({ someProp: myObservable }, testNode)
    triggerEvent(testNode.childNodes[0], 'keyup')
    testNode.childNodes[0].value = 'some user-entered value'

    // Notification of previous value (unchanged) is ignored
    myObservable.valueHasMutated()
    expect(testNode.childNodes[0].value).toEqual('some user-entered value')

    // Observable is updated to new element value
    jasmine.Clock.tick(20)
    expect(myObservable()).toEqual('some user-entered value')
  })

  it('Should not ignore actual change notifications from observable during delayed event processing', function () {
    jasmine.Clock.useMock()

    let myObservable = observable('123')
    testNode.innerHTML = '<input data-bind=\'value:someProp, valueUpdate: "afterkeyup"\' />'
    applyBindings({ someProp: myObservable }, testNode)
    triggerEvent(testNode.childNodes[0], 'keyup')
    testNode.childNodes[0].value = 'some user-entered value'

    // New value is written to input element
    myObservable('some value from the server')
    expect(testNode.childNodes[0].value).toEqual('some value from the server')

    // New value remains when event is processed
    jasmine.Clock.tick(20)
    expect(myObservable()).toEqual('some value from the server')
  })

  it('On IE < 10, should handle autofill selection by treating "propertychange" followed by "blur" as a change event', function () {
    // This spec describes the awkward choreography of events needed to detect changes to text boxes on IE < 10,
    // because it doesn't fire regular "change" events when the user selects an autofill entry. It isn't applicable
    // on IE 10+ or other browsers, because they don't have that problem with autofill.
    let isOldIE = jasmine.ieVersion && jasmine.ieVersion < 10

    if (isOldIE) {
      let myObservable = observable(123).extend({ notify: 'always' })
      let numUpdates = 0
      myObservable.subscribe(function () {
        numUpdates++
      })
      testNode.innerHTML = "<input data-bind='value:someProp' />"
      applyBindings({ someProp: myObservable }, testNode)

      // Simulate a blur occurring before the first real property change.
      // See that no 'update' event fires.
      triggerEvent(testNode.childNodes[0], 'focus')
      triggerEvent(testNode.childNodes[0], 'blur')
      expect(numUpdates).toEqual(0)

      // Simulate:
      // 1. Select from autofill
      // 2. Modify the textbox further
      // 3. Tab out of the textbox
      // --- should be treated as a single change
      testNode.childNodes[0].value = 'some user-entered value'
      triggerEvent(testNode.childNodes[0], 'propertychange')
      triggerEvent(testNode.childNodes[0], 'change')
      expect(myObservable()).toEqual('some user-entered value')
      expect(numUpdates).toEqual(1)
      triggerEvent(testNode.childNodes[0], 'blur')
      expect(numUpdates).toEqual(1)

      // Simulate:
      // 1. Select from autofill
      // 2. Tab out of the textbox
      // 3. Reselect, edit, then tab out of the textbox
      // --- should be treated as two changes (one after step 2, one after step 3)
      testNode.childNodes[0].value = 'different user-entered value'
      triggerEvent(testNode.childNodes[0], 'propertychange')
      triggerEvent(testNode.childNodes[0], 'blur')
      expect(myObservable()).toEqual('different user-entered value')
      expect(numUpdates).toEqual(2)
      triggerEvent(testNode.childNodes[0], 'change')
      expect(numUpdates).toEqual(3)
    }
  })

  it('Should bind to file inputs but not allow setting an non-empty value', function () {
    let prop = observable('zzz')
    let vm = { prop }

    testNode.innerHTML = "<input type='file' data-bind='value: prop' />"
    applyBindings(vm, testNode)
    expect(testNode.childNodes[0].value).toEqual('')
  })

  describe('For select boxes', function () {
    it('Should update selectedIndex when the model changes (options specified before value)', function () {
      let myObservable = observable('B')
      testNode.innerHTML = '<select data-bind=\'options:["A", "B"], value:myObservable\'></select>'
      applyBindings({ myObservable: myObservable }, testNode)
      expect(testNode.childNodes[0].selectedIndex).toEqual(1)
      expect(myObservable()).toEqual('B')

      myObservable('A')
      expect(testNode.childNodes[0].selectedIndex).toEqual(0)
      expect(myObservable()).toEqual('A')
    })

    it('Should update selectedIndex when the model changes (value specified before options)', function () {
      let myObservable = observable('B')
      testNode.innerHTML = '<select data-bind=\'value:myObservable, options:["A", "B"]\'></select>'
      applyBindings({ myObservable: myObservable }, testNode)
      expect(testNode.childNodes[0].selectedIndex).toEqual(1)
      expect(myObservable()).toEqual('B')

      myObservable('A')
      expect(testNode.childNodes[0].selectedIndex).toEqual(0)
      expect(myObservable()).toEqual('A')

      // Also check that the selection doesn't change later (see https://github.com/knockout/knockout/issues/2218)
      waits(10)
      runs(function () {
        expect(testNode.childNodes[0].selectedIndex).toEqual(0)
      })
    })

    it('Should display the caption when the model value changes to undefined, null, or \"\" when using \'options\' binding', function () {
      let myObservable = observable('B')
      testNode.innerHTML =
        '<select data-bind=\'options:["A", "B"], optionsCaption:"Select...", value:myObservable\'></select>'
      applyBindings({ myObservable: myObservable }, testNode)

      // Caption is selected when observable changed to undefined
      expect(testNode.childNodes[0].selectedIndex).toEqual(2)
      myObservable(undefined)
      expect(testNode.childNodes[0].selectedIndex).toEqual(0)

      // Caption is selected when observable changed to null
      myObservable('B')
      expect(testNode.childNodes[0].selectedIndex).toEqual(2)
      myObservable(null)
      expect(testNode.childNodes[0].selectedIndex).toEqual(0)

      // Caption is selected when observable changed to ""
      myObservable('B')
      expect(testNode.childNodes[0].selectedIndex).toEqual(2)
      myObservable('')
      expect(testNode.childNodes[0].selectedIndex).toEqual(0)
    })

    it('Should display the caption when the model value changes to undefined, null, or \"\" when options specified directly', function () {
      let myObservable = observable('B')
      testNode.innerHTML =
        "<select data-bind='value:myObservable'><option value=''>Select...</option><option>A</option><option>B</option></select>"
      applyBindings({ myObservable: myObservable }, testNode)

      // Caption is selected when observable changed to undefined
      expect(testNode.childNodes[0].selectedIndex).toEqual(2)
      myObservable(undefined)
      expect(testNode.childNodes[0].selectedIndex).toEqual(0)

      // Caption is selected when observable changed to null
      myObservable('B')
      expect(testNode.childNodes[0].selectedIndex).toEqual(2)
      myObservable(null)
      expect(testNode.childNodes[0].selectedIndex).toEqual(0)

      // Caption is selected when observable changed to ""
      myObservable('B')
      expect(testNode.childNodes[0].selectedIndex).toEqual(2)
      myObservable('')
      expect(testNode.childNodes[0].selectedIndex).toEqual(0)
    })

    it('When size > 1, should unselect all options when value is undefined, null, or \"\"', function () {
      let myObservable = observable('B')
      testNode.innerHTML = '<select size=\'2\' data-bind=\'options:["A", "B"], value:myObservable\'></select>'
      applyBindings({ myObservable: myObservable }, testNode)

      // Nothing is selected when observable changed to undefined
      expect(testNode.childNodes[0].selectedIndex).toEqual(1)
      myObservable(undefined)
      expect(testNode.childNodes[0].selectedIndex).toEqual(-1)

      // Nothing is selected when observable changed to null
      myObservable('B')
      expect(testNode.childNodes[0].selectedIndex).toEqual(1)
      myObservable(null)
      expect(testNode.childNodes[0].selectedIndex).toEqual(-1)

      // Nothing is selected when observable changed to ""
      myObservable('B')
      expect(testNode.childNodes[0].selectedIndex).toEqual(1)
      myObservable('')
      expect(testNode.childNodes[0].selectedIndex).toEqual(-1)
    })

    it('Should update the model value when the UI is changed (setting it to undefined when the caption is selected)', function () {
      let myObservable = observable('B')
      testNode.innerHTML =
        '<select data-bind=\'options:["A", "B"], optionsCaption:"Select...", value:myObservable\'></select>'
      applyBindings({ myObservable: myObservable }, testNode)
      let dropdown = testNode.childNodes[0]

      dropdown.selectedIndex = 1
      triggerEvent(dropdown, 'change')
      expect(myObservable()).toEqual('A')

      dropdown.selectedIndex = 0
      triggerEvent(dropdown, 'change')
      expect(myObservable()).toEqual(undefined)
    })

    it('Should be able to associate option values with arbitrary objects (not just strings)', function () {
      let x = {},
        y = {}
      let selectedValue = observable(y)
      testNode.innerHTML = "<select data-bind='options: myOptions, value: selectedValue'></select>"
      let dropdown = testNode.childNodes[0]
      applyBindings({ myOptions: [x, y], selectedValue: selectedValue }, testNode)

      // Check the UI displays the entry corresponding to the chosen value
      expect(dropdown.selectedIndex).toEqual(1)

      // Check that when we change the model value, the UI is updated
      selectedValue(x)
      expect(dropdown.selectedIndex).toEqual(0)

      // Check that when we change the UI, this changes the model value
      dropdown.selectedIndex = 1
      triggerEvent(dropdown, 'change')
      expect(selectedValue()).toEqual(y)
    })

    it('Should automatically initialize the model property to match the first option value if no option value matches the current model property value', function () {
      // The rationale here is that we always want the model value to match the option that appears to be selected in the UI
      //  * If there is *any* option value that equals the model value, we'd initalise the select box such that *that* option is the selected one
      //  * If there is *no* option value that equals the model value (often because the model value is undefined), we should set the model
      //    value to match an arbitrary option value to avoid inconsistency between the visible UI and the model
      let myObservable = observable() // Undefined by default

      // Should work with options specified before value
      testNode.innerHTML = '<select data-bind=\'options:["A", "B"], value:myObservable\'></select>'
      applyBindings({ myObservable: myObservable }, testNode)
      expect(myObservable()).toEqual('A')

      // ... and with value specified before options
      domData.clear(testNode)
      testNode.innerHTML = '<select data-bind=\'value:myObservable, options:["A", "B"]\'></select>'
      myObservable(undefined)
      expect(myObservable()).toEqual(undefined)
      applyBindings({ myObservable: myObservable }, testNode)
      expect(myObservable()).toEqual('A')
    })

    it("When non-empty, should reject model values that don't match any option value, resetting the model value to whatever is visibly selected in the UI", function () {
      let myObservable = observable('B')
      testNode.innerHTML = '<select data-bind=\'options:["A", "B", "C"], value:myObservable\'></select>'
      applyBindings({ myObservable: myObservable }, testNode)
      expect(testNode.childNodes[0].selectedIndex).toEqual(1)

      myObservable('D') // This change should be rejected, as there's no corresponding option in the UI
      expect(myObservable()).toEqual('B')

      myObservable(null) // This change should also be rejected
      expect(myObservable()).toEqual('B')
    })

    it('Should support numerical option values, which are not implicitly converted to strings', function () {
      let myObservable = observable(30)
      testNode.innerHTML = "<select data-bind='options:[10,20,30,40], value:myObservable'></select>"
      applyBindings({ myObservable: myObservable }, testNode)

      // First check that numerical model values will match a dropdown option
      expect(testNode.childNodes[0].selectedIndex).toEqual(2) // 3rd element, zero-indexed

      // Then check that dropdown options map back to numerical model values
      testNode.childNodes[0].selectedIndex = 1
      triggerEvent(testNode.childNodes[0], 'change')
      expect(typeof myObservable()).toEqual('number')
      expect(myObservable()).toEqual(20)
    })

    it('Should always use value (and not text) when options have value attributes', function () {
      let myObservable = observable('A')
      testNode.innerHTML =
        "<select data-bind='value:myObservable'><option value=''>A</option><option value='A'>B</option></select>"
      applyBindings({ myObservable: myObservable }, testNode)
      let dropdown = testNode.childNodes[0]
      expect(dropdown.selectedIndex).toEqual(1)

      dropdown.selectedIndex = 0
      triggerEvent(dropdown, 'change')
      expect(myObservable()).toEqual('')
    })

    it('Should use text value when options have text values but no value attribute', function () {
      let myObservable = observable('B')
      testNode.innerHTML =
        "<select data-bind='value:myObservable'><option>A</option><option>B</option><option>C</option></select>"
      applyBindings({ myObservable: myObservable }, testNode)
      let dropdown = testNode.childNodes[0]
      expect(dropdown.selectedIndex).toEqual(1)

      dropdown.selectedIndex = 0
      triggerEvent(dropdown, 'change')
      expect(myObservable()).toEqual('A')

      myObservable('C')
      expect(dropdown.selectedIndex).toEqual(2)
    })

    it('Should not throw an exception for value binding on multiple select boxes', function () {
      testNode.innerHTML =
        "<select data-bind=\"options: ['abc','def','ghi'], value: x\"></select><select data-bind=\"options: ['xyz','uvw'], value: x\"></select>"
      let myObservable = observable()
      expect(function () {
        applyBindings({ x: myObservable }, testNode)
      }).not.toThrow()
      expect(myObservable()).not.toBeUndefined() // The spec doesn't specify which of the two possible values is actually set
    })

    describe('Using valueAllowUnset option', function () {
      it('Should display the caption when the model value changes to undefined, null, or \"\" when using \'options\' binding', function () {
        let myObservable = observable('B')
        testNode.innerHTML =
          '<select data-bind=\'options:["A", "B"], optionsCaption:"Select...", value:myObservable, valueAllowUnset:true\'></select>'
        applyBindings({ myObservable: myObservable }, testNode)
        let select = testNode.childNodes[0]

        select.selectedIndex = 2
        myObservable(undefined)
        expect(select.selectedIndex).toEqual(0)

        select.selectedIndex = 2
        myObservable(null)
        expect(select.selectedIndex).toEqual(0)

        select.selectedIndex = 2
        myObservable('')
        expect(select.selectedIndex).toEqual(0)
      })

      it('Should display the caption when the model value changes to undefined, null, or \"\" when options specified directly', function () {
        let myObservable = observable('B')
        testNode.innerHTML =
          "<select data-bind='value:myObservable, valueAllowUnset:true'><option value=''>Select...</option><option>A</option><option>B</option></select>"
        applyBindings({ myObservable: myObservable }, testNode)
        let select = testNode.childNodes[0]

        select.selectedIndex = 2
        myObservable(undefined)
        expect(select.selectedIndex).toEqual(0)

        select.selectedIndex = 2
        myObservable(null)
        expect(select.selectedIndex).toEqual(0)

        select.selectedIndex = 2
        myObservable('')
        expect(select.selectedIndex).toEqual(0)
      })

      it('Should display the caption when the model value changes to undefined after having no selection', function () {
        let myObservable = observable('B')
        testNode.innerHTML =
          '<select data-bind=\'options:["A", "B"], optionsCaption:"Select...", value:myObservable, valueAllowUnset:true\'></select>'
        applyBindings({ myObservable }, testNode)
        let select = testNode.childNodes[0]

        select.selectedIndex = -1
        myObservable(undefined)
        expect(select.selectedIndex).toEqual(0)
      })

      it('Should select no option value if no option value matches the current model property value', function () {
        let myObservable = observable()
        testNode.innerHTML =
          '<select data-bind=\'options:["A", "B"], value:myObservable, valueAllowUnset:true\'></select>'
        applyBindings({ myObservable: myObservable }, testNode)

        expect(testNode.childNodes[0].selectedIndex).toEqual(-1)
        expect(myObservable()).toEqual(undefined)
      })

      it("Should select no option value if model value does't match any option value", function () {
        let myObservable = observable('B')
        testNode.innerHTML =
          '<select data-bind=\'options:["A", "B", "C"], value:myObservable, valueAllowUnset:true\'></select>'
        applyBindings({ myObservable: myObservable }, testNode)
        expect(testNode.childNodes[0].selectedIndex).toEqual(1)

        myObservable('D')
        expect(testNode.childNodes[0].selectedIndex).toEqual(-1)
      })

      it('Should maintain model value and update selection when options change', function () {
        let myObservable = observable('D')
        let options = observableArray(['A', 'B'])
        testNode.innerHTML = "<select data-bind='options:myOptions, value:myObservable, valueAllowUnset:true'></select>"
        applyBindings({ myObservable: myObservable, myOptions: options }, testNode)

        // Initially nothing is selected because the value isn't in the options list
        expect(testNode.childNodes[0].selectedIndex).toEqual(-1)
        expect(myObservable()).toEqual('D')

        // Replace with new options that still don't contain the value
        options(['B', 'C'])
        expect(testNode.childNodes[0].selectedIndex).toEqual(-1)
        expect(myObservable()).toEqual('D')

        // Now update with options that do contain the value
        options(['C', 'D'])
        expect(testNode.childNodes[0].selectedIndex).toEqual(1)
        expect(myObservable()).toEqual('D')

        // Update back to options that don't contain the value
        options(['E', 'F'])
        expect(testNode.childNodes[0].selectedIndex).toEqual(-1)
        expect(myObservable()).toEqual('D')
      })

      it('Should maintain model value and update selection when changing observable option text or value', function () {
        let selected = observable('B')
        let people = [
          { name: observable('Annie'), id: observable('A') },
          { name: observable('Bert'), id: observable('B') }
        ]
        testNode.innerHTML =
          "<select data-bind=\"options:people, optionsText:'name', optionsValue:'id', value:selected, valueAllowUnset:true\"></select>"

        applyBindings({ people: people, selected: selected }, testNode)
        expect(testNode.childNodes[0].selectedIndex).toEqual(1)
        expect(testNode.childNodes[0]).toHaveTexts(['Annie', 'Bert'])
        expect(selected()).toEqual('B')

        // Changing an option name shouldn't change selection
        people[1].name('Charles')
        expect(testNode.childNodes[0].selectedIndex).toEqual(1)
        expect(testNode.childNodes[0]).toHaveTexts(['Annie', 'Charles'])
        expect(selected()).toEqual('B')

        // Changing the selected option value should clear selection
        people[1].id('C')
        expect(testNode.childNodes[0].selectedIndex).toEqual(-1)
        expect(selected()).toEqual('B')

        // Changing an option name while nothing is selected won't select anything
        people[0].name('Amelia')
        expect(testNode.childNodes[0].selectedIndex).toEqual(-1)
        expect(selected()).toEqual('B')
      })

      it('Should select no options if model value is null and option value is 0', function () {
        let myObservable = observable(null)
        let options = [
          { name: 'B', id: 1 },
          { name: 'A', id: 0 }
        ]
        testNode.innerHTML =
          '<select data-bind=\'options:options, optionsValue:"id", optionsText:"name", value:myObservable, valueAllowUnset:true\'></select>'
        applyBindings({ myObservable, options }, testNode)

        expect(testNode.childNodes[0].selectedIndex).toEqual(-1)
        expect(myObservable()).toEqual(undefined)
      })
    })
  })

  describe("Acts like 'checkedValue' on a checkbox or radio", function () {
    it('Should update value, but not respond to events when on a checkbox', function () {
      let myObservable = observable('B')
      testNode.innerHTML = "<input type='checkbox' data-bind='value: myObservable' />"
      applyBindings({ myObservable: myObservable }, testNode)

      let checkbox = testNode.childNodes[0]
      expect(checkbox.value).toEqual('B')

      myObservable('C')
      expect(checkbox.value).toEqual('C')

      checkbox.value = 'D'
      triggerEvent(checkbox, 'change')

      // observable does not update, as we are not handling events when on a checkbox/radio
      expect(myObservable()).toEqual('C')
    })

    it('Should update value, but not respond to events when on a radio', function () {
      let myObservable = observable('B')
      testNode.innerHTML = "<input type='radio' data-bind='value: myObservable' />"
      applyBindings({ myObservable: myObservable }, testNode)

      let radio = testNode.childNodes[0]
      expect(radio.value).toEqual('B')

      myObservable('C')
      expect(radio.value).toEqual('C')

      radio.value = 'D'
      triggerEvent(radio, 'change')

      // observable does not update, as we are not handling events when on a checkbox/radio
      expect(myObservable()).toEqual('C')
    })
  })
})
