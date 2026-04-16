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
| `ko.isWritableObservable(value)` | Check if a value is a writable observable. [Docs](/observables/utilities/) |
| `ko.isSubscribable(value)` | Check if a value is any subscribable type. [Docs](/observables/utilities/) |
| `ko.unwrap(value)` | Read an observable's value, or return a plain value as-is. [Docs](/observables/utilities/) |
| `ko.toJS(object)` | Clone an object tree, replacing observables with their values. [Docs](/observables/utilities/) |
| `ko.toJSON(object, replacer?, space?)` | `ko.toJS` + `JSON.stringify`. [Docs](/observables/utilities/) |

## Computed

| Function | Description |
|----------|-------------|
| `ko.computed(evaluator, owner?, options?)` | Create a value that depends on other observables. [Docs](/computed/computedobservables/) |
| `ko.pureComputed(evaluator, owner?)` | Computed that sleeps when it has no subscribers. [Docs](/computed/computed-pure/) |
| `ko.isComputed(value)` | Check if a value is a computed observable. [Docs](/observables/utilities/) |
| `ko.when(predicate)` | Return a promise that resolves when the predicate becomes truthy. [Docs](/observables/) |

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
| `ko.applyBindingsToNode(node, bindings, viewModel?)` | Apply bindings to a single node programmatically. |
| `ko.cleanNode(node)` | Remove all TKO data and bindings from a node. |
| `ko.bindingHandlers` | Registry of built-in and custom binding handlers. [Docs](/binding-context/custom-bindings/) |

### Built-in bindings

**Text & HTML:** [`text`](/bindings/text-binding/), [`html`](/bindings/html-binding/), [`textInput`](/bindings/textinput-binding/), [`value`](/bindings/value-binding/)

**Appearance:** [`visible`](/bindings/visible-binding/), [`css`](/bindings/css-binding/), [`style`](/bindings/style-binding/), [`attr`](/bindings/attr-binding/)

**Control flow:** [`if`](/bindings/if-binding/), [`ifnot`](/bindings/ifnot-binding/), [`foreach`](/bindings/foreach-binding/), [`with`](/bindings/with-binding/), [`template`](/bindings/template-binding/)

**Form:** [`click`](/bindings/click-binding/), [`event`](/bindings/event-binding/), [`submit`](/bindings/submit-binding/), [`enable`](/bindings/enable-binding/), [`disable`](/bindings/disable-binding/), [`checked`](/bindings/checked-binding/), [`options`](/bindings/options-binding/), [`selectedOptions`](/bindings/selectedoptions-binding/), [`hasfocus`](/bindings/hasfocus-binding/), [`uniqueName`](/bindings/uniquename-binding/)

## Components

| Function | Description |
|----------|-------------|
| `ko.components.register(name, config)` | Register a component. [Docs](/components/component-registration/) |
| `ko.components.get(name)` | Retrieve a registered component definition. [Docs](/components/component-loaders/) |
| `ko.components.isRegistered(name)` | Check if a component name is registered. |
| `ko.components.unregister(name)` | Remove a component registration. |

## Utilities

| Function | Description |
|----------|-------------|
| `ko.observable.fn` | Prototype for all observables — add methods here. [Docs](/observables/utilities/) |
| `ko.subscribable.fn` | Prototype for all subscribables. [Docs](/observables/utilities/) |
| `ko.computed.fn` | Prototype for all computeds. [Docs](/observables/utilities/) |
