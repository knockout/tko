# Verified Behaviors: @tko/observable

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If a behavior is not covered by unit tests, it does not belong in this directory.

Core observable and observableArray notification and mutation behavior.

## When to Read This

Read this when you need test-backed behavior for `@tko/observable`, especially core observable and observableArray notification and mutation behavior.

## Status

- Status: curated
- Summary: Curated from unit tests.
- Spec directory: `packages/observable/spec`
- Curated source: `packages/observable/verified-behaviors.json`

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
