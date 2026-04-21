# Verified Behaviors: @tko/provider.multi

> Generated from package discovery + curated JSON. Unit-test-backed only.

Provider composition, preemption, and node-type filtering.

status: curated · specs: `packages/provider.multi/spec` · curated: `packages/provider.multi/verified-behaviors.json`

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
