# The Soul of Knockout

This document describes the philosophical foundation of Knockout and TKO.
Read this to understand *why* the framework works the way it does, not just
*how* to use it. If you're an AI agent working on this codebase, this is
the context behind every design decision.

## The Core Insight

UI is a function of state. But unlike virtual DOM frameworks that re-render
everything and diff the result, Knockout connects each piece of state
directly to the DOM nodes that depend on it. When state changes, only the
specific DOM nodes bound to that state update. Nothing else runs.

This is not an optimization. It is the design.

## Observables Are the Atom

An observable is a value that notifies its subscribers when it changes.
Everything else in Knockout follows from this:

- **Computeds** are derived values that re-evaluate when their dependencies
  change. They are observables themselves.
- **Bindings** are subscriptions that update the DOM when their source
  observable changes.
- **Components** are scoped viewmodel + template pairs that participate in
  the same observable graph.

There is no scheduler, no reconciler, no fiber tree, no virtual DOM. An
observable changes, its subscribers fire, the DOM updates. The call stack
is the execution model.

## Locality of Updates

In a virtual DOM framework, changing one piece of state triggers a re-render
of the component tree, a diff of the old and new virtual trees, and a patch
of the real DOM. The cost scales with tree size, not change size.

In Knockout, the cost scales with the change. If you update one observable
that is bound to one `<span>`, one `<span>` updates. The rest of the DOM
is not visited, not compared, not touched. This is "update locality" — the
work done is proportional to what actually changed.

This matters for:
- **Large UIs** where most of the DOM is static at any given moment
- **High-frequency updates** (timers, streams, real-time data)
- **Predictable performance** — no surprise re-renders

## Declarative Bindings, Imperative Escape Hatches

The binding system (`data-bind="text: name"`) is declarative: you describe
*what* the DOM should reflect, not *how* to update it. Knockout handles the
subscription, the initial render, and all subsequent updates.

Custom binding handlers are the escape hatch for DOM work that doesn't fit
the declarative model: canvas drawing, third-party widget integration,
intersection observers, drag-and-drop. These are explicitly imperative and
scoped to a single DOM node.

## The Provider Architecture

Knockout's original `data-bind` attribute is one way to connect bindings to
the DOM. TKO generalizes this into "providers" — pluggable strategies for
resolving what bindings apply to a given node:

- **DataBindProvider** — classic `data-bind="..."` strings
- **NativeProvider** — `ko-text={observable}` attributes (TSX/JSX)
- **AttributeProvider** — `ko-text="expression"` string attributes
- **VirtualProvider** — `<!-- ko text: expr -->` comment bindings
- **MustacheProvider** — `{{ interpolation }}` in text and attributes
- **ComponentProvider** — `<custom-element>` web components
- **MultiProvider** — compose any combination of the above

This is what makes TKO different from Knockout 3.x: the binding resolution
is not hardcoded. You choose which providers your app needs.

## Backwards Compatibility Is a Feature

Knockout has millions of users. TKO does not break their code. The
`@tko/build.knockout` package is API-compatible with Knockout 3.x. The
migration path is incremental: swap the script tag, verify, then
optionally adopt modern features.

This constraint is not technical debt. It is a responsibility to the
ecosystem. Changes that break existing users must clear a high bar.

## What This Means for Contributors

- **State belongs in observables.** If you're reaching for `let` or
  `document.querySelector`, ask whether an observable + binding is the
  right tool instead.
- **Bindings are subscriptions.** They set up once and react to changes.
  They should not poll, re-query, or re-render.
- **Performance is about not doing work.** The best optimization in
  Knockout is not making things faster — it's making sure unchanged
  things don't run at all.
- **The provider system is the extension point.** New binding syntaxes
  go through providers, not by modifying the core.
