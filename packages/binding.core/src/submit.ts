
import {
    registerEventHandler
} from '@tko/utils'

import type { BindingContext } from '@tko/bind'

export var submit = {
  init: function (element, valueAccessor, allBindings, viewModel, bindingContext: BindingContext) { // allBindings and viewModel not in use
    if (typeof valueAccessor() !== 'function') { throw new Error('The value for a submit binding must be a function') }
    registerEventHandler(element, 'submit', function (event) {
      var handlerReturnValue
      var value = valueAccessor()
      try { handlerReturnValue = value.call(bindingContext['$data'], element) } finally {
        if (handlerReturnValue !== true) { // Normally we want to prevent default action. Developer can override this be explicitly returning true.
          if (event.preventDefault) { event.preventDefault() } else { event.returnValue = false }
        }
      }
    })
  }
}
