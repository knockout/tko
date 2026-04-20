# Verified Behaviors: @tko/lifecycle

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If behavior not covered by unit tests, not belong in this directory.

Lifecycle mixins for subscriptions, computeds, DOM listeners, anchored disposal.

## When to Read This

Read when need test-backed behavior for `@tko/lifecycle`, especially lifecycle mixins for subscriptions, computeds, DOM listeners, anchored disposal.

## Status

- Status: curated
- Summary: Curated from unit tests.
- Spec directory: `packages/lifecycle/spec`
- Curated source: `packages/lifecycle/verified-behaviors.json`

## Behaviors

- `LifeCycle.mixInto(...)` adds `subscribe`, `computed`, `addEventListener`, `anchorTo`, `dispose`, `addDisposable` to function prototypes, constructed instances, classes, class instances.
  Specs: `packages/lifecycle/spec/LifeCycleBehaviors.ts`
- `LifeCycle.computed(...)` accepts method names, instance methods, bound functions, plain functions, arrow functions, `{ read }` objects.
  Specs: `packages/lifecycle/spec/LifeCycleBehaviors.ts`
- `dispose()` tears down subscriptions from `subscribe(...)` and computeds from `computed(...)`.
  Specs: `packages/lifecycle/spec/LifeCycleBehaviors.ts`
- Event listeners added via `addEventListener(...)` removed on `dispose()`.
  Specs: `packages/lifecycle/spec/LifeCycleBehaviors.ts`
- Anchoring lifecycle object to another with `anchorTo(...)` — parent disposal disposes anchored child.
  Specs: `packages/lifecycle/spec/LifeCycleBehaviors.ts`

## Usage guidance

- Prefer `this.computed(...)` over standalone `ko.computed(...)` inside `LifeCycle` subclass — computed auto-added to instance disposal set.
- Prefer `this.subscribe(observable, callback)` over `observable.subscribe(callback)` inside `LifeCycle` subclass, same reason.
- Don't create observables, computeds, subscriptions inside computed's evaluator — see anti-pattern in `computed.md`.