# Verified Behaviors: @tko/provider.bindingstring

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If a behavior is not covered by unit tests, it does not belong in this directory.

Binding-string providers that return parseable binding text.

## When to Read This

Read this when you need test-backed behavior for `@tko/provider.bindingstring`, especially binding-string providers that return parseable binding text.

## Status

- Status: curated
- Summary: Curated from unit tests.
- Spec directory: `packages/provider.bindingstring/spec`
- Curated source: `packages/provider.bindingstring/verified-behaviors.json`

## Behaviors

- A subclass can define bindings by returning a binding string from `getBindingString()`, and `getBindingAccessors` parses that string into named accessors.
  Specs: `packages/provider.bindingstring/spec/BindingStringProviderBehaviors.ts`
- Binding preprocessing can rewrite a missing value through a handler `preprocess` hook, so `b` can become `b:false`.
  Specs: `packages/provider.bindingstring/spec/BindingStringProviderBehaviors.ts`
- Binding preprocessing leaves explicit values intact, so `b: true` remains `true` instead of being replaced by the fallback.
  Specs: `packages/provider.bindingstring/spec/BindingStringProviderBehaviors.ts`
