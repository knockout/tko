# Verified Behaviors: @tko/provider.attr

> Generated from package discovery + curated JSON. Unit-test-backed only.

Attribute-based `ko-*` binding discovery on elements.

## Behaviors

- `nodeHasBindings` returns `false` when an element has no `ko-*` attributes and `true` when any `ko-*` attribute is present.
  Specs: `packages/provider.attr/spec/AttributeProviderBehaviors.ts`
- `getBindingAccessors` strips the `ko-` prefix and exposes the binding under its plain name.
  Specs: `packages/provider.attr/spec/AttributeProviderBehaviors.ts`
- Attribute expressions are evaluated against the supplied binding context.
  Specs: `packages/provider.attr/spec/AttributeProviderBehaviors.ts`

_Curated source: `packages/provider.attr/verified-behaviors.json`_
