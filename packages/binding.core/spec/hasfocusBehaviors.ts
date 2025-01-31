import {
    triggerEvent, registerEventHandler, ieVersion
} from '@tko/utils'

import {
    applyBindings
} from '@tko/bind'

import {
    observable
} from '@tko/observable'

import {
    DataBindProvider
} from '@tko/provider.databind'

import {
    options, arrayForEach
} from '@tko/utils'

import * as coreBindings from '../dist'

import '@tko/utils/helpers/jasmine-13-helper'


arrayForEach(['hasfocus', 'hasFocus'], binding => {
  describe(`Binding: ${binding}`, function () {
    var bindingHandlers

    beforeEach(jasmine.prepareTestNode)

    beforeEach(function () {
      var provider = new DataBindProvider()
      options.bindingProviderInstance = provider
      bindingHandlers = provider.bindingHandlers
      bindingHandlers.set(coreBindings.bindings)
    })

    if (ieVersion) {
      // Workaround for spurious focus-timing-related failures on IE8
      // (issue knockout/knockout#736)
      beforeEach(function () { waits(100) })
    }

    it('Should respond to changes on an observable value by blurring or focusing the element', function () {
      var currentState
      var model = { myVal: observable() }
      testNode.innerHTML = `<input data-bind='${binding}: myVal' /><input />`
      applyBindings(model, testNode)
      registerEventHandler(testNode.childNodes[0] as HTMLInputElement, 'focusin', function () { currentState = true })
      registerEventHandler(testNode.childNodes[0] as HTMLInputElement, 'focusout', function () { currentState = false })

          // When the value becomes true, we focus
      model.myVal(true)
      expect(currentState).toEqual(true)

          // When the value becomes false, we blur
      model.myVal(false)
      expect(currentState).toEqual(false)
    })

    it('Should set an observable value to be true on focus and false on blur', function () {
      var model = { myVal: observable() }
      testNode.innerHTML = `<input data-bind='${binding}: myVal' /><input />`
      applyBindings(model, testNode);

          // Need to raise "focusin" and "focusout" manually, because simply calling ".focus()" and ".blur()"
          // in IE doesn't reliably trigger the "focus" and "blur" events synchronously

      (testNode.children[0] as HTMLInputElement).focus()
      triggerEvent(testNode.children[0], 'focusin')
      expect(model.myVal()).toEqual(true);

          // Move the focus elsewhere
      (testNode.childNodes[1] as HTMLElement).focus()
      triggerEvent(testNode.children[0], 'focusout')
      expect(model.myVal()).toEqual(false)

          // If the model value becomes true after a blur, we re-focus the element
          // (Represents issue #672, where this wasn't working)
      var didFocusExpectedElement = false
      registerEventHandler(testNode.childNodes[0] as HTMLInputElement, 'focusin', function () { didFocusExpectedElement = true })
      model.myVal(true)
      expect(didFocusExpectedElement).toEqual(true)
    })

    it('Should set a non-observable value to be true on focus and false on blur', function () {
      var model = { myVal: null }
      testNode.innerHTML = `<input data-bind='${binding}: myVal' /><input />`
      applyBindings(model, testNode);

      (testNode.childNodes[0] as HTMLElement).focus()
      triggerEvent(testNode.children[0], 'focusin')
      expect(model.myVal).toEqual(true);

          // Move the focus elsewhere
      (testNode.childNodes[1] as HTMLElement).focus()
      triggerEvent(testNode.children[0], 'focusout')
      expect(model.myVal).toEqual(false)
    })

    it('Modern browser: non-observable and Observerble value to be true on focus and false on blur', function () {
      var model = { myVal: null,  myVal2: observable(true)  }
      testNode.innerHTML = `<input data-bind='${binding}: myVal' /><input data-bind='${binding}: myVal2' />`
      applyBindings(model, testNode);

      const input0 = testNode.children[0] as HTMLInputElement;
      const input1 = testNode.children[1] as HTMLInputElement;

      expect(model.myVal2()).toEqual(true);
      input0.focus();
      //triggerEvent(testNode.children[0], 'focusin')
      expect(model.myVal).toEqual(true);
      expect(model.myVal2()).toEqual(false);

      input0.blur();
      expect(model.myVal).toEqual(false);
      expect(model.myVal2()).toEqual(false);

      // Move the focus elsewhere
      input1.focus();
      //triggerEvent(testNode.children[0], 'focusout')
      expect(model.myVal).toEqual(false)
      expect(model.myVal2()).toEqual(true);

      input1.blur();
      expect(model.myVal).toEqual(false);
      expect(model.myVal2()).toEqual(false);
    })


    it('Should not unnecessarily focus or blur an element that is already focused/blurred', function () {
          // This is the closest we can get to representing issue #698 as a spec
      var model = { isFocused: observable({}) }
      testNode.innerHTML = `<input data-bind='${binding}: isFocused' />`
      applyBindings(model, testNode)

          // The elem is already focused, so changing the model value to a different truthy value
          // shouldn't cause any additional focus events
      var didFocusAgain = false
      registerEventHandler(testNode.childNodes[0] as HTMLInputElement, 'focusin', function () { didFocusAgain = true })
      model.isFocused.valueHasMutated()
      expect(didFocusAgain).toEqual(false)

          // Similarly, when the elem is already blurred, changing the model value to a different
          // falsy value shouldn't cause any additional blur events
      model.isFocused(false)
      var didBlurAgain = false
      registerEventHandler(testNode.childNodes[0] as HTMLInputElement, 'focusout', function () { didBlurAgain = true })
      model.isFocused(null)
      expect(didBlurAgain).toEqual(false)
    })

    it('Should not cause unrelated items to lose focus when initialized with false', function () {
          // See #1893
      testNode.innerHTML = `<input data-bind="${binding}: true" value="This should be focused initially" /><input data-bind="${binding}: false" value="This should not be focused" />`
      applyBindings({}, testNode)

          // Can only test for focus in browsers that support it
      if ('activeElement' in document) {
        expect(document.activeElement).toBe(testNode.childNodes[0])
      }
    })
  })
})
