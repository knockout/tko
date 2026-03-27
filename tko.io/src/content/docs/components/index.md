---
title: Components
description: Reusable component patterns, registration, loading, and custom elements.
sidebar:
  label: Overview
  order: 0
---


# Components

**Components** package UI markup, behavior, and state into reusable units. A component usually has:

* a viewmodel
* a template
* a registration name
* optional parameters

Use components when a section of UI is large enough to deserve its own boundary or when you want to reuse the same behavior in more than one place.

TKO supports three common ways to consume a component:

* the [`component` binding](./component-binding/)
* [custom elements](./component-custom-elements/)
* custom loaders for projects that need conventions or file-based resolution ([more on loaders](./component-loaders/))

### Example: a like/dislike widget

Start with an explicit registration. Keep the example inline while you are learning the shape, then split the viewmodel and template out of line when it becomes part of a real app.

```html
<ul data-bind="foreach: products">
    <li class="product">
        <strong data-bind="text: name"></strong>
        <like-widget params="value: userRating"></like-widget>
    </li>
</ul>
```

```javascript
ko.components.register('like-widget', {
    viewModel: function(params) {
        this.chosenValue = params.value
        this.like = function() { this.chosenValue('like') }.bind(this)
        this.dislike = function() { this.chosenValue('dislike') }.bind(this)
    },
    template:
        '<div class="like-or-dislike" data-bind="visible: !chosenValue()">' +
            '<button data-bind="click: like">Like it</button> ' +
            '<button data-bind="click: dislike">Dislike it</button>' +
        '</div>' +
        '<div class="result" data-bind="visible: chosenValue">' +
            'You <strong data-bind="text: chosenValue"></strong> it' +
        '</div>'
})

function Product(name, rating) {
    this.name = name
    this.userRating = ko.observable(rating || null)
}

function MyViewModel() {
    this.products = [
        new Product('Garlic bread'),
        new Product('Pain au chocolat'),
        new Product('Seagull spaghetti', 'like')
    ]
}

ko.applyBindings(new MyViewModel())
```

### Next Steps

* [Registering components](./component-registration/)
* [Using the `component` binding](./component-binding/)
* [Using custom elements](./component-custom-elements/)
* [Writing custom loaders](./component-loaders/)
