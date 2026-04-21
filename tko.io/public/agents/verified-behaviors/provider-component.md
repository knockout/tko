# Verified Behaviors: @tko/provider.component

> Generated from package discovery + curated JSON. Unit-test-backed only.

Custom-element component provider behavior and component parameter handling.

## Behaviors

- Registered components render into matching custom elements, including overridden name resolution via `getComponentNameForNode`, but not into standard elements with the same tag name.
  Specs: `packages/provider.component/spec/customElementBehaviors.ts`
- Custom elements may also carry regular bindings like `visible`, but bindings that also control descendants conflict with `component` and throw.
  Specs: `packages/provider.component/spec/customElementBehaviors.ts`
- When a custom element has no `params` or only whitespace, the component receives `{ $raw: {} }`.
  Specs: `packages/provider.component/spec/customElementBehaviors.ts`, `packages/provider.component/spec/componentProviderBehaviors.ts`
- Passing an observable instance through `params` preserves the observable instance instead of unwrapping it.
  Specs: `packages/provider.component/spec/componentProviderBehaviors.ts`, `packages/provider.component/spec/customElementBehaviors.ts`
- Observable param expressions update reactively without tearing down and recreating the component viewmodel, and subscriptions are cleaned up when the custom element is cleaned.
  Specs: `packages/provider.component/spec/customElementBehaviors.ts`
- Custom elements support transclusion via `componentInfo.templateNodes`, and `afterRender` callbacks on the custom element are invoked after render.
  Specs: `packages/provider.component/spec/customElementBehaviors.ts`

_Curated source: `packages/provider.component/verified-behaviors.json`_
