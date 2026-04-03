---
title: Ifnot Binding
---


# `ifnot`

Alias: `unless`

### Purpose
The `ifnot` binding is exactly the same as [the `if` binding](../if-binding/), except that it inverts the result of whatever expression you pass to it. For more details, see documentation for [the `if` binding](../if-binding/).

### Note: "ifnot" is the same as a negated "if"

The following markup:

```tsx
const someProperty = ko.observable(true)

<div ko-ifnot={someProperty}>...</div>
```

```html
<div data-bind="ifnot: someProperty">...</div>
```

... is equivalent to the following:

```tsx
const someProperty = ko.observable(true)
const shouldDisplay = ko.pureComputed(() => !someProperty())

<div ko-if={shouldDisplay}>...</div>
```

```html
<div data-bind="if: !someProperty()">...</div>
```

In TSX, the negated `ko-if` form needs a computed (or another reactive source). Writing `ko-if={!someProperty()}` only evaluates the observable once while building the JSX expression, so it will not update when `someProperty` changes.

The only reason to use `ifnot` instead of a negated `if` is just as a matter of taste: many developers feel that it looks tidier.
