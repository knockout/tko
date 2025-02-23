
import {
    applyBindingsToDescendants
} from '@tko/bind'

import type { BindingContext } from '@tko/bind'

export default {
  init: function (element, valueAccessor, allBindings, viewModel, bindingContext: BindingContext) { // allBindings and viewModel not used!
        // Make a modified binding context, with extra properties, and apply it to descendant elements
    var innerContext = bindingContext['extend'](valueAccessor)
    applyBindingsToDescendants(innerContext, element)

    return { 'controlsDescendantBindings': true }
  },
  allowVirtualElements: true
}
