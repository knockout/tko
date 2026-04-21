# Verified Behaviors: @tko/provider

> Generated from package discovery + curated JSON. Unit-test-backed only.

Provider base-class behavior and constructor contract.

status: curated · specs: `packages/provider/spec` · curated: `packages/provider/verified-behaviors.json`

## Behaviors

- `Provider` is abstract; instantiating it directly throws.
  Specs: `packages/provider/spec/providerBehaviors.ts`
- Subclasses must override `FOR_NODE_TYPES`; accessing it on a subclass that does not override throws.
  Specs: `packages/provider/spec/providerBehaviors.ts`
- Constructor params can inject `globals` and `bindingHandlers`, and the provider instance keeps those exact references.
  Specs: `packages/provider/spec/providerBehaviors.ts`
