# Verified Behaviors: @tko/computed

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If a behavior is not covered by unit tests, it does not belong in this directory.

`computed`, `when`, `throttle`, and `rateLimit` behavior covered by the async/unit specs.

## When to Read This

Read this when you need test-backed behavior for `@tko/computed`, especially `computed`, `when`, `throttle`, and `rateLimit` behavior covered by the async/unit specs.

## Status

- Status: curated
- Summary: Curated from unit tests.
- Spec directory: `packages/computed/spec`
- Curated source: `packages/computed/verified-behaviors.json`

## Behaviors

- `extend({ throttle: timeout })` delays observable change notifications until writes stop, then emits the latest value.
  Specs: `packages/computed/spec/asyncBehaviors.ts`
- `extend({ throttle: timeout })` on a computed delays reevaluation and notification until dependencies stop changing.
  Notes: The evaluator still runs once synchronously on initial creation.
  Specs: `packages/computed/spec/asyncBehaviors.ts`
- `extend({ rateLimit: timeout })` delays default change notifications, while `beforeChange` stays immediate and `spectate` sees each write.
  Specs: `packages/computed/spec/asyncBehaviors.ts`
- `rateLimit` supports both `notifyAtFixedRate` and `notifyWhenChangesStop`, and later `rateLimit` settings are used for future notifications.
  Specs: `packages/computed/spec/asyncBehaviors.ts`
- `when(predicate, callback)` runs the callback once, then disposes its subscription.
  Notes: The predicate may be either a function or an observable. The return value exposes `dispose()` to cancel the pending notification. With deferred updates enabled, the callback runs in a later task.
  Specs: `packages/computed/spec/observableUtilsBehaviors.ts`, `packages/computed/spec/asyncBehaviors.ts`

## Anti-patterns

- Creating observables, computeds, or subscriptions **inside** a computed's evaluator leaks instances. The evaluator re-runs on every dependency change, producing a new un-disposed subscriber each time, so memory and subscriber count grow without bound.
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
  Fix: create the observable/subscription once outside the computed, or inside a `LifeCycle` subclass constructor where `this.subscribe` / `this.computed` own disposal.
  Related specs: `packages/lifecycle/spec/LifeCycleBehaviors.ts` (disposal semantics).
