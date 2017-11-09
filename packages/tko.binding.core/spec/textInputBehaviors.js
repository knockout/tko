import {
    applyBindings
} from 'tko.bind'

import {
    computed
} from 'tko.computed'

import {
    observable
} from 'tko.observable'

import {
    triggerEvent
} from 'tko.utils'

import { DataBindProvider } from 'tko.provider.databind'

import {
    options
} from 'tko.utils'

import {bindings as coreBindings} from '../src'

import 'tko.utils/helpers/jasmine-13-helper.js'

describe('Binding: TextInput', function () {
  var bindingHandlers
  beforeEach(jasmine.prepareTestNode)

  beforeEach(function () {
    var provider = new DataBindProvider()
    options.bindingProviderInstance = provider
    bindingHandlers = provider.bindingHandlers
    bindingHandlers.set(coreBindings)
  })

  it('Should assign the value to the node', function () {
    testNode.innerHTML = "<input data-bind='textInput:123' />"
    applyBindings(null, testNode)
    expect(testNode.childNodes[0].value).toEqual('123')
  })

  it('Should treat null values as empty strings', function () {
    testNode.innerHTML = "<input data-bind='textInput:myProp' />"
    applyBindings({ myProp: observable(0) }, testNode)
    expect(testNode.childNodes[0].value).toEqual('0')
  })

  it('Should assign an empty string as value if the model value is null', function () {
    testNode.innerHTML = "<input data-bind='textInput:(null)' />"
    applyBindings(null, testNode)
    expect(testNode.childNodes[0].value).toEqual('')
  })

  it('Should assign an empty string as value if the model value is undefined', function () {
    testNode.innerHTML = "<input data-bind='textInput:undefined' />"
    applyBindings(null, testNode)
    expect(testNode.childNodes[0].value).toEqual('')
  })

  it('For observable values, should unwrap the value and update on change', function () {
    var myObservable = observable(123)
    testNode.innerHTML = "<input data-bind='textInput:someProp' />"
    applyBindings({ someProp: myObservable }, testNode)
    expect(testNode.childNodes[0].value).toEqual('123')
    myObservable(456)
    expect(testNode.childNodes[0].value).toEqual('456')
  })

  it('For observable values, should update on change if new value is \'strictly\' different from previous value', function () {
    var myObservable = observable('+123')
    testNode.innerHTML = "<input data-bind='textInput:someProp' />"
    applyBindings({ someProp: myObservable }, testNode)
    expect(testNode.childNodes[0].value).toEqual('+123')
    myObservable(123)
    expect(testNode.childNodes[0].value).toEqual('123')
  })

  it('For writeable observable values, should catch the node\'s onchange and write values back to the observable', function () {
    var myObservable = observable(123)
    testNode.innerHTML = "<input data-bind='textInput:someProp' />"
    applyBindings({ someProp: myObservable }, testNode)
    testNode.childNodes[0].value = 'some user-entered value'
    triggerEvent(testNode.childNodes[0], 'change')
    expect(myObservable()).toEqual('some user-entered value')
  })

  it('For writeable observable values, when model rejects change, update view to match', function () {
    var validValue = observable(123)
    var isValid = observable(true)
    var valueForEditing = computed({
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
    applyBindings({ valueForEditing: valueForEditing}, testNode)

        // set initial valid value
    testNode.childNodes[0].value = '1234'
    triggerEvent(testNode.childNodes[0], 'change')
    expect(validValue()).toEqual('1234')
    expect(isValid()).toEqual(true)
    expect(testNode.childNodes[0].value).toEqual('1234')

        // set to an invalid value
    testNode.childNodes[0].value = '1234a'
    triggerEvent(testNode.childNodes[0], 'change')
    expect(validValue()).toEqual('1234')
    expect(isValid()).toEqual(false)
    expect(testNode.childNodes[0].value).toEqual('1234a')

        // set to a valid value where the current value of the writeable computed is the same as the written value
    testNode.childNodes[0].value = '1234'
    triggerEvent(testNode.childNodes[0], 'change')
    expect(validValue()).toEqual('1234')
    expect(isValid()).toEqual(true)
    expect(testNode.childNodes[0].value).toEqual('1234')
  })

  it('Should ignore node changes when bound to a read-only observable', function () {
    var computedValue = computed(function () { return 'zzz' })
    var vm = { prop: computedValue }

    testNode.innerHTML = "<input data-bind='textInput: prop' />"
    applyBindings(vm, testNode)
    expect(testNode.childNodes[0].value).toEqual('zzz')

        // Change the input value and trigger change event; verify that the view model wasn't changed
    testNode.childNodes[0].value = 'yyy'
    triggerEvent(testNode.childNodes[0], 'change')
    expect(vm.prop).toEqual(computedValue)
    expect(computedValue()).toEqual('zzz')
  })

  it('For non-observable property values, should catch the node\'s onchange and write values back to the property', function () {
    var model = { modelProperty123: 456 }
    testNode.innerHTML = "<input data-bind='textInput: modelProperty123' />"
    applyBindings(model, testNode)
    expect(testNode.childNodes[0].value).toEqual('456')

    testNode.childNodes[0].value = 789
    triggerEvent(testNode.childNodes[0], 'change')
    expect(model.modelProperty123).toEqual('789')
  })

  it('Should support alias "textinput"', function () {
    testNode.innerHTML = "<input data-bind='textinput:123' />"
    applyBindings(null, testNode)
    expect(testNode.childNodes[0].value).toEqual('123')
  })

  it('Should write to non-observable property values using "textinput" alias', function () {
    var model = { modelProperty123: 456 }
    testNode.innerHTML = "<input data-bind='textinput: modelProperty123' />"
    applyBindings(model, testNode)
    expect(testNode.childNodes[0].value).toEqual('456')

    testNode.childNodes[0].value = 789
    triggerEvent(testNode.childNodes[0], 'change')
    expect(model.modelProperty123).toEqual('789')
  })

  it('Should be able to read and write to a property of an object returned by a function', function () {
    var mySetter = { set: 666 }
    var model = {
      getSetter: function () {
        return mySetter
      }
    }
    testNode.innerHTML =
            "<input data-bind='textInput: getSetter().set' />" +
            "<input data-bind='textInput: getSetter()[\"set\"]' />" +
            "<input data-bind=\"textInput: getSetter()['set']\" />"
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
    var originalSubproperty = observable('original value')
    var newSubproperty = observable()
    var model = { myprop: observable({ subproperty: originalSubproperty }) }

        // Set up a text box whose value is linked to the subproperty of the observable's current value
    testNode.innerHTML = "<input data-bind='textInput: myprop().subproperty' />"
    applyBindings(model, testNode)
    expect(testNode.childNodes[0].value).toEqual('original value')

    model.myprop({ subproperty: newSubproperty }) // Note that myprop (and hence its subproperty) is changed *after* the bindings are applied
    testNode.childNodes[0].value = 'Some new value'
    triggerEvent(testNode.childNodes[0], 'change')

        // Verify that the change was written to the *new* subproperty, not the one referenced when the bindings were first established
    expect(newSubproperty()).toEqual('Some new value')
    expect(originalSubproperty()).toEqual('original value')
  })

  it('Should update observable on input event (on supported browsers) or propertychange event (on old IE)', function () {
    var myObservable = observable(123)
    testNode.innerHTML = "<input data-bind='textInput: someProp' />"
    applyBindings({ someProp: myObservable }, testNode)
    expect(testNode.childNodes[0].value).toEqual('123')

    testNode.childNodes[0].value = 'some user-entered value'   // setting the value triggers the propertychange event on IE
    if (!jasmine.ieVersion || jasmine.ieVersion >= 9) {
      triggerEvent(testNode.childNodes[0], 'input')
    }
    if (jasmine.ieVersion === 9) {
            // IE 9 responds to the event asynchronously (see #1788)
      waitsFor(function () {
        return myObservable() === 'some user-entered value'
      }, 50)
    } else {
      expect(myObservable()).toEqual('some user-entered value')
    }
  })

  it('Should write only changed values to observable', function () {
    var model = { writtenValue: '' }

    testNode.innerHTML = "<input data-bind='textInput: writtenValue' />"
    applyBindings(model, testNode)

    testNode.childNodes[0].value = '1234'
    triggerEvent(testNode.childNodes[0], 'change')
    expect(model.writtenValue).toEqual('1234')

        // trigger change event with the same value
    model.writtenValue = undefined
    triggerEvent(testNode.childNodes[0], 'change')
    expect(model.writtenValue).toBeUndefined()
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
        var myObservable = observable('123')
        testNode.innerHTML = "<input data-bind='textInput:someProp' />"
        applyBindings({ someProp: myObservable }, testNode)
        triggerEvent(testNode.childNodes[0], 'keydown')
        testNode.childNodes[0].value = 'some user-entered value'
        expect(myObservable()).toEqual('123')  // observable is not changed yet

        jasmine.Clock.tick(20)
        expect(myObservable()).toEqual('some user-entered value')  // it's changed after a delay
      })

      it('Should ignore "unchanged" notifications from observable during delayed event processing', function () {
        var myObservable = observable('123')
        testNode.innerHTML = "<input data-bind='textInput:someProp' />"
        applyBindings({ someProp: myObservable }, testNode)
        triggerEvent(testNode.childNodes[0], 'keydown')
        testNode.childNodes[0].value = 'some user-entered value'

                // Notification of previous value (unchanged) is ignored
        myObservable.valueHasMutated()
        expect(testNode.childNodes[0].value).toEqual('some user-entered value')

                // Observable is updated to new element value
        jasmine.Clock.tick(20)
        expect(myObservable()).toEqual('some user-entered value')
      })

      it('Should not ignore actual change notifications from observable during delayed event processing', function () {
        var myObservable = observable('123')
        testNode.innerHTML = "<input data-bind='textInput:someProp' />"
        applyBindings({ someProp: myObservable }, testNode)
        triggerEvent(testNode.childNodes[0], 'keydown')
        testNode.childNodes[0].value = 'some user-entered value'

                // New value is written to input element
        myObservable('some value from the server')
        expect(testNode.childNodes[0].value).toEqual('some value from the server')

                // New value remains when event is processed
        jasmine.Clock.tick(20)
        expect(myObservable()).toEqual('some value from the server')
      })

      it('Should update model property using earliest available event', function () {
        var model = { someProp: '123' }
        testNode.innerHTML = "<input data-bind='textInput:someProp' />"
        applyBindings(model, testNode)

        triggerEvent(testNode.childNodes[0], 'keydown')
        testNode.childNodes[0].value = 'some user-entered value'
        triggerEvent(testNode.childNodes[0], 'change')
        expect(model.someProp).toEqual('some user-entered value')  // it's changed immediately
        expect(testNode.childNodes[0]._ko_textInputProcessedEvent).toEqual('change')   // using the change event

                // even after a delay, the keydown event isn't processed
        model.someProp = undefined
        jasmine.Clock.tick(20)
        expect(model.someProp).toBeUndefined()
        expect(testNode.childNodes[0]._ko_textInputProcessedEvent).toEqual('change')
      })
    })
  }
})
