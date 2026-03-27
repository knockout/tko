---
title: Component Registration
---


# Component Registration

For TKO to load and instantiate a component, you register it with `ko.components.register`.

If your app needs to resolve components from files, naming conventions, or another lookup strategy, use a [custom component loader](./component-loaders/) rather than hiding that logic inside the registration format.

* [Table of contents injected here]
{:toc}

## Registering a component

```javascript
ko.components.register('some-component-name', {
    viewModel: <see below>,
    template: <see below>
})
```

* The component `name` can be any nonempty string. Lowercase dash-separated names such as `your-component-name` are recommended because they are valid custom element names too.
* `viewModel` is optional.
* `template` is required.

If no viewmodel is given, the component is treated as a simple block of HTML that will be bound to any parameters passed to the component.

### Specifying a viewmodel

Viewmodels can be specified in any of the following forms.

#### A constructor function

```javascript
function SomeComponentViewModel(params) {
    this.someProperty = params.something
}

SomeComponentViewModel.prototype.doSomething = function() { ... }

ko.components.register('my-component', {
    viewModel: SomeComponentViewModel,
    template: ...
})
```

TKO creates a new viewmodel instance for each component instance.

#### A shared object instance

```javascript
var sharedViewModelInstance = { ... }

ko.components.register('my-component', {
    viewModel: { instance: sharedViewModelInstance },
    template: ...
})
```

Use this only when every component instance should share the same object.

#### A `createViewModel` factory function

```javascript
ko.components.register('my-component', {
    viewModel: {
        createViewModel: function(params, componentInfo) {
            return new MyViewModel(params)
        }
    },
    template: ...
})
```

Use `createViewModel` when you want setup logic before the template is bound, or when you need access to `componentInfo.element` and `componentInfo.templateNodes`.

The `componentInfo.templateNodes` array is useful if you want to build a component that accepts arbitrary markup to influence its output, such as a grid, list, dialog, or tab set. See [passing markup into components](./component-custom-elements/#passing-markup-into-components) for a complete example.

### Specifying a template

Templates can be specified in any of the following forms.

#### An existing element ID

```html
<template id='my-component-template'>
    <h1 data-bind='text: title'></h1>
    <button data-bind='click: doSomething'>Click me right now</button>
</template>
```

```javascript
ko.components.register('my-component', {
    template: { element: 'my-component-template' },
    viewModel: ...
})
```

Only the nodes inside the element are cloned into each component instance.

#### An existing element instance

```javascript
var elemInstance = document.getElementById('my-component-template')

ko.components.register('my-component', {
    template: { element: elemInstance },
    viewModel: ...
})
```

#### A string of markup

```javascript
ko.components.register('my-component', {
    template: '<h1 data-bind="text: title"></h1>' +
              '<button data-bind="click: doSomething">Clickety</button>',
    viewModel: ...
})
```

This is convenient when your build step already emits a template string or when a custom loader turns fetched markup into a string before converting it to DOM nodes.

#### An array of DOM nodes

```javascript
var myNodes = [
    document.getElementById('first-node'),
    document.getElementById('second-node'),
    document.getElementById('third-node')
]

ko.components.register('my-component', {
    template: myNodes,
    viewModel: ...
})
```

#### A document fragment

```javascript
ko.components.register('my-component', {
    template: someDocumentFragmentInstance,
    viewModel: ...
})
```

### Additional component options

Your component configuration object can include additional properties if a custom loader needs them. Those properties are passed through to the loader unchanged.

### Controlling synchronous/asynchronous loading

If your component configuration has a boolean `sync` property, TKO uses it to determine whether the component is allowed to load and inject synchronously. The default is `false`.

Normally, TKO keeps component loading asynchronous because a loader may need to fetch files or data. That default avoids bugs where a process sometimes completes synchronously and sometimes asynchronously.

If you set `sync: true`, a component may load asynchronously the first time and synchronously on later uses if the definition is already cached. Use that carefully when your code depends on timing.

### Related topics

* [Component loaders](./component-loaders/)
* [Custom elements](./component-custom-elements/)
