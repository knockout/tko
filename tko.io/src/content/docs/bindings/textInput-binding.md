---
title: TextInput Binding
---


# `textInput`


### Purpose
The `textInput` binding links a text box (`<input>`) or text area (`<textarea>`) with a viewmodel property, providing two-way updates between the viewmodel property and the element's value. Unlike the `value` binding, `textInput` updates the model immediately as the user types or pastes.

### Example

```tsx
const userName = ko.observable('')
const userPassword = ko.observable('abc')
const stateJson = ko.computed(() => ko.toJSON({ userName, userPassword }, null, 2))

<div>
  <p>Login name: <input ko-textInput={userName} /></p>
  <p>Password: <input type="password" ko-textInput={userPassword} /></p>
  <pre ko-text={stateJson}></pre>
</div>
```

```html
<p>Login name: <input data-bind="textInput: userName" /></p>
<p>Password: <input type="password" data-bind="textInput: userPassword" /></p>

<pre data-bind="text: ko.toJSON($root, null, 2)"></pre>
```

```javascript
ko.applyBindings({
    userName: ko.observable(""),
    userPassword: ko.observable("abc")
});
```

In TSX, `ko-textInput={...}` keeps the same two-way behavior, with the observables declared up front and a computed JSON preview derived from the current values.

### Parameters

  * Main Parameter

    KO sets the element's value property to your parameter value. Any previous value will be overwritten.

    If this parameter is an observable value, the binding will update the element's value whenever the observable value changes. If the parameter isn't observable, it will only set the element's value once and will not update it again later.

    If you supply something other than a number or a string (e.g., you pass an object or an array), the displayed text will be equivalent to `yourParameter.toString()` (that's usually not very useful, so it's best to supply string or numeric values).

    Whenever the user edits the value in the associated form control, KO will update the property on your view model. KO will always attempt to update your view model when the value has been modified by the user or any DOM events.

  * Additional parameters

     * None


### Note 1: `textInput` vs `value` binding

Although the [`value` binding](../value-binding/) can also perform two-way binding between text boxes and viewmodel properties, you should prefer `textInput` whenever you want immediate live updates. The main differences are:

  * **Immediate updates**

    `value`, by default, only updates your model when the user moves focus out of the text box. `textInput` updates your model immediately on each keystroke or other text entry mechanism, including paste, drag-and-drop, and autocomplete.

Don't try to use the `value` and `textInput` bindings together on the same element, as that won't achieve anything useful.
