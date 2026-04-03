# Verified Behaviors: @tko/binding.core

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If a behavior is not covered by unit tests, it does not belong in this directory.

Core element bindings such as `event` and descendant-completion hooks.

## When to Read This

Read this when you need test-backed behavior for `@tko/binding.core`, especially core element bindings such as `event` and descendant-completion hooks.

## Status

- Status: curated
- Summary: Curated from unit tests.
- Spec directory: `packages/binding.core/spec`
- Curated source: `packages/binding.core/verified-behaviors.json`

## Behaviors

- `event` handlers receive `(model, event)` and run with `this === model`.
  Notes: Null handlers are ignored without throwing.
  Specs: `packages/binding.core/spec/eventBehaviors.ts`
- `event` descriptor objects are verified for `preventDefault`, `bubble`, `once`, `capture`, `debounce`, and `throttle`.
  Notes: Default click handling prevents default navigation unless `preventDefault: false` is supplied. Bubbling is on by default and can be disabled.
  Specs: `packages/binding.core/spec/eventBehaviors.ts`
- `descendantsComplete` fires after descendant bindings finish on both DOM and virtual elements.
  Notes: It does not fire when there are no descendant nodes. A `null` callback is ignored. It also works with `ko.bindingEvent.subscribe(...)`.
  Specs: `packages/binding.core/spec/descendantsCompleteBehaviors.ts`
