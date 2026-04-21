# Verified Behaviors: @tko/provider.bindingstring

> Generated from package discovery + curated JSON. Unit-test-backed only.

Binding-string providers that return parseable binding text.

## Behaviors

- A subclass can define bindings by returning a binding string from `getBindingString()`, and `getBindingAccessors` parses that string into named accessors.
  Specs: `packages/provider.bindingstring/spec/BindingStringProviderBehaviors.ts`
- Binding preprocessing can rewrite a missing value through a handler `preprocess` hook, so `b` can become `b:false`.
  Specs: `packages/provider.bindingstring/spec/BindingStringProviderBehaviors.ts`
- Binding preprocessing leaves explicit values intact, so `b: true` remains `true` instead of being replaced by the fallback.
  Specs: `packages/provider.bindingstring/spec/BindingStringProviderBehaviors.ts`

_Curated source: `packages/provider.bindingstring/verified-behaviors.json`_
