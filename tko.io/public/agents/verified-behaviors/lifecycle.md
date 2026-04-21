# Verified Behaviors: @tko/lifecycle

> Generated from package discovery + curated JSON. Unit-test-backed only.

Lifecycle mixins for subscriptions, computeds, DOM listeners, and anchored disposal.

status: curated · specs: `packages/lifecycle/spec` · curated: `packages/lifecycle/verified-behaviors.json`

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
