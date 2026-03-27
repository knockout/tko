---
title: Component Custom Elements
---


# Custom Component Elements

Custom elements provide a convenient way of injecting [components](./) into your views.

* [Table of contents injected here]
{:toc}

### Introduction

Custom elements are a syntactical alternative to the [`component` binding](./component-binding/) (and in fact, custom elements make use of a component binding behind the scenes).

For example, instead of writing this:

```html
<div data-bind='component: { name: "flight-deals", params: { from: "lhr", to: "sfo" } }'></div>
```

... you can write:

```html
<flight-deals params='from: "lhr", to: "sfo"'></flight-deals>
```

This gives you a WebComponents-like way to organize your code while staying inside plain HTML and TKO's component system.

### Example

This example declares a component, and then injects two instances of it into a view. See the source code below.

```html
<h4>First instance, without parameters</h4>
<message-editor></message-editor>

<h4>Second instance, passing parameters</h4>
<message-editor params='initialText: "Hello, world!"'></message-editor>
```

```javascript
ko.components.register('message-editor', {
    viewModel: function(params) {
        this.text = ko.observable(params.initialText || '');
    },
    template: 'Message: <input data-bind="value: text" /> '
            + '(length: <span data-bind="text: text().length"></span>)'
});

ko.applyBindings();
```

Note: In a real app, you would usually load component viewmodels and templates from separate files or modules instead of hardcoding them into the registration. See [the overview](./) and [registration documentation](./component-registration/).

### Passing parameters

As you have seen in the examples above, you can use a `params` attribute to supply parameters to the component viewmodel. The contents of the `params` attribute are interpreted like a JavaScript object literal (just like a `data-bind` attribute), so you can pass arbitrary values of any type. Example:

```html
<unrealistic-component
    params='stringValue: "hello",
            numericValue: 123,
            boolValue: true,
            objectValue: { a: 1, b: 2 },
            dateValue: new Date(),
            someModelProperty: myModelValue,
            observableSubproperty: someObservable().subprop'>
</unrealistic-component>
```

#### Communication between parent and child components

If you refer to model properties in a `params` attribute, then you are of course referring to the properties on the viewmodel outside the component (the 'parent' or 'host' viewmodel), since the component itself is not instantiated yet. In the above example, `myModelValue` would be a property on the parent viewmodel, and would be received by the child component viewmodel's constructor as `params.someModelProperty`.

This is how you can pass properties from a parent viewmodel to a child component. If the properties themselves are observable, then the parent viewmodel will be able to observe and react to any new values inserted into them by the child component.

#### Passing observable expressions

In the following example,

```html
<some-component
    params='simpleExpression: 1 + 1,
            simpleObservable: myObservable,
            observableExpression: myObservable() + 1'>
</some-component>
```

... the component viewmodel's `params` parameter will contain three values:

  * `simpleExpression`
      * This will be the numeric value `2`. It will not be an observable or computed value, since there are no observables involved.

        In general, if a parameter's evaluation does not involve evaluating an observable (in this case, the value did not involve observables at all), then the value is passed literally. If the value was an object, then the child component could mutate it, but since it's not observable the parent would not know the child had done so.

  * `simpleObservable`
      * This will be the [`ko.observable`](/observables/) instance declared on the parent viewmodel as `myObservable`. It is not a wrapper --- it's the actual same instance as referenced by the parent. So if the child viewmodel writes to this observable, the parent viewmodel will receive that change.

        In general, if a parameter's evaluation does not involve evaluating an observable (in this case, the observable was simply passed without evaluating it), then the value is passed literally.

  * `observableExpression`
      * This one is trickier. The expression itself, when evaluated, reads an observable. That observable's value could change over time, so the expression result could change over time.

        To ensure that the child component can react to changes in the expression value, Knockout **automatically upgrades this parameter to a computed property**. So, the child component will be able to read `params.observableExpression()` to get the current value, or use `params.observableExpression.subscribe(...)`, etc.

        In general, with custom elements, if a parameter's evaluation involves evaluating an observable, then Knockout automatically constructs a `ko.computed` value to give the expression's result, and supplies that to the component.

