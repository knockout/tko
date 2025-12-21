/* global testNode */
import { applyBindings } from '@tko/bind'

import { computed } from '@tko/computed'

import { observable } from '@tko/observable'

import { triggerEvent, options } from '@tko/utils'

import { DataBindProvider } from '@tko/provider.databind'

import { bindings as coreBindings } from '../dist'

const DEBUG = true

import '@tko/utils/helpers/jasmine-13-helper'

describe('Binding: TextInput', function () {
  let bindingHandlers
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = jasmine.prepareTestNode()
  })

  beforeEach(function () {
    let provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    bindingHandlers = provider.bindingHandlers
    bindingHandlers.set(coreBindings)
  })

  it('Should assign the value to the node', function () {
    testNode.innerHTML = "<input data-bind='textInput:123' />"
    applyBindings(null, testNode)
    expect((testNode.children[0] as HTMLInputElement).value).toEqual('123')
  })

  it('Should treat null values as empty strings', function () {
    testNode.innerHTML = "<input data-bind='textInput:myProp' />"
    applyBindings({ myProp: observable(0) }, testNode)
    expect((testNode.children[0] as HTMLInputElement).value).toEqual('0')
  })

  it('Should assign an empty string as value if the model value is null', function () {
    testNode.innerHTML = "<input data-bind='textInput:(null)' />"
    applyBindings(null, testNode)
    expect((testNode.children[0] as HTMLInputElement).value).toEqual('')
  })

  it('Should assign an empty string as value if the model value is undefined', function () {
    testNode.innerHTML = "<input data-bind='textInput:undefined' />"
    applyBindings(null, testNode)
    expect((testNode.children[0] as HTMLInputElement).value).toEqual('')
  })

  it('For observable values, should unwrap the value and update on change', function () {
    let myObservable = observable(123)
    testNode.innerHTML = "<input data-bind='textInput:someProp' />"
    applyBindings({ someProp: myObservable }, testNode)
    expect((testNode.children[0] as HTMLInputElement).value).toEqual('123')
    myObservable(456)
    expect((testNode.children[0] as HTMLInputElement).value).toEqual('456')
  })

  it("For observable values, should update on change if new value is 'strictly' different from previous value", function () {
    let myObservable = observable('+123')
    testNode.innerHTML = "<input data-bind='textInput:someProp' />"
    applyBindings({ someProp: myObservable }, testNode)
    expect((testNode.children[0] as HTMLInputElement).value).toEqual('+123')
    myObservable(123)
    expect((testNode.children[0] as HTMLInputElement).value).toEqual('123')
  })

  it("For writeable observable values, should catch the node's onchange and write values back to the observable", function () {
    let myObservable = observable(123)
    testNode.innerHTML = "<input data-bind='textInput:someProp' />"
    applyBindings({ someProp: myObservable }, testNode)
    ;(testNode.children[0] as HTMLInputElement).value = 'some user-entered value'
    triggerEvent(testNode.children[0], 'change')
    expect(myObservable()).toEqual('some user-entered value')
  })

  it('For writeable observable values, when model rejects change, update view to match', function () {
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

    testNode.innerHTML = "<input data-bind='textInput: valueForEditing' />"
    applyBindings({ valueForEditing: valueForEditing }, testNode)

    // set initial valid value
    ;(testNode.children[0] as HTMLInputElement).value = '1234'
    triggerEvent(testNode.children[0], 'change')
    expect(validValue()).toEqual('1234')
    expect(isValid()).toEqual(true)
    expect((testNode.children[0] as HTMLInputElement).value).toEqual('1234')

    // set to an invalid value
    ;(testNode.children[0] as HTMLInputElement).value = '1234a'
    triggerEvent(testNode.children[0], 'change')
    expect(validValue()).toEqual('1234')
    expect(isValid()).toEqual(false)
    expect((testNode.children[0] as HTMLInputElement).value).toEqual('1234a')

    // set to a valid value where the current value of the writeable computed is the same as the written value
    ;(testNode.children[0] as HTMLInputElement).value = '1234'
    triggerEvent(testNode.children[0], 'change')
    expect(validValue()).toEqual('1234')
    expect(isValid()).toEqual(true)
    expect((testNode.children[0] as HTMLInputElement).value).toEqual('1234')
  })

  it('Should ignore node changes when bound to a read-only observable', function () {
    let computedValue = computed(function () {
      return 'zzz'
    })
    let vm = { prop: computedValue }

    testNode.innerHTML = "<input data-bind='textInput: prop' />"
    applyBindings(vm, testNode)
    expect((testNode.children[0] as HTMLInputElement).value).toEqual('zzz')

    // Change the input value and trigger change event; verify that the view model wasn't changed
    ;(testNode.children[0] as HTMLInputElement).value = 'yyy'
    triggerEvent(testNode.children[0], 'change')
    expect(vm.prop).toEqual(computedValue)
    expect(computedValue()).toEqual('zzz')
  })

  it("For non-observable property values, should catch the node's onchange and write values back to the property", function () {
    let model = { modelProperty123: 456 }
    testNode.innerHTML = "<input data-bind='textInput: modelProperty123' />"
    applyBindings(model, testNode)
    expect((testNode.children[0] as HTMLInputElement).value).toEqual('456')
    ;((testNode.children[0] as HTMLInputElement).value as any) = 789 // only string values are accepted
    triggerEvent(testNode.children[0], 'change')
    expect(model.modelProperty123).toEqual('789')
  })

  it('Should support alias "textinput"', function () {
    testNode.innerHTML = "<input data-bind='textinput:123' />"
    applyBindings(null, testNode)
    expect((testNode.children[0] as HTMLInputElement).value).toEqual('123')
  })

  it('Should write to non-observable property values using "textinput" alias', function () {
    let model = { modelProperty123: 456 }
    testNode.innerHTML = "<input data-bind='textinput: modelProperty123' />"
    applyBindings(model, testNode)
    expect((testNode.children[0] as HTMLInputElement).value).toEqual('456')
    ;((testNode.children[0] as HTMLInputElement).value as any) = 789
    triggerEvent(testNode.children[0], 'change')
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
      "<input data-bind='textInput: getSetter().set' />"
      + '<input data-bind=\'textInput: getSetter()["set"]\' />'
      + '<input data-bind="textInput: getSetter()[\'set\']" />'
    applyBindings(model, testNode)
    expect((testNode.children[0] as HTMLInputElement).value).toEqual('666')
    expect((testNode.children[1] as HTMLInputElement).value).toEqual('666')
    expect((testNode.children[2] as HTMLInputElement).value).toEqual('666')

    // .property
    ;((testNode.children[0] as HTMLInputElement).value as any) = 667
    triggerEvent(testNode.children[0], 'change')
    expect(mySetter.set).toEqual('667')

    // ["property"]
    ;((testNode.childNodes[1] as HTMLInputElement).value as any) = 668
    triggerEvent(testNode.childNodes[1] as Element, 'change')
    expect(mySetter.set).toEqual('668')

    // ['property']
    ;((testNode.children[0] as HTMLInputElement).value as any) = 669
    triggerEvent(testNode.children[0], 'change')
    expect(mySetter.set).toEqual('669')
  })

  it('Should be able to write to observable subproperties of an observable, even after the parent observable has changed', function () {
    // This spec represents https://github.com/SteveSanderson/knockout/issues#issue/13
    let originalSubproperty = observable('original value')
    let newSubproperty = observable()
    let model = { myprop: observable({ subproperty: originalSubproperty }) }

    // Set up a text box whose value is linked to the subproperty of the observable's current value
    testNode.innerHTML = "<input data-bind='textInput: myprop().subproperty' />"
    applyBindings(model, testNode)
    expect((testNode.children[0] as HTMLInputElement).value).toEqual('original value')

    model.myprop({ subproperty: newSubproperty }) // Note that myprop (and hence its subproperty) is changed *after* the bindings are applied
    ;(testNode.children[0] as HTMLInputElement).value = 'Some new value'
    triggerEvent(testNode.children[0], 'change')

    // Verify that the change was written to the *new* subproperty, not the one referenced when the bindings were first established
    expect(newSubproperty()).toEqual('Some new value')
    expect(originalSubproperty()).toEqual('original value')
  })

  it('Should update observable on input event (on supported browsers) or propertychange event (on old IE)', function () {
    let myObservable = observable(123)
    testNode.innerHTML = "<input data-bind='textInput: someProp' />"
    applyBindings({ someProp: myObservable }, testNode)
    expect((testNode.children[0] as HTMLInputElement).value).toEqual('123')
    ;(testNode.children[0] as HTMLInputElement).value = 'some user-entered value' // setting the value triggers the propertychange event on IE
    if (!jasmine.ieVersion || jasmine.ieVersion >= 9) {
      triggerEvent(testNode.children[0], 'input')
    }
    if (jasmine.ieVersion === 9) {
      // IE 9 responds to the event asynchronously (see #1788)
      waitsFor(
        function () {
          return myObservable() === 'some user-entered value'
        },
        'Timeout',
        50
      )
    } else {
      expect(myObservable()).toEqual('some user-entered value')
    }
  })

  it('Should update observable on blur event', function () {
    let myobservable = observable(123)
    testNode.innerHTML = "<input data-bind='textInput: someProp' /><input />"
    applyBindings({ someProp: myobservable }, testNode)
    expect((testNode.children[0] as HTMLInputElement).value).toEqual('123')
    ;(testNode.children[0] as HTMLInputElement).focus()
    ;(testNode.children[0] as HTMLInputElement).value = 'some user-entered value'
    ;(testNode.children[1] as HTMLInputElement).focus() // focus on a different input to blur the previous one
    triggerEvent(testNode.children[0], 'blur')
    expect(myobservable()).toEqual('some user-entered value')
  })

  interface ModelType {
    writtenValue: string | undefined
    someProp: string | undefined
  }

  it('Should write only changed values to model', function () {
    let model: ModelType = { writtenValue: '', someProp: undefined }

    testNode.innerHTML = "<input data-bind='textInput: writtenValue' />"
    applyBindings(model, testNode)
    ;(testNode.children[0] as HTMLInputElement).value = '1234'
    triggerEvent(testNode.children[0], 'change')
    expect(model.writtenValue).toEqual('1234')

    // trigger change event with the same value
    model.writtenValue = undefined
    triggerEvent(testNode.children[0], 'change')
    expect(model.writtenValue).toBeUndefined()
  })

  it('Should not write to model other than for user input', function () {
    // In html5, the value returned by element.value is normalized and CR characters are transformed,
    // See http://www.w3.org/TR/html5/forms.html#the-textarea-element, https://github.com/knockout/knockout/issues/2281
    const originalValue = '12345\r\n67890'
    const model = { writtenValue: observable(originalValue) }

    testNode.innerHTML = "<textarea data-bind='textInput: writtenValue'></textarea>"
    applyBindings(model, testNode)

    // No user change; verify that model isn't changed (note that the view's value may be different)
    triggerEvent(testNode.children[0], 'blur')
    expect(model.writtenValue()).toEqual(originalValue)

    // A change by the user is written to the model
    ;(testNode.children[0] as HTMLInputElement).value = '1234'
    triggerEvent(testNode.children[0], 'change')
    expect(model.writtenValue()).toEqual('1234')

    // A change from the model; the model isn't updated even if the view's value is different
    model.writtenValue(originalValue)
    triggerEvent(testNode.children[0], 'blur')
    expect(model.writtenValue()).toEqual(originalValue)
  })

  if (typeof DEBUG !== 'undefined' && DEBUG) {
    // The textInput binds to different events depending on the browser.
    // But the DEBUG version allows us to force it to bind to specific events for testing purposes.

    describe('Event processing', function () {
      beforeEach(function () {
        options.debug = true
        this.restoreAfter(bindingHandlers.textInput, '_forceUpdateOn')
        bindingHandlers.textInput._forceUpdateOn = ['afterkeydown']
        jasmine.Clock.useMock()
      })

      afterEach(function () {
        options.debug = false
      })

      it('Should update observable asynchronously', function () {
        let myObservable = observable('123')
        testNode.innerHTML = "<input data-bind='textInput:someProp' />"
        applyBindings({ someProp: myObservable }, testNode)
        triggerEvent(testNode.children[0], 'keydown')
        ;(testNode.children[0] as HTMLInputElement).value = 'some user-entered value'
        expect(myObservable()).toEqual('123') // observable is not changed yet

        jasmine.Clock.tick(20)
        expect(myObservable()).toEqual('some user-entered value') // it's changed after a delay
      })

      it('Should ignore "unchanged" notifications from observable during delayed event processing', function () {
        let myObservable = observable('123')
        testNode.innerHTML = "<input data-bind='textInput:someProp' />"
        applyBindings({ someProp: myObservable }, testNode)
        triggerEvent(testNode.children[0], 'keydown')
        ;(testNode.children[0] as HTMLInputElement).value = 'some user-entered value'

        // Notification of previous value (unchanged) is ignored
        myObservable.valueHasMutated()
        expect((testNode.children[0] as HTMLInputElement).value).toEqual('some user-entered value')

        // Observable is updated to new element value
        jasmine.Clock.tick(20)
        expect(myObservable()).toEqual('some user-entered value')
      })

      it('Should not ignore actual change notifications from observable during delayed event processing', function () {
        let myObservable = observable('123')
        testNode.innerHTML = "<input data-bind='textInput:someProp' />"
        applyBindings({ someProp: myObservable }, testNode)
        triggerEvent(testNode.children[0], 'keydown')
        ;(testNode.children[0] as HTMLInputElement).value = 'some user-entered value'

        // New value is written to input element
        myObservable('some value from the server')
        expect((testNode.children[0] as HTMLInputElement).value).toEqual('some value from the server')

        // New value remains when event is processed
        jasmine.Clock.tick(20)
        expect(myObservable()).toEqual('some value from the server')
      })

      it('Should update model property using earliest available event', function () {
        let model: ModelType = { someProp: '123', writtenValue: undefined }
        testNode.innerHTML = "<input data-bind='textInput:someProp' />"
        applyBindings(model, testNode)

        triggerEvent(testNode.children[0], 'keydown')
        ;(testNode.children[0] as HTMLInputElement).value = 'some user-entered value'
        triggerEvent(testNode.children[0], 'change')
        expect(model.someProp).toEqual('some user-entered value') // it's changed immediately
        expect((testNode.children[0] as any)._ko_textInputProcessedEvent).toEqual('change') // using the change event

        // even after a delay, the keydown event isn't processed
        model.someProp = undefined
        jasmine.Clock.tick(20)
        expect(model.someProp).toBeUndefined()
        expect((testNode.children[0] as any)._ko_textInputProcessedEvent).toEqual('change')
      })
    })
  }
})
