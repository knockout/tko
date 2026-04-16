---
title: API Reference
description: Quick-lookup index of TKO's public API.
---

# API Reference

Quick-lookup table for TKO's public API. Each entry links to its detailed documentation.

## Observables

| Function | Description |
|----------|-------------|
| `ko.observable(value?)` | Create a reactive value. [Docs](/observables/) |
| `ko.observableArray(array?)` | Observable wrapper around an array with mutation methods. [Docs](/observables/observablearrays/) |
| `ko.isObservable(value)` | Check if a value is an observable. [Docs](/observables/utilities/) |
| `ko.isObservableArray(value)` | Check if a value is an observable array. [Docs](/observables/utilities/) |
| `ko.isWritableObservable(value)` | Check if a value is a writable observable. [Docs](/observables/utilities/) |
| `ko.isSubscribable(value)` | Check if a value is any subscribable type. [Docs](/observables/utilities/) |
| `ko.peek(value)` | Read an observable's value without creating a dependency. |
| `ko.unwrap(value)` | Read an observable's value, or return a plain value as-is. [Docs](/observables/utilities/) |
| `ko.toJS(object)` | Clone an object tree, replacing observables with their values. [Docs](/observables/utilities/) |
| `ko.toJSON(object, replacer?, space?)` | `ko.toJS` + `JSON.stringify`. [Docs](/observables/utilities/) |

## Computed

| Function | Description |
|----------|-------------|
| `ko.computed(evaluatorOrOptions, owner?, options?)` | Create a value that depends on other observables. Accepts a function or `{ read, write }` options object. [Docs](/computed/computedobservables/) |
| `ko.pureComputed(evaluator, owner?)` | Computed that sleeps when it has no subscribers. [Docs](/computed/computed-pure/) |
| `ko.isComputed(value)` | Check if a value is a computed observable. [Docs](/observables/utilities/) |
| `ko.isPureComputed(value)` | Check if a value is a pure computed. |
| `ko.ignoreDependencies(callback, owner?, args?)` | Run a function without tracking dependencies. |
| `ko.when(predicate, callback?, context?)` | Resolve when the predicate becomes truthy. Returns a promise, or calls callback if provided. [Docs](/observables/) |

## Subscribable instance methods

Every observable, computed, and observable array inherits these from `subscribable.fn`:

| Method | Description |
|--------|-------------|
| `.subscribe(callback, target?, event?)` | Register a callback for changes. [Docs](/observables/) |
| `.when(testOrValue, returnValue?)` | Promise that resolves when the test passes. [Docs](/observables/) |
| `.yet(testOrValue, returnValue?)` | Promise that resolves when the test *fails* (negated `.when`). [Docs](/observables/) |
| `.next()` | Promise that resolves on the next value change. [Docs](/observables/) |
| `.once(callback)` | Call the callback on the next change, then auto-dispose. [Docs](/observables/) |
| `.peek()` | Read the current value without creating a dependency. |
| `.dispose()` | Tear down all subscriptions. |

## Extenders

| Function | Description |
|----------|-------------|
| `observable.extend(extenders)` | Apply extenders to an observable or computed. [Docs](/observables/extenders/) |
| `rateLimit` | Throttle change notifications. [Docs](/observables/ratelimit-observable/) |
| `notify: 'always'` | Force notification even when value hasn't changed. [Docs](/observables/) |

## Bindings

