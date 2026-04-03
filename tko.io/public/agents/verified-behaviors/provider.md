# Verified Behaviors: @tko/provider

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If a behavior is not covered by unit tests, it does not belong in this directory.

Provider base-class behavior and constructor contract.

## When to Read This

Read this when you need test-backed behavior for `@tko/provider`, especially provider base-class behavior and constructor contract.

## Status

- Status: curated
- Summary: Curated from unit tests.
- Spec directory: `packages/provider/spec`
- Curated source: `packages/provider/verified-behaviors.json`

## Behaviors

- `Provider` is abstract; instantiating it directly throws.
  Specs: `packages/provider/spec/providerBehaviors.ts`
- Subclasses must override `FOR_NODE_TYPES`; accessing it on a subclass that does not override throws.
  Specs: `packages/provider/spec/providerBehaviors.ts`
- Constructor params can inject `globals` and `bindingHandlers`, and the provider instance keeps those exact references.
  Specs: `packages/provider/spec/providerBehaviors.ts`
