# Verified Behaviors: @tko/bind

> Generated from package discovery + curated JSON. Unit-test-backed only.

Binding application, binding-handler lifecycle, and completion callbacks.

## Behaviors

- `ko.applyBindings(viewModel, element)` returns a `Promise`.
  Notes: The promise resolves immediately when there are no bindings or only synchronous bindings. The promise waits for async binding handlers and async descendant binding work before it resolves.
  Specs: `packages/bind/spec/bindingCompletionPromiseBehavior.ts`
- `BindingHandler` instances can create lifecycle-bound computeds with `this.computed(...)` and lifecycle-bound subscriptions with `this.subscribe(...)`.
  Notes: Both stop updating after the bound node is cleaned.
  Specs: `packages/bind/spec/bindingHandlerBehaviors.ts`
- `BindingHandler.registerBindingHandler(HandlerClass, name)` registers a class-based binding handler.
  Specs: `packages/bind/spec/bindingHandlerBehaviors.ts`
- Function-style binding handlers receive `(element, valueAccessor, allBindings, $data, $context)` and may define `dispose` cleanup.
  Notes: Virtual-element use requires `allowVirtualElements = true`.
  Specs: `packages/bind/spec/bindingHandlerBehaviors.ts`
- `childrenComplete` fires after descendant bindings are applied.
  Notes: It works on normal elements and virtual elements, and it does not fire when there are no descendants.
  Specs: `packages/bind/spec/bindingAttributeBehaviors.ts`, `packages/bind/spec/nodePreprocessingBehaviors.ts`

_Curated source: `packages/bind/verified-behaviors.json`_
