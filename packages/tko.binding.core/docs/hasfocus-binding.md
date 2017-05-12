---
kind: documentation
title: hasFocus
cat: 4
subCat: Working with form fields
---

### Purpose
The `hasFocus` binding links a DOM element's focus state with a viewmodel property. It is a two-way binding, so:

 * If you set the viewmodel property to `true` or `false`, the associated element will become focused or unfocused.
 * If the user manually focuses or unfocuses the associated element, the viewmodel property will be set to `true` or `false` accordingly.

This is useful if you're building sophisticated forms in which editable elements appear dynamically, and you would like to control where the user should start typing, or respond to the location of the caret.

### Example 1: The basics
This example simply displays a message if the textbox currently has focus, and uses a button to show that you can trigger focus programmatically.

<live-example params='id: "hasfocus-binding"'></live-example>


### Example 2: Click-to-edit

Because the `hasFocus` binding works in both directions (setting the associated value focuses or unfocuses the element; focusing or unfocusing the element sets the associated value), it's a convenient way to toggle an "edit" mode. In this example, the UI displays either a `<span>` or an `<input>` element depending on the model's `editing` property. Unfocusing the `<input>` element sets `editing` to `false`, so the UI switches out of "edit" mode.

<live-example params='id: "hasfocus-edit"'></live-example>


### Parameters

 * Main parameter

   Pass `true` (or some value that evaluates as true) to focus the associated element. Otherwise, the associated element will be unfocused.

   When the user manually focuses or unfocuses the element, your value will be set to `true` or `false` accordingly.

   If the value you supply is observable, the `hasFocus` binding will update the element's focus state whenever that observable value changes.

 * Additional parameters

   * None
