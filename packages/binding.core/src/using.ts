import {
  applyBindingsToDescendants
} from '@tko/bind'

export var using = {
  init: function (element, valueAccessor, allBindings: AllBindings, viewModel, bindingContext: BindingContext) { // allBindings and viewModel aren't actually used here
    var innerContext = bindingContext.createChildContext(valueAccessor)
    applyBindingsToDescendants(innerContext, element)
    return { controlsDescendantBindings: true }
  },
  allowVirtualElements: true
}
