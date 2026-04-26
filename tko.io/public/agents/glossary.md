# TKO Glossary

## Core Concepts

- **Observable** (`ko.observable(value)`) — a value wrapper that notifies subscribers when it changes. The fundamental reactive primitive.
- **Computed** (`ko.computed(fn)`) — a derived value that re-evaluates automatically when its observable dependencies change. Also called "dependent observable."
- **Pure Computed** (`ko.pureComputed(fn)`) — a computed that sleeps (stops tracking dependencies) when it has no subscribers, and wakes when subscribed. Memory-efficient for UI bindings.
- **Observable Array** (`ko.observableArray([])`) — an observable wrapping an array, with mutation methods (`push`, `remove`, `splice`, etc.) that trigger change notifications.
- **Subscribable** — base class for observables and computeds. Provides `subscribe()`, `extend()`, and the notification system.
- **Subscription** — the return value of `subscribe()`. Call `dispose()` to stop receiving notifications.

## Data Binding

- **Binding** — a declarative connection between a DOM element and a view model property, specified via `data-bind` attributes: `<span data-bind="text: name">`.
- **Binding Handler** — the implementation of a binding (e.g., `text`, `visible`, `foreach`). Extends `BindingHandler` with `init()` and/or `update()` methods.
- **Binding Context** — the data scope available inside a binding. Contains `$data`, `$parent`, `$parents`, `$root`, `$index`, `$context`.
- **Two-way Binding** — bindings like `value` and `textInput` that both read from and write to an observable.

## Templating

- **Template Binding** — `data-bind="template: { name: 'tmpl', data: item }"` renders a named template with a given data context.
- **foreach Binding** — renders a template for each item in an observable array. Efficiently diffs and patches the DOM on array changes.
- **Control Flow Bindings** — `if`, `ifnot`, `with`, `using` — conditionally render or scope DOM sections.

## Providers

- **Provider** — resolves binding instructions from DOM nodes. The default `DataBindProvider` reads `data-bind` attributes.
- **Multi Provider** — combines multiple providers. TKO's `Builder` registers several by default.
- **Native Provider** — reads bindings from `ko-*` properties set directly on DOM nodes (no attributes).
- **Virtual Elements** — `<!-- ko bindingName: value -->...<!-- /ko -->` comment-based bindings for cases where wrapper elements are undesirable.

## Architecture

- **MVVM** (Model-View-ViewModel) — the pattern TKO implements. The ViewModel is a plain JS/TS object with observables; the View is HTML with bindings; TKO connects them.
- **Builder** — `@tko/builder` assembles a TKO instance from modular packages, registering providers, bindings, filters, and components.
- **LifeCycle** — base class providing `subscribe()`, `computed()`, and `addDisposable()` for managed cleanup. Extended by `BindingHandler` and `Provider`.
- **Extender** — `observable.extend({ rateLimit: 500 })` adds behavior modifiers to observables (throttle, rate-limit, notify, etc.).

## Components

- **Component** — a reusable ViewModel + template pair, registered with `ko.components.register('name', { viewModel, template })`.
- **Custom Element** — a component used as `<my-component params="...">` in HTML.
- **Component Loader** — resolves component definitions asynchronously. The default loader uses an in-memory registry; custom loaders can fetch from AMD, HTTP, etc.

## Packages

TKO is a monorepo. Key packages:

| Package | Purpose |
|---------|---------|
| `@tko/observable` | Observables, computed, observable arrays |
| `@tko/computed` | Computed/pure computed implementation |
| `@tko/bind` | Binding application, binding context, binding handlers |
| `@tko/binding.core` | Built-in bindings (text, visible, css, attr, etc.) |
| `@tko/binding.foreach` | foreach binding implementation |
| `@tko/binding.if` | if/ifnot/with/using control flow |
| `@tko/binding.template` | Template rendering engine |
| `@tko/utils` | DOM utilities, array helpers, tasks scheduler |
| `@tko/provider` | Base provider class |
| `@tko/provider.databind` | `data-bind` attribute provider |
| `@tko/builder` | Assembles TKO instance from packages |
| `@tko/build.knockout` | Backwards-compatible Knockout.js distribution |
| `@tko/build.reference` | Modern recommended distribution |
