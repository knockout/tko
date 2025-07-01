import {
  applyBindingsToDescendants
} from '@tko/bind'

import type { BindingContext, AllBindings } from '@tko/bind'

export var using = {
  init: function (element, valueAccessor, _allBindings: AllBindings, _viewModel, bindingContext: BindingContext) {
    var innerContext = bindingContext.createChildContext(valueAccessor)
    applyBindingsToDescendants(innerContext, element)
    return { controlsDescendantBindings: true }
  },
  allowVirtualElements: true
}
