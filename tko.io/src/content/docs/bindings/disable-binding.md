---
title: Disable Binding
---

# `disable`

### Purpose
The `disable` binding causes the associated DOM element to be disabled only when the parameter value is `true`. This is useful with form elements like `input`, `select`, and `textarea`.

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

This is the mirror image of the `enable` binding. For more information, see [documentation for the `enable` binding](../enable-binding/), because `disable` works in exactly the same way except that it negates whatever parameter you pass to it.
