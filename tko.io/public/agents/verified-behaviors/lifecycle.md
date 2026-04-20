# Verified Behaviors: @tko/lifecycle

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If a behavior is not covered by unit tests, it does not belong in this directory.

Lifecycle mixins for subscriptions, computeds, DOM listeners, and anchored disposal.

## When to Read This

Read this when you need test-backed behavior for `@tko/lifecycle`, especially lifecycle mixins for subscriptions, computeds, DOM listeners, and anchored disposal.

## Status

- Status: curated
- Summary: Curated from unit tests.
- Spec directory: `packages/lifecycle/spec`
- Curated source: `packages/lifecycle/verified-behaviors.json`

## Behaviors

- `LifeCycle.mixInto(...)` adds `subscribe`, `computed`, `addEventListener`, `anchorTo`, `dispose`, and `addDisposable` to function prototypes, constructed instances, classes, and class instances.
  Specs: `packages/lifecycle/spec/LifeCycleBehaviors.ts`
- `LifeCycle.computed(...)` accepts method names, instance methods, bound functions, plain functions, arrow functions, and `{ read }` objects.
  Specs: `packages/lifecycle/spec/LifeCycleBehaviors.ts`
- `dispose()` tears down subscriptions created through `subscribe(...)` and computeds created through `computed(...)`.
  Specs: `packages/lifecycle/spec/LifeCycleBehaviors.ts`
- Event listeners added through `addEventListener(...)` are removed on `dispose()`.
  Specs: `packages/lifecycle/spec/LifeCycleBehaviors.ts`
- Anchoring one lifecycle object to another with `anchorTo(...)` causes disposal of the parent lifecycle to dispose the anchored child as well.
  Specs: `packages/lifecycle/spec/LifeCycleBehaviors.ts`

## Usage guidance

- Prefer `this.computed(...)` over standalone `ko.computed(...)` inside a `LifeCycle` subclass — the computed is added to the instance's disposal set automatically.
- Prefer `this.subscribe(observable, callback)` over `observable.subscribe(callback)` inside a `LifeCycle` subclass for the same reason.
- Do not create observables, computeds, or subscriptions inside a computed's evaluator — see the anti-pattern in `computed.md`.
