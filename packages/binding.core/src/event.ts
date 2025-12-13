
import {
    objectForEach, registerEventHandler, makeArray,
    throttle as throttleFn, debounce as debounceFn
} from '@tko/utils'

import {
    unwrap
} from '@tko/observable'

import type { AllBindings, BindingContext } from '@tko/bind'

// For certain common events (currently just 'click'), allow a simplified data-binding syntax
// e.g. click:handler instead of the usual full-length event:{click:handler}
export function makeEventHandlerShortcut (eventName) {
  return {
    init: function (element, valueAccessor, allBindings: AllBindings, viewModel, bindingContext: BindingContext) {
      var newValueAccessor = function () {
        var result = {}
        result[eventName] = valueAccessor()
        return result
      }
      eventHandler.init.call(this, element, newValueAccessor, allBindings, viewModel, bindingContext)
    }
  }
}

function makeDescriptor (handlerOrObject) {
  return typeof handlerOrObject === 'function' ? { handler: handlerOrObject } : handlerOrObject || {}
}

export const eventHandler = {
  init: function (element, valueAccessor, allBindings, viewModel, bindingContext: BindingContext) {
    var eventsToHandle = valueAccessor() || {}
    objectForEach(eventsToHandle, function (eventName, descriptor) {
      const {passive, capture, once, debounce, throttle} = makeDescriptor(descriptor)
      const eventOptions = (capture || passive || once) && {capture, passive, once}

      let eventHandlerFn = (event, ...more) => {
        var handlerReturnValue
        const {handler, passive, bubble, preventDefault} = makeDescriptor(valueAccessor()[eventName])

        try {
          // Take all the event args, and prefix with the viewmodel
          if (handler) {
            const possiblyUpdatedViewModel = bindingContext.$data
            const argsForHandler = [possiblyUpdatedViewModel, event, ...more]
            handlerReturnValue = handler.apply(possiblyUpdatedViewModel, argsForHandler)
          }
        } finally {
          // preventDefault in the descriptor takes precedent over the handler return value
          if (preventDefault !== undefined) {
            if (unwrap(preventDefault)) { event.preventDefault() }
          } else if (handlerReturnValue !== true) {
            // Normally we want to prevent default action. Developer can override this by explicitly returning true
            // preventDefault will throw an error if the event is passive.
            if (!passive) { event.preventDefault() }
          }
        }

        const bubbleMark = allBindings.get(eventName + 'Bubble') !== false
        if (bubble === false || !bubbleMark) {
          event.cancelBubble = true
          if (event.stopPropagation) { event.stopPropagation() }
        }
      }

      if (debounce) { eventHandlerFn = debounceFn(eventHandlerFn, debounce) }
      if (throttle) { eventHandlerFn = throttleFn(eventHandlerFn, throttle) }

      registerEventHandler(element, eventName, eventHandlerFn, eventOptions || false)
    })
  }
}

export const onHandler = {
  init: eventHandler.init,
  preprocess: function (value, key, addBinding) {
    addBinding(key.replace('on.', ''), '=>' + value)
  }
}