| Function | Description |
|----------|-------------|
| `ko.applyBindings(viewModel, rootNode?)` | Activate bindings on a DOM subtree. [Docs](/observables/#activating-knockout) |
| `ko.applyBindingsToNode(node, bindings, viewModelOrContext?)` | Apply bindings to a single node programmatically. |
| `ko.applyBindingsToDescendants(viewModelOrContext, rootNode)` | Apply bindings to descendants only (used in custom bindings). [Docs](/binding-context/custom-bindings-controlling-descendant-bindings/) |
| `ko.contextFor(node)` | Get the binding context for a DOM node. |
| `ko.dataFor(node)` | Get the view model bound to a DOM node. |
| `ko.cleanNode(node)` | Remove all TKO data and bindings from a node. |
| `ko.bindingHandlers` | Registry of built-in and custom binding handlers. [Docs](/binding-context/custom-bindings/) |
| `ko.bindingEvent` | Binding lifecycle event constants (e.g., `childrenComplete`, `descendantsComplete`). |
| `ko.BindingHandler` | Base class for class-based custom binding handlers. [Docs](/binding-context/custom-bindings/) |
| `ko.AsyncBindingHandler` | Async variant of `BindingHandler` for bindings that load resources. [Docs](/binding-context/custom-bindings/) |

### Built-in bindings

**Text & HTML:** [`text`](/bindings/text-binding/), [`html`](/bindings/html-binding/), [`textInput`](/bindings/textinput-binding/), [`value`](/bindings/value-binding/)

**Appearance:** [`visible`](/bindings/visible-binding/), `hidden`, [`css`](/bindings/css-binding/) (alias: `class`), [`style`](/bindings/style-binding/), [`attr`](/bindings/attr-binding/)

**Control flow:** [`if`](/bindings/if-binding/), [`ifnot`](/bindings/ifnot-binding/) (alias: `unless`), `else`, `elseif`, [`foreach`](/bindings/foreach-binding/) (alias: `each`), [`with`](/bindings/with-binding/), [`template`](/bindings/template-binding/)

**Context:** `let`, `using`

**Form:** [`click`](/bindings/click-binding/), [`event`](/bindings/event-binding/) (alias: `on`), [`submit`](/bindings/submit-binding/), [`enable`](/bindings/enable-binding/), [`disable`](/bindings/disable-binding/), [`checked`](/bindings/checked-binding/), `checkedValue`, [`options`](/bindings/options-binding/), [`selectedOptions`](/bindings/selectedoptions-binding/), [`hasfocus`](/bindings/hasfocus-binding/), [`uniqueName`](/bindings/uniquename-binding/)

**Components:** `component`, `slot`

**Lifecycle:** `descendantsComplete`

## Components

| Function | Description |
|----------|-------------|
| `ko.components.register(name, config)` | Register a component. [Docs](/components/component-registration/) |
| `ko.components.get(name)` | Retrieve a registered component definition. [Docs](/components/component-loaders/) |
| `ko.components.isRegistered(name)` | Check if a component name is registered. |
| `ko.components.unregister(name)` | Remove a component registration. |
| `ko.components.clearCachedDefinition(name)` | Clear a cached component definition. |
| `ko.Component` | Base class for class-based components (`ComponentABC`). [Docs](/components/) |

## JSX (build.reference only)

| Function | Description |
|----------|-------------|
| `ko.jsx.createElement(tag, props, ...children)` | Create a JSX element. Used as the JSX factory. |
| `ko.jsx.Fragment` | Fragment component for grouping elements without a wrapper node. |
| `ko.jsx.render(jsx)` | Render JSX to DOM nodes. Returns `{ node, dispose }`. |

## DOM disposal

| Function | Description |
|----------|-------------|
| `ko.domNodeDisposal.addDisposeCallback(node, callback)` | Run a callback when a DOM node is removed by TKO. |
| `ko.domNodeDisposal.removeDisposeCallback(node, callback)` | Remove a previously registered disposal callback. |

## Extensibility

| Function | Description |
|----------|-------------|
| `ko.subscribable.fn` | Prototype for all subscribables. [Docs](/observables/utilities/) |
| `ko.observable.fn` | Prototype for all observables — add methods here. [Docs](/observables/utilities/) |
| `ko.observableArray.fn` | Prototype for observable arrays (`remove`, `replace`, etc.). [Docs](/observables/utilities/) |
| `ko.computed.fn` | Prototype for all computeds. [Docs](/observables/utilities/) |
| `ko.tasks` | Microtask scheduler for batching async work. |
