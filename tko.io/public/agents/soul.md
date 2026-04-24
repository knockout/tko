# The Soul of Knockout

Read this to understand *why* Knockout/TKO is shaped the way it is, not just *how* to use it. AI agents working on this codebase: this is the context behind every design decision.

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

## Stability and Migration

Knockout applications written over a decade ago are still running in
production. TKO exists to give those applications a path forward —
the path of least resistance from Knockout 3.x to a modern, maintained
stack.

`@tko/build.knockout` is designed to be a drop-in replacement. Swap the
script tag, verify your tests pass, ship. From there, adopting modern
features (TSX, native providers, modular packages) is incremental and
optional.

The two builds wire the same core differently. Concretely, comparing
`builds/knockout/src/index.ts` and `builds/reference/src/index.ts`:

- **Providers.** Both ship `Component`, `DataBind`, `Virtual`, and
  `Attribute`. `reference` additionally enables `Native`,
  `AttributeMustache`, and `TextMustache`. `knockout` does not.
- **Equality.** `reference` sets `options.strictEquality = true`, so `==`
  and `!=` in binding expressions evaluate as `===` / `!==`. `knockout`
  leaves the legacy lax behavior on.
- **Globals in bindings.** `knockout` sets
  `bindingGlobals: options.global`, exposing the global scope inside
  binding expressions. `reference` does not.
- **Inline-function rewrite.** `knockout` registers
  `functionRewrite` from `@tko/utils.functionrewrite` as a binding-string
  preparser, so legacy inline `function (...) { ... }` expressions in
  `data-bind` still work. `reference` does not.
- **Legacy surface.** `knockout` exposes a
  `ko.expressionRewriting.preProcessBindings` shim for KO 3 plugins.
  `reference` exposes `ko.jsx = { createElement, Fragment, render }` for
  TSX. Neither has the other.

TKO aims for stability, not strict backwards compatibility at all costs.
If a change improves correctness, security, or maintainability and the
migration path is clear, it's worth making. But gratuitous breakage is
not acceptable — the ecosystem depends on being able to upgrade without
rewriting.

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
