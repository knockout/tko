---
title: Disable Binding
---

# `disable`

### Purpose
The `disable` binding causes the associated DOM element to be disabled when the parameter value is `true`. This is useful with form elements like `input`, `select`, `textarea`, and `button`.

This is the mirror image of the [`enable` binding](../enable-binding/). `disable` uses the same reactive contract, but inverts the result.

### Example

```tsx
const hasNoCellphone = ko.observable(false)
const cellphoneNumber = ko.observable('')

<>
  <p><input type="checkbox" ko-checked={hasNoCellphone} /> I don't have a cellphone</p>
  <p>Your cellphone number: <input type="text" ko-value={cellphoneNumber} ko-disable={hasNoCellphone} /></p>
</>
```

```html
<p>
    <input type="checkbox" data-bind="checked: hasNoCellphone" />
    I don't have a cellphone
</p>
<p>
    Your cellphone number:
    <input type="text" data-bind="value: cellphoneNumber, disable: hasNoCellphone" />
</p>
```

```javascript
var viewModel = {
    hasNoCellphone: ko.observable(false),
    cellphoneNumber: ""
};

ko.applyBindings(viewModel);
```

In this example, the "Your cellphone number" text box starts out enabled. It becomes disabled when the user checks the box labelled "I don't have a cellphone".

For more information, see [the `enable` binding](../enable-binding/), because `disable` works in exactly the same way except that it negates whatever parameter you pass to it.

### Parameters

 * Main parameter

   A value that controls whether or not the associated DOM element should be disabled.

   Non-boolean values are interpreted loosely as boolean. For example, `0` and `null` are treated as `false`, whereas `21` and non-`null` objects are treated as `true`.

   If your parameter references an observable value, the binding will update the enabled/disabled state whenever the observable value changes. If the parameter doesn't reference an observable value, it will only set the state once and will not do so again later.

 * Additional parameters

   * None

### Note: Using arbitrary JavaScript expressions

You're not limited to referencing variables - you can reference arbitrary expressions to control whether an element is disabled. For example,

```html
<button data-bind="disable: total() <= 0">
    Checkout
</button>
```

### Dependencies

None, other than the core Knockout library.
