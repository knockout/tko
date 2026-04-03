---
title: Hasfocus Binding
---

# `hasFocus`

### Purpose
The `hasFocus` binding links a DOM element's focus state with a viewmodel property. It is a two-way binding, so:

 * If you set the viewmodel property to `true` or `false`, the associated element will become focused or unfocused.
 * If the user manually focuses or unfocuses the associated element, the viewmodel property will be set to `true` or `false` accordingly.

This is useful if you're building sophisticated forms in which editable elements appear dynamically, and you would like to control where the user should start typing, or respond to the location of the caret.

### Example 1: The basics
This example simply displays a message if the textbox currently has focus, and uses a button to show that you can trigger focus programmatically.

```tsx
const isSelected = ko.observable(false)

<>
  <input ko-hasFocus={isSelected} />
  <button ko-click={() => isSelected(true)}>Focus programmatically</button>
  <span ko-visible={isSelected}>The textbox has focus</span>
</>
```

```html
<input data-bind="hasFocus: isSelected" />
<button data-bind="click: setIsSelected">Focus programmatically</button>
<span data-bind="visible: isSelected">The textbox has focus</span>
```

```javascript
var viewModel = {
    isSelected: ko.observable(false),
    setIsSelected: function() { this.isSelected(true); }
};

ko.applyBindings(viewModel);
```


### Example 2: Click-to-edit

Because the `hasFocus` binding works in both directions (setting the associated value focuses or unfocuses the element; focusing or unfocusing the element sets the associated value), it's a convenient way to toggle an "edit" mode. In this example, the UI displays either a `<span>` or an `<input>` element depending on the model's `editing` property. Unfocusing the `<input>` element sets `editing` to `false`, so the UI switches out of "edit" mode.

```tsx
const name = ko.observable('Bert Bertington')
const editing = ko.observable(false)
const viewing = ko.pureComputed(() => !editing())

<>
  <p>
    Name: <b ko-visible={viewing} ko-click={() => editing(true)}><span ko-text={name}></span></b>
    <input ko-visible={editing} ko-value={name} ko-hasFocus={editing} />
  </p>
  <p><em>Click the name to edit it; click elsewhere to apply changes.</em></p>
</>
```

```html
<p>
    Name:
    <b data-bind="visible: !editing(), text: name, click: edit">&nbsp;</b>
    <input data-bind="visible: editing, value: name, hasFocus: editing" />
</p>
<p><em>Click the name to edit it; click elsewhere to apply changes.</em></p>
```

```javascript
function PersonViewModel(name) {
    this.name = ko.observable(name);
    this.editing = ko.observable(false);

    this.edit = function() { this.editing(true); };
}

ko.applyBindings(new PersonViewModel("Bert Bertington"));
```

In TSX, `ko-hasFocus={...}` works alongside `ko-visible`, `ko-value`, and `ko-click`, with the observables declared up front and the playground adding the standard render/setup wrapper automatically.


### Parameters

 * Main parameter

   Pass `true` (or some value that evaluates as true) to focus the associated element. Otherwise, the associated element will be unfocused.

   When the user manually focuses or unfocuses the element, your value will be set to `true` or `false` accordingly.

   If the value you supply is observable, the `hasFocus` binding will update the element's focus state whenever that observable value changes.

 * Additional parameters

   * None
