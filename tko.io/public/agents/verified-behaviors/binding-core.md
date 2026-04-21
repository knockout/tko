# Verified Behaviors: @tko/binding.core

> Generated from package discovery + curated JSON. Unit-test-backed only.

Core element bindings such as `event` and descendant-completion hooks.

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

_Curated source: `packages/binding.core/verified-behaviors.json`_
