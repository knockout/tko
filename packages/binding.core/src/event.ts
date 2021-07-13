
import {
    objectForEach, registerEventHandler, makeArray,
    throttle as throttleFn, debounce as debounceFn
} from '@tko/utils'

import {
    unwrap
} from '@tko/observable'

// For certain common events (currently just 'click'), allow a simplified data-binding syntax
// e.g. click:handler instead of the usual full-length event:{click:handler}
export function makeEventHandlerShortcut (eventName) {
  return {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
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
  init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
    var eventsToHandle = valueAccessor() || {}
    objectForEach(eventsToHandle, function (eventName, descriptor) {
      const {passive, capture, once, preventDefault, stopPropagation, debounce, throttle} = makeDescriptor(descriptor)
      const eventOptions = (capture || passive || once) && {capture, passive, once}

      let eventHandlerFn = (event, ...more) => {
        var handlerReturnValue
        const {handler, passive, bubble} = makeDescriptor(valueAccessor()[eventName])

        try {
          // Take all the event args, and prefix with the viewmodel
          if (handler) {
            const possiblyUpdatedViewModel = bindingContext.$data
            const argsForHandler = [possiblyUpdatedViewModel, event, ...more]
            handlerReturnValue = handler.apply(possiblyUpdatedViewModel, argsForHandler)
          }
        } finally {
          if (preventDefault !== undefined) {
            if (unwrap(preventDefault)) { event.preventDefault() }
          // backwards compat: use return value if preventDefault was not specified
          } else if (handlerReturnValue !== true) {
            // Normally we want to prevent default action. Developer can override this be explicitly returning true.
            // preventDefault will throw an error if the event is passive.
            if (event.preventDefault) {
              if (!passive) { event.preventDefault() }
            } else {
              event.returnValue = false
            }
          }
        }

        if (stopPropagation !== undefined) {
          if (unwrap(stopPropagation)) { event.stopPropagation() }
        // backwards compat: look for eventNameBubble binding
        } else {
          const bubbleMark = allBindings.get(eventName + 'Bubble') !== false
          if (bubble === false || !bubbleMark) {
            event.cancelBubble = true
            if (event.stopPropagation) { event.stopPropagation() }
          }
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
