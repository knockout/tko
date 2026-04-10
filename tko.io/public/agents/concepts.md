# TKO Concepts

Use `/llms.txt` as the index for the full agent docs set. This file explains TKO's core concepts: what TKO is responsible for, what the consuming application is responsible for, and how TKO systems are typically composed.

## Core Contract

TKO's core contract is simple:

- reactive state stays explicit
- DOM wiring stays explicit
- rendered behavior stays verifiable

In practice, that means:

- observables, observableArrays, subscribables, and computeds hold state and derived state
- bindings turn that state into DOM behavior
- providers decide how bindings are discovered on DOM nodes
- `ko.applyBindings(...)` activates that contract on a DOM subtree

TKO does not prescribe routing, data loading, SSR or hydration strategy, styling system, or the application shell. Those are application concerns built around TKO's primitives.

## Core Split

TKO provides reactive primitives and DOM wiring. It does not provide a full application architecture.

- TKO owns observables, computeds, bindings, providers, and DOM activation
- the consuming application owns routing, data loading, SSR strategy, application shell, and large-scale feature composition

This is the main architectural boundary to keep in mind when designing with TKO.

## Primitives

The primitives that define TKO's model are:

- `observable`, `observableArray`, and `subscribable`
  Stateful values and notification sources.
- `computed`, `pureComputed`, and `when`
  Derived state and reactive coordination.
- bindings and binding handlers
  The DOM integration layer. Built-in bindings cover text, attributes, events, control flow, forms, templates, and components. Custom behavior can be added with binding handlers.
- `BindingContext`
  The scope object that bindings read from as control-flow bindings create nested contexts.
- providers
  Binding-discovery primitives. `DataBindProvider`, `NativeProvider`, `VirtualProvider`, `ComponentProvider`, mustache providers, and `MultiProvider` all map DOM nodes to binding accessors.
- `ko.applyBindings(...)`
  Activates bindings against a DOM subtree and its binding context.
- `tko.jsx.render(...)`, `createElement`, and `Fragment`
  The JSX/native render path that creates DOM nodes before binding activation.

These primitives are intended to stay small, explicit, and composable. Higher-level application structure is built from them rather than imposed above them.

## State, Binding, And Activation

TKO is built around a direct state-to-DOM model.

- observables and computed values hold reactive state
- bindings define how that state affects text, attributes, events, structure, and child contexts
- providers discover those bindings on DOM nodes
- `ko.applyBindings(...)` activates the resulting binding graph on a DOM subtree

The important idea is that reactive dependencies should stay visible. State is explicit. DOM wiring is explicit. Behavior can be verified from rendered output.

## Two Authoring Paths

TKO supports two main authoring styles.

- `data-bind`
  Runtime binding strings. Best for migration, comparison work, and HTML-first code.
- `ko-*` in TSX
  Compile-time expressions carried through the native provider path. Best for new UI where you want explicit variables in scope and browser-native TSX authoring.

These are different authoring surfaces for the same underlying state-to-DOM model.

## Providers

Providers determine how TKO discovers bindings on DOM nodes.

- `DataBindProvider` supports classic `data-bind`
- `NativeProvider` supports `ko-*` attributes on JSX-generated DOM
- `VirtualProvider` supports comment bindings
- `ComponentProvider` supports custom elements
- mustache providers support mustache-style interpolation
- `MultiProvider` composes multiple provider strategies into one binding pipeline

Providers are part of TKO's flexibility. They let the same runtime model appear through different syntaxes without changing the underlying reactive contract. A provider maps DOM nodes to binding accessors; provider composition lets one app support multiple syntaxes at once.

## View Components

TKO supports view components today, and they are likely to become more central as TKO 5 strengthens lifecycle boundaries.

The current component surface includes:

- the `component` binding
- `ComponentProvider` for custom-element style component discovery
- `ComponentABC` and the component registry utilities
- class-based `BindingHandler` and `AsyncBindingHandler` patterns for component-like DOM ownership

The important concept is that a view component is a DOM ownership boundary, not a replacement for the core contract. Components still sit on top of the same primitives:

- observable and computed state
- bindings and binding contexts
- provider-driven node discovery
- DOM activation and disposal

In that sense, components are a composition tool for packaging UI, local state, template structure, and lifecycle-sensitive DOM work into a reusable unit.

For TKO 5, the likely direction is stronger lifecycle clarity around those units:

- clearer setup and disposal boundaries
- stronger ownership of subscriptions, computeds, DOM listeners, and descendant activation
- more explicit component-level contracts for mount, update, and cleanup

The core idea does not change. Components should make the primitive model easier to organize at scale, not hide it behind a separate framework layer.

## Composition

TKO composes well when boundaries stay explicit.

- use observables and computeds for local feature state
- keep DOM ownership boundaries coherent
- prefer modules and feature slices that are easy to inspect independently
- treat bindings as the visible contract between state and UI

Large systems can be built from these pieces, but TKO does not impose the top-level structure for doing so.

## Verification Model

TKO is designed to be verified from behavior rather than hidden internal machinery.

- inspect state through observables and computeds
- inspect provider and binding choice when syntax questions matter
- inspect UI behavior through DOM output
- use verified behaviors when questions of contract matter
- use guide and testing docs for API and execution details

For agents, the normal reading order is:

1. find the state
2. find the binding and provider path
3. inspect the rendered behavior

## Index

Use `/llms.txt` as the index for the rest of the agent docs.
