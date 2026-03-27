---
title: Template Binding
---


# `template` Binding

### Purpose
The `template` binding populates the associated DOM element with the results of rendering a template. Templates are a simple and convenient way to build sophisticated UI structures - possibly with repeating or nested blocks - as a function of your view model data.

There are two main ways of using templates:

 * *Native templating* is the mechanism that underpins `foreach`, `if`, `with`, and other control flow bindings. Internally, those control
   flow bindings capture the HTML markup contained in your element, and use it as a template to render against an arbitrary data item.
   This feature is built into Knockout and doesn't require any external library.
 * *String-based templating* is a legacy integration path for third-party template engines. New code should prefer native DOM-based
   templating and the built-in control-flow bindings.

### Parameters

 * Main parameter

   * Shorthand syntax: If you just supply a string value, KO will interpret this as the ID of a template to render. The data it supplies to the template will be your current model object.

   * For more control, pass a JavaScript object with some combination of the following properties:

     * `name` --- the ID of an element that contains the template you wish to render - see [Note 5](#note_5_dynamically_choosing_which_template_is_used) for how to vary this programmatically.
     * `data` --- an object to supply as the data for the template to render. If you omit this parameter, KO will look for a `foreach` parameter, or will fall back on using your current model object.
     * `if` --- if this parameter is provided, the template will only be rendered if the specified expression evaluates to `true` (or a `true`-ish value). This can be useful for preventing a null observable from being bound against a template before it is populated.
     * `foreach` --- instructs KO to render the template in "foreach" mode - see [Note 2](#note_2_using_the_foreach_option_with_a_named_template) for details.
     * `as` --- when used in conjunction with `foreach`, defines an alias for each item being rendered - see [Note 3](#note_3_using_as_to_give_an_alias_to_foreach_items) for details.
     * `afterRender`, `afterAdd`, or `beforeRemove` --- callback functions to be invoked against the rendered DOM elements - see [Note 4](#note_4_using_afterrender_afteradd_and_beforeremove)

### Note 1: Rendering a named template

Normally, when you're using control flow bindings (`foreach`, `with`, `if`, etc.), there's no need to give names to your templates: they are defined implicitly
and anonymously by the markup inside your DOM element. But if you want to, you can factor out templates into a separate element and then reference them by name:

```example
html: |-
  <h2>Participants</h2>
  Here are the participants:
  <div data-bind="template: { name: 'person-template', data: buyer }"></div>
  <div data-bind="template: { name: 'person-template', data: seller }"></div>

  <template id='person-template'>
      <h3 data-bind="text: name"></h3>
      <p>Credits: <span data-bind="text: credits"></span></p>
  </template>

javascript: |-
     function MyViewModel() {
         this.buyer = { name: 'Franklin', credits: 250 };
         this.seller = { name: 'Mario', credits: 5800 };
     }
     ko.applyBindings(new MyViewModel());
```

In this example, the `person-template` markup is used twice: once for `buyer`, and once for `seller`. Notice that the template markup is wrapped in a `<template>` element so it stays inert until Knockout uses it as a named template.

It's not very often that you'll need to use named templates, but on occasion it can help to minimise duplication of markup.

### Note 2: Using the "foreach" option with a named template

If you want the equivalent of a `foreach` binding, but using a named template, you can do so in the natural way:

```example
html: |-
  <h2>Participants</h2>
  Here are the participants:
  <div data-bind="template: { name: 'person-template', foreach: people }"></div>
  <script id='person-template' type='text/x-knockout'>
    <h3 data-bind="text: name"></h3>
    <p>Credits: <span data-bind="text: credits"></span></p>
  </script>
javascript: |-
  function MyViewModel() {
    this.people = [
      { name: 'Franklin', credits: 250 },
      { name: 'Mario', credits: 5800 }
    ]
  }
  ko.applyBindings(new MyViewModel());
```

This gives the same result as embedding an anonymous template directly inside the element to which you use `foreach`, i.e.:

```html
<div data-bind="foreach: people">
    <h3 data-bind="text: name"></h3>
    <p>Credits: <span data-bind="text: credits"></span></p>
</div>
```

### Note 3: Using "as" to give an alias to "foreach" items

When nesting `foreach` templates, it's often useful to refer to items at higher levels in the hierarchy. One way to do this is to refer to `$parent` or other [binding context](/binding-context/) variables in your bindings.

A simpler and more elegant option, however, is to use `as` to declare a name for your iteration variables. For example:

```html
<ul data-bind="template: { name: 'employeeTemplate',
                                  foreach: employees,
                                  as: 'employee' }"></ul>
```

Notice the string value `'employee'` associated with `as`. Now anywhere inside this `foreach` loop, bindings in your child templates will be able to refer to `employee` to access the employee object being rendered.

This is mainly useful if you have multiple levels of nested `foreach` blocks, because it gives you an unambiguous way to refer to any named item declared at a higher level in the hierarchy. Here's a complete example, showing how `season` can be referenced while rendering a `month`:

```example
html: |-
  <ul data-bind="template: { name: 'seasonTemplate', foreach: seasons, as: 'season' }"></ul>
  <!--  (Note that you can, and probably should, use the `template` binding for newer browsers) -->
  <template>
    <li>
        <strong data-bind="text: name"></strong>
        <ul data-bind="template: { name: 'monthTemplate', foreach: months, as: 'month' }"></ul>
    </li>
  </template>
  <script id='monthTemplate'>
    <li>
        <span data-bind="text: month"></span>
        is in
        <span data-bind="text: season.name"></span>
    </li>
  </script>

javascript: |-
  var viewModel = {
      seasons: ko.observableArray([
          { name: 'Spring', months: [ 'March', 'April', 'May' ] },
          { name: 'Summer', months: [ 'June', 'July', 'August' ] },
          { name: 'Autumn', months: [ 'September', 'October', 'November' ] },
          { name: 'Winter', months: [ 'December', 'January', 'February' ] }
      ])
  };
  ko.applyBindings(viewModel);
```

Tip: Remember to pass a *string literal value* to as (e.g., `as: 'season'`, *not* `as: season`), because you are giving a name for a new variable, not reading the value of a variable that already exists.

### Note 4: Using "afterRender", "afterAdd", and "beforeRemove"

Sometimes you might want to run custom post-processing logic on the DOM elements generated by your templates. For example, you might want to add classes, measure layout, or initialize a third-party widget after the template has rendered.

Generally, the best way to perform such post-processing on DOM elements is to write a [custom binding](/binding-context/custom-bindings/), but if you really just want to access the raw DOM elements emitted by a template, you can use `afterRender`.

Pass a function reference (either a function literal, or give the name of a function on your view model), and Knockout will invoke it immediately after rendering or re-rendering your template. If you're using `foreach`, Knockout will invoke your `afterRender` callback for each item added to your observable array. For example,

```html
  <div data-bind='template: { name: "personTemplate",
                              data: myData,
                              afterRender: myPostProcessingLogic }'> </div>
```

... and define a corresponding function on your view model (i.e., the object that contains `myData`):

```javascript
viewModel.myPostProcessingLogic = function(elements) {
    // "elements" is an array of DOM nodes just rendered by the template
    // You can add custom post-processing logic here
}
```

If you are using `foreach` and only want to be notified about elements that are specifically being added or are being removed, you can use `afterAdd` and `beforeRemove` instead. For details, see documentation for the [`foreach` binding](/bindings/foreach-binding/).

### Note 5: Dynamically choosing which template is used

If you have multiple named templates, you can pass an observable for the `name` option. As the observable's value is updated, the element's contents will be re-rendered using the appropriate template. Alternatively, you can pass a callback function to determine which template to use. If you are using the `foreach` template mode, Knockout will evaluate the function for each item in your array, passing that item's value as the only argument. Otherwise, the function will be given the `data` option's value or fall back to providing your whole current model object.

For example,

```example
html: |-
    <ul data-bind='template: { name: displayMode,
                               foreach: employees }'> </ul>
javascript: |-
    var viewModel = {
        employees: ko.observableArray([
            { name: "Kari", active: ko.observable(true) },
            { name: "Brynn", active: ko.observable(false) },
            { name: "Nora", active: ko.observable(false) }
        ]),
        displayMode: function(employee) {
            // Initially "Kari" uses the "active" template, while the others use "inactive"
            return employee.active() ? "active" : "inactive";
        }
    };

    // ... then later ...
    viewModel.employees()[1].active(true); // Now "Brynn" is also rendered using the "active" template.
```

If your function references observable values, then the binding will update whenever any of those values change.  This will cause the data to be re-rendered using the appropriate template.

If your function accepts a second parameter, then it will receive the entire [binding context](/binding-context/). You can then access `$parent` or any other [binding context](/binding-context/) variable when dynamically choosing a template. For example, you could amend the preceding code snippet as follows:

```javascript
displayMode: function(employee, bindingContext) {
    // Now return a template name string based on properties of employee or bindingContext
}
```

### Note 6: Legacy string-based templating

Knockout's preferred templating model is native DOM-based templating through `template`, `foreach`, `if`, and `with`. If you are maintaining an older app that already depends on a string-based template engine, treat `template` as the bridge between that rendered HTML and Knockout's binding system. New work should stay on the native path.

### Dependencies

 * **Native templating** does not require any library other than Knockout itself
 * **String-based templating** is legacy and should only be used when you are integrating with an existing external template engine.
