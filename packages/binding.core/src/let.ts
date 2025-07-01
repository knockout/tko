
import {
    applyBindingsToDescendants
} from '@tko/bind'

import type { BindingContext } from '@tko/bind'

export default {
  init: function (element, valueAccessor, _allBindings, _viewModel, bindingContext: BindingContext) {
        // Make a modified binding context, with extra properties, and apply it to descendant elements
    var innerContext = bindingContext['extend'](valueAccessor)
    applyBindingsToDescendants(innerContext, element)

    return { 'controlsDescendantBindings': true }
  },
  allowVirtualElements: true
}
