# Verified Behaviors: @tko/computed

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If behavior not covered by unit tests, not belong in this directory.

`computed`, `when`, `throttle`, and `rateLimit` behavior covered by async/unit specs.

## When to Read This

Read when need test-backed behavior for `@tko/computed`, especially `computed`, `when`, `throttle`, `rateLimit` from async/unit specs.

## Status

- Status: curated
- Summary: Curated from unit tests.
- Spec directory: `packages/computed/spec`
- Curated source: `packages/computed/verified-behaviors.json`

## Behaviors

- `extend({ throttle: timeout })` delays observable change notifications until writes stop, then emits latest value.
  Specs: `packages/computed/spec/asyncBehaviors.ts`
- `extend({ throttle: timeout })` on computed delays reevaluation and notification until dependencies stop changing.
  Notes: Evaluator still runs once synchronously on initial creation.
  Specs: `packages/computed/spec/asyncBehaviors.ts`
- `extend({ rateLimit: timeout })` delays default change notifications; `beforeChange` stays immediate, `spectate` sees each write.
  Specs: `packages/computed/spec/asyncBehaviors.ts`
- `rateLimit` supports `notifyAtFixedRate` and `notifyWhenChangesStop`; later `rateLimit` settings used for future notifications.
  Specs: `packages/computed/spec/asyncBehaviors.ts`
- `when(predicate, callback)` runs callback once, then disposes subscription.
  Notes: Predicate = function or observable. Return value exposes `dispose()` to cancel. With deferred updates, callback runs in later task.
  Specs: `packages/computed/spec/observableUtilsBehaviors.ts`, `packages/computed/spec/asyncBehaviors.ts`

## Anti-patterns

- Creating observables, computeds, or subscriptions **inside** computed evaluator leaks instances. Evaluator re-runs each dependency change, producing new un-disposed subscriber each time — memory and subscriber count grow unbounded.
  Test sketch:
  ```ts
  const dep = ko.observable(0)
  const instances: KnockoutObservable<number>[] = []
  const leaky = ko.computed(() => {
    const obs = ko.observable(dep() + 1)
    instances.push(obs)
    return obs()
  })
  expect(instances.length).toBe(1)
  dep(1); expect(instances.length).toBe(2)
  dep(2); expect(instances.length).toBe(3)
  ```
  Fix: create observable/subscription once outside computed, or inside `LifeCycle` subclass constructor where `this.subscribe` / `this.computed` own disposal.
  Related specs: `packages/lifecycle/spec/LifeCycleBehaviors.ts` (disposal semantics).