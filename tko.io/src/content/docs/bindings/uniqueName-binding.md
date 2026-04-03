---
title: UniqueName Binding
---


# `uniqueName`

### Purpose
The `uniqueName` binding ensures that the associated DOM element has a nonempty `name` attribute. If the DOM element did not have a `name` attribute, this binding gives it one and sets it to a unique string value.

You won't need to use this often. It's only useful when some other part of your app expects named form controls and you do not want to manage the `name` attribute yourself.

### Example

```html
<input data-bind="value: someModelProperty, uniqueName: true" />
```

### Parameters

 * Main parameter

   Pass `true` (or some value that evaluates as true) to enable the `uniqueName` binding, as in the preceding example.

 * Additional parameters

   * None

### Dependencies

None, other than the core Knockout library.
