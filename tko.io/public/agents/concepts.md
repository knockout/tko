# TKO Concepts

This file explains the core concepts that sit between the thesis and the API guide: what TKO is responsible for, what the consuming application is responsible for, and how TKO systems are typically composed.

## Core Split

TKO provides reactive primitives and DOM wiring. It does not provide a full application architecture.

- TKO owns observables, computeds, bindings, providers, and DOM activation
- the consuming application owns routing, data loading, SSR strategy, application shell, and large-scale feature composition

This is the main architectural boundary to keep in mind when designing with TKO.

## State And DOM

TKO is built around a direct state-to-DOM model.

- observables and computed values hold reactive state
- bindings connect that state to the DOM
- `ko.applyBindings(...)` activates that connection on a DOM subtree

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
- other providers support comment bindings, custom elements, mustache-like forms, and provider composition

Providers are part of TKO's flexibility. They let the same runtime model appear through different syntaxes without changing the underlying reactive contract.

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
- inspect UI behavior through DOM output
- use verified behaviors when questions of contract matter
- use guide and testing docs for API and execution details

For agents, the normal reading order is:

1. find the state
2. find the bindings or provider path
3. inspect the rendered behavior

## Relationship To Other Agent Docs

- [`/agents/why.txt`](/agents/why.txt): quick fit and anti-fit guidance
- [`/agents/thesis.md`](/agents/thesis.md): project rationale and contribution alignment
- [`/agents/guide.md`](/agents/guide.md): API usage and gotchas
- [`/agents/testing.md`](/agents/testing.md): verification flows
- [`/agents/verified-behaviors/index.md`](/agents/verified-behaviors/index.md): test-backed behavior contract
