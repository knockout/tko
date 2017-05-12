---
kind: documentation
title: enable
cat: 4
subCat: Working with form fields
---

### Purpose
The `enable` binding causes the associated DOM element to be enabled only when the parameter value is `true`. This is useful with form elements like `input`, `select`, and `textarea`.

### Example

<live-example params='id: "enable-binding"'></live-example>

In this example, the "Your cellphone number" text box will initially be disabled. It will be enabled only when the user checks the box labelled "I have a cellphone".

### Parameters

 * Main parameter

   A value that controls whether or not the associated DOM element should be enabled.

   Non-boolean values are interpreted loosely as boolean. For example, `0` and `null` are treated as `false`, whereas `21` and non-`null` objects are treated as `true`.

   If your parameter references an observable value, the binding will update the enabled/disabled state whenever the observable value changes. If the parameter doesn't reference an observable value, it will only set the state once and will not do so again later.

 * Additional parameters

   * None

### Note: Using arbitrary JavaScript expressions

You're not limited to referencing variables - you can reference arbitrary expressions to control an element's enabledness. For example,

```html
<button data-bind="enable: parseAreaCode(viewModel.cellphoneNumber()) != '555'">
    Do something
</button>
```

### Dependencies

None, other than the core Knockout library.
