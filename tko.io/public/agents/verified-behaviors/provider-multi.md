# Verified Behaviors: @tko/provider.multi

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If a behavior is not covered by unit tests, it does not belong in this directory.

Provider composition, preemption, and node-type filtering.

## When to Read This

Read this when you need test-backed behavior for `@tko/provider.multi`, especially provider composition, preemption, and node-type filtering.

## Status

- Status: curated
- Summary: Curated from unit tests.
- Spec directory: `packages/provider.multi/spec`
- Curated source: `packages/provider.multi/verified-behaviors.json`

## Behaviors

- `nodeHasBindings` returns `true` if any applicable provider reports bindings and `false` if none do.
  Specs: `packages/provider.multi/spec/MultiProviderBehaviors.ts`
- Providers whose `FOR_NODE_TYPES` do not include the current node type are skipped for binding detection and preprocessing.
  Specs: `packages/provider.multi/spec/MultiProviderBehaviors.ts`
- `getBindingAccessors` merges binding maps from applicable providers.
  Specs: `packages/provider.multi/spec/MultiProviderBehaviors.ts`
- If a provider is marked `preemptive`, only the first applicable preemptive provider contributes bindings.
  Specs: `packages/provider.multi/spec/MultiProviderBehaviors.ts`
- `preprocessNode` calls every applicable provider preprocessor.
  Specs: `packages/provider.multi/spec/MultiProviderBehaviors.ts`
