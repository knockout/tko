---
title: Custom Bindings
---


# Creating Custom Bindings

You're not limited to the built-in bindings like `click`, `value`, and so on. Custom bindings let you connect observables to DOM behavior when the built-in bindings are not enough.

Keep the binding focused on DOM work. Put state in observables and computeds, and let the binding translate that state into element updates.

### A minimal binding

For example, a binding can toggle a DOM style without any external library:

```javascript
ko.bindingHandlers.dimWhen = {
    update(element, valueAccessor) {
        element.style.opacity = ko.unwrap(valueAccessor()) ? '0.5' : '1'
    }
}
```

Then use it in markup:

```html
<div data-bind="dimWhen: isBusy">Saving...</div>
```

### Registering your binding

To register a binding, add it as a subproperty of `ko.bindingHandlers`:

```javascript
ko.bindingHandlers.yourBindingName = {
    init(element, valueAccessor, allBindings, viewModel, bindingContext) {
        // Set up DOM state, event handlers, or disposal hooks here.
    },
    update(element, valueAccessor, allBindings, viewModel, bindingContext) {
        // Read the current value with ko.unwrap(valueAccessor()) and update
        // the DOM element accordingly.
    }
}
```

... and then you can use it on any number of DOM elements:

```html
<div data-bind="yourBindingName: someValue"> </div>
```

You do not have to provide both `init` and `update`. Use `init` when you need one-time setup or event listeners. Use `update` when the DOM should respond to changing values.

### The "update" callback

Whenever the associated observable changes, KO calls your `update` callback with:

* `element` - the DOM element involved in this binding
* `valueAccessor` - a function that returns the bound value. Call `ko.unwrap(valueAccessor())` to accept both observables and plain values.
* `allBindings` - access to the other bindings on the same element
* `viewModel` - the current view model value for the element; prefer `bindingContext.$data` or `bindingContext.$rawData` when you need the current item explicitly
* `bindingContext` - the current [binding context](/binding-context/)

For example, you might want a binding that fades an element in and out according to an observable:

```javascript
ko.bindingHandlers.fadeVisible = {
    update(element, valueAccessor, allBindings) {
        const visible = !!ko.unwrap(valueAccessor())
        const duration = allBindings.get('fadeDuration') || 400

        element.style.transition = `opacity ${duration}ms ease`
        element.style.opacity = visible ? '1' : '0'
        element.style.pointerEvents = visible ? '' : 'none'
    }
}
```

Now you can use this binding as follows:

```html
<div data-bind="fadeVisible: giftWrap, fadeDuration: 600">You have selected the option</div>
<label><input type="checkbox" data-bind="checked: giftWrap" /> Gift wrap</label>
```

```javascript
const viewModel = {
    giftWrap: ko.observable(true)
}
ko.applyBindings(viewModel)
```

### The "init" callback

Knockout will call your `init` function once for each DOM element that you use the binding on. There are two main uses for `init`:

* To set any initial state for the DOM element
* To register event handlers so that, for example, when the user clicks on or modifies the DOM element, you can change the associated observable

KO passes the same parameters that it passes to [the `update` callback](#the-update-callback).

Continuing the previous example, you might want `fadeVisible` to set the element state immediately when the page first appears, so the transition only runs when the observable changes:

```javascript
ko.bindingHandlers.fadeVisible = {
    init(element, valueAccessor) {
        element.hidden = !ko.unwrap(valueAccessor())
    },
    update(element, valueAccessor, allBindings) {
        // Leave as before
    }
}
```

If `giftWrap` starts as `false`, the element is hidden until the user checks the box.

### Modifying observables after DOM events

You've already seen how to use `update` so that observable changes update the DOM. But what about the other direction? When the user performs an action on a DOM element, you might want to update an observable.

You can use the `init` callback as a place to register an event handler that will cause changes to the associated observable. For example,

```javascript
ko.bindingHandlers.trackFocus = {
    init(element, valueAccessor) {
        element.addEventListener('focus', () => valueAccessor()(true))
        element.addEventListener('blur', () => valueAccessor()(false))
    },
    update(element, valueAccessor) {
        if (ko.unwrap(valueAccessor())) {
            element.focus();
        } else {
            element.blur();
        }
    }
}
```

Now you can both read and write the "focusedness" of an element by binding it to an observable:

```html
<p>Name: <input data-bind="trackFocus: editingName" /></p>

<!-- Showing that we can both read and write the focus state -->
<div data-bind="visible: editingName">You're editing the name</div>
<button data-bind="enable: !editingName(), click: function () { editingName(true) }">Edit name</button>
```

```javascript
const viewModel = {
    editingName: ko.observable()
}
ko.applyBindings(viewModel)
```

### Note: Supporting virtual elements

If you want a custom binding to work with Knockout's *virtual elements* syntax, e.g.:

```html
<!-- ko mybinding: somedata --> ... <!-- /ko -->
```

... then see [Custom Bindings For Virtual Elements](./custom-bindings-for-virtual-elements/).
