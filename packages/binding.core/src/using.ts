import {
  applyBindingsToDescendants
} from '@tko/bind'

import type { BindingContext, AllBindings } from '@tko/bind'

export const using = {
  init: function (element, valueAccessor, _allBindings: AllBindings, _viewModel, bindingContext: BindingContext) {
    const innerContext = bindingContext.createChildContext(valueAccessor)
    applyBindingsToDescendants(innerContext, element)
    return { controlsDescendantBindings: true }
  },
  allowVirtualElements: true
}