In summary, the general rule is:

  1. If a parameter's evaluation **does not** involve evaluating an observable/computed, it is passed literally.
  2. If a parameter's evaluation **does** involve evaluating one or more observables/computeds, it is passed as a computed property so that you can react to changes in the parameter value.

### Passing markup into components

Sometimes you may want to create a component that receives markup and uses it as part of its output. For example, you may want to build a "container" UI element such as a grid, list, dialog, or tab set that can receive and bind arbitrary markup inside itself.

Consider a special list component that can be invoked as follows:

```html
<my-special-list params="items: someArrayOfPeople">
    <!-- Look, I'm putting markup inside a custom element -->
    The person <em data-bind="text: name"></em>
    is <em data-bind="text: age"></em> years old.
</my-special-list>
```

By default, the DOM nodes inside `<my-special-list>` will be stripped out (without being bound to any viewmodel) and replaced by the component's output. However, those DOM nodes aren't lost: they are remembered, and are supplied to the component in two ways:

 * As an array, `$componentTemplateNodes`, available to any binding expression in the component's template (i.e., as a [binding context](/binding-context/) property). Usually this is the most convenient way to use the supplied markup. See the example below.
 * As an array, `componentInfo.templateNodes`, passed to its [`createViewModel` function](./component-registration/#a-createviewmodel-factory-function)

The component can then choose to use the supplied DOM nodes as part of its output however it wishes, such as by using `template: { nodes: $componentTemplateNodes }` on any element in the component's template.

For example, the `my-special-list` component's template can reference `$componentTemplateNodes` so that its output includes the supplied markup. Here's the complete working example:

```html
<!-- This could be in a separate file -->
<template id="my-special-list-template">
    <h3>Here is a special list</h3>

    <ul data-bind="foreach: { data: myItems, as: 'myItem' }">
        <li>
            <h4>Here is another one of my special items</h4>
            <!-- ko template: { nodes: $componentTemplateNodes, data: myItem } --><!-- /ko -->
        </li>
    </ul>
</template>

<my-special-list params="items: someArrayOfPeople">
    <!-- Look, I'm putting markup inside a custom element -->
    The person <em data-bind="text: name"></em>
    is <em data-bind="text: age"></em> years old.
</my-special-list>
```

```javascript
ko.components.register('my-special-list', {
    template: { element: 'my-special-list-template' },
    viewModel: function(params) {
        this.myItems = params.items;
    }
});

ko.applyBindings({
    someArrayOfPeople: ko.observableArray([
        { name: 'Lewis', age: 56 },
        { name: 'Hathaway', age: 34 }
    ])
});
```

This "special list" example does nothing more than insert a heading above each list item. But the same technique can be used to create sophisticated grids, dialogs, tab sets, and so on, since all that is needed for such UI elements is common UI markup (e.g., to define the grid or dialog's heading and borders) wrapped around arbitrary supplied markup.

This technique is also possible when using components *without* custom elements, i.e., [passing markup when using the `component` binding directly](./component-binding/#note-passing-markup-to-components).

### Controlling custom element tag names

By default, Knockout assumes that your custom element tag names correspond exactly to the names of components registered using `ko.components.register`. This convention-over-configuration strategy is ideal for most applications.

If you want to have different custom element tag names, you can override `getComponentNameForNode` to control this. For example,

```javascript
ko.components.getComponentNameForNode = function(node) {
    var tagNameLower = node.tagName && node.tagName.toLowerCase();

    if (ko.components.isRegistered(tagNameLower)) {
        // If the element's name exactly matches a preregistered
        // component, use that component
        return tagNameLower;
    } else if (tagNameLower === "special-element") {
        // For the element <special-element>, use the component
        // "MySpecialComponent" (whether or not it was preregistered)
        return "MySpecialComponent";
    } else {
        // Treat anything else as not representing a component
        return null;
    }
}
```

You can use this technique if, for example, you want to control which subset of registered components may be used as custom elements.

### Registering custom elements {% raw %}{#registering-custom-elements}{% endraw %}

If you are using the default component loader, and hence are registering your components using `ko.components.register`, then there is nothing extra you need to do. Components registered this way are immediately available for use as custom elements.

If you have implemented a [custom component loader](./component-loaders/), and are not using `ko.components.register`, then you still need to register any element names you wish to use as custom elements. Register the name first and let the loader supply the definition when TKO asks for it.

```javascript
ko.components.register('my-custom-element', { /* No config needed */ });
```

Alternatively, you can [override `getComponentNameForNode`](#controlling-custom-element-tag-names) to control dynamically which elements map to which component names, independently of preregistration.

### Note: Combining custom elements with regular bindings

A custom element can have a regular `data-bind` attribute (in addition to any `params` attribute) if needed. For example,

```html
<products-list params='category: chosenCategory'
               data-bind='visible: shouldShowProducts'>
</products-list>
```

However, it does not make sense to use bindings that would modify the element's contents, such as the [`text`](../../bindings/text-binding/) or [`template`](../../bindings/template-binding/) bindings, since they would overwrite the template injected by your component.

TKO will prevent the use of any bindings that use [`controlsDescendantBindings`](../../binding-context/custom-bindings-controlling-descendant-bindings/), because that would clash with the component when trying to bind its viewmodel to the injected template. If you want to use a control-flow binding such as `if` or `foreach`, wrap it around your custom element rather than using it directly on the custom element, e.g.:

```html
<!-- ko if: someCondition -->
    <products-list></products-list>
<!-- /ko -->
```

or:

```html
<ul data-bind='foreach: allProducts'>
    <product-details params='product: $data'></product-details>
</ul>
```

### Note: Custom elements cannot be self-closing

You must write `<my-custom-element></my-custom-element>`, and **not** `<my-custom-element />`. Otherwise, your custom element is not closed and subsequent elements will be parsed as child elements.

This is a limitation of the HTML specification and is outside the scope of what TKO can control. HTML parsers ignore self-closing slashes on normal elements, so write `<my-custom-element></my-custom-element>` instead of `<my-custom-element />`.

### Note: Register names before use

Custom elements need a registered name before they can be instantiated. If your app uses a custom loader, register the element name first and let the loader supply the definition when TKO requests it.

### Advanced: Accessing `$raw` parameters

Consider the following unusual case, in which `useObservable1`, `observable1`, and `observable2` are all observables:

```html
<some-component
    params='myExpr: useObservable1() ? observable1 : observable2'>
</some-component>
```

Since evaluating `myExpr` involves reading an observable (`useObservable1`), KO will supply the parameter to the component as a computed property.

However, the value of the computed property is itself an observable. This would seem to lead to an awkward scenario, where reading its current value would involve double-unwrapping (i.e., `params.myExpr()()`, where the first parentheses give the value of the expression, and the second give the value of the resulting observable instance).

This double-unwrapping would be ugly, inconvenient, and unexpected, so Knockout automatically sets up the generated computed property (`params.myExpr`) to unwrap its value for you. That is, the component can read `params.myExpr()` to get the value of whichever observable has been selected (`observable1` or `observable2`), without the need for double-unwrapping.

In the unlikely event that you *don't* want the automatic unwrapping, because you want to access the `observable1`/`observable2` instances directly, you can read values from `params.$raw`. For example,

```javascript
function MyComponentViewModel(params) {
    var currentObservableInstance = params.$raw.myExpr();

    // Now currentObservableInstance is either observable1 or observable2
    // and you would read its value with "currentObservableInstance()"
}
```

This should be a very unusual scenario, so normally you will not need to work with `$raw`.
