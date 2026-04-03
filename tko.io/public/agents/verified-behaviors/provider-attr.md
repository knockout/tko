# Verified Behaviors: @tko/provider.attr

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If a behavior is not covered by unit tests, it does not belong in this directory.

Attribute-based `ko-*` binding discovery on elements.

## When to Read This

Read this when you need test-backed behavior for `@tko/provider.attr`, especially attribute-based `ko-*` binding discovery on elements.

## Status

- Status: curated
- Summary: Curated from unit tests.
- Spec directory: `packages/provider.attr/spec`
- Curated source: `packages/provider.attr/verified-behaviors.json`

## Behaviors

- `nodeHasBindings` returns `false` when an element has no `ko-*` attributes and `true` when any `ko-*` attribute is present.
  Specs: `packages/provider.attr/spec/AttributeProviderBehaviors.ts`
- `getBindingAccessors` strips the `ko-` prefix and exposes the binding under its plain name.
  Specs: `packages/provider.attr/spec/AttributeProviderBehaviors.ts`
- Attribute expressions are evaluated against the supplied binding context.
  Specs: `packages/provider.attr/spec/AttributeProviderBehaviors.ts`
