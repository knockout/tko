---
title: Custom Bindings Disposal
---

# Custom Disposal Logic

In a typical Knockout application, DOM elements are dynamically added and removed, for example using the [`template`](../template-binding/) binding or via control-flow bindings ([`if`](../if-binding/), [`ifnot`](../ifnot-binding/), [`with`](../with-binding/), and [`foreach`](../foreach-binding/)). When creating a custom binding, it is often desirable to add clean-up logic that runs when an element associated with your custom binding is removed by Knockout.

### Registering a callback on the disposal of an element

To register a function to run when a node is removed, you can call `ko.utils.domNodeDisposal.addDisposeCallback(node, callback)`. As an example, suppose you create a custom binding to instantiate a widget. When the element with the binding is removed, you may want to call the `destroy` method of the widget:

```javascript
ko.bindingHandlers.myWidget = {
    init: function(element, valueAccessor) {
        var options = ko.unwrap(valueAccessor()),
            widget = createWidget(element, options);

        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            // This will be called when the element is removed by Knockout or
            // if some other part of your code calls ko.removeNode(element)
            widget.destroy();
        });
    }
};
```

### Overriding the clean-up of external data

When removing an element, Knockout runs logic to clean up any data associated with the element. In advanced scenarios, you may want to prevent or customize how external data is removed in your application. Knockout exposes a function, `ko.utils.domNodeDisposal.cleanExternalData(node)`, that can be overridden to support custom logic. For example, you can replace the standard `cleanExternalData` implementation with one that delegates to your own cleanup code:

```javascript
ko.utils.domNodeDisposal.cleanExternalData = function () {
    // Do nothing. Use this only if your application manages external data
    // cleanup some other way.
};
```
