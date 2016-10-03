import {
  applyBindingsToDescendants
} from 'tko.bind';


export var using = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var innerContext = bindingContext.createChildContext(valueAccessor);
        applyBindingsToDescendants(innerContext, element);
        return { controlsDescendantBindings: true };
    },
    allowVirtualElements: true
};
