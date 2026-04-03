---
title: Attr Binding
---

# `attr`

### Purpose
The `attr` binding provides a generic way to set the value of any attribute for the associated DOM element.  This is useful, for example, when you need to set the `title` attribute of an element, the `src` of an `img` tag, or the `href` of a link based on values in your view model, with the attribute value being updated automatically whenever the corresponding model property changes.

### Example

```tsx
const url = ko.observable('/llms.txt')
const details = ko.observable('TKO agent docs and playground links')

<a ko-attr={{ href: url, title: details }}>LLMs.txt</a>
```

```html
<a data-bind="attr: { href: url, title: details }">
    LLMs.txt
</a>
```

```javascript
var viewModel = {
    url: ko.observable("/llms.txt"),
    details: ko.observable("TKO agent docs and playground links")
};

ko.applyBindings(viewModel);
```

This will set the element's `href` attribute to `/llms.txt` and the element's `title` attribute to `TKO agent docs and playground links`.

In TSX, `ko-attr={...}` takes normal JavaScript expressions. Define any observables you want to bind before the JSX, then use them directly in the binding expression. The playground button adds the standard render/setup wrapper automatically.

### Parameters

 * Main parameter

   You should pass a JavaScript object in which the property names correspond to attribute names, and the values correspond to the attribute values you wish to apply.

   If your parameter references an observable value, the binding will update the attribute whenever the observable value changes. If the parameter doesn't reference an observable value, it will only set the attribute once and will not update it later.

 * Additional parameters

   * None

### Note: Applying attributes whose names aren't legal JavaScript variable names

If you want to apply the attribute `data-something`, you *can't* write this:

```html
<div data-bind="attr: { data-something: someValue }">...</div>
```

... because `data-something` isn't a legal identifier name at that point. The solution is simple: just wrap the identifier name in quotes so that it becomes a string literal, which is legal in a JavaScript object literal. For example,

```html
<div data-bind="attr: { 'data-something': someValue }">...</div>
```
