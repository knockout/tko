# Verified Behaviors: @tko/observable

> Generated from package discovery + curated JSON. Unit-test-backed only.

Core observable and observableArray notification and mutation behavior.

status: curated · specs: `packages/observable/spec` · curated: `packages/observable/verified-behaviors.json`

## Behaviors

- Observables ignore duplicate writes for identical primitives, `null`, and `undefined` by default.
  Notes: Writing the same object reference still notifies because object equality is treated as changed by default.
  Specs: `packages/observable/spec/observableBehaviors.ts`
- Setting `equalityComparer = null` or using `extend({ notify: "always" })` forces notifications for unchanged primitive values.
  Specs: `packages/observable/spec/observableBehaviors.ts`
- `observableArray.destroy(item)` and `destroyAll(...)` mark `_destroy = true` without removing items from the array.
  Specs: `packages/observable/spec/observableArrayBehaviors.ts`
- `observableArray.remove(...)` and `removeAll(...)` remove matching items, return the removed values, and mutate the original array.
  Notes: No change notification is sent when nothing matches.
  Specs: `packages/observable/spec/observableArrayBehaviors.ts`
- `observableArray` is iterable and reports as both an observable and an observable array.
  Specs: `packages/observable/spec/observableArrayBehaviors.ts`
