# Verified Behaviors: @tko/provider.virtual

> Generated from package discovery + curated JSON. Unit-test-backed only.

Virtual comment-node bindings and `<ko>` preprocessing.

## Behaviors

- The provider reads bindings from `<!-- ko ... -->` comment nodes and evaluates them against the supplied context.
  Specs: `packages/provider.virtual/spec/virtualProviderBehaviors.ts`
- Virtual comment bindings support multiple bindings in the same opening comment.
  Specs: `packages/provider.virtual/spec/virtualProviderBehaviors.ts`
- `preprocessNode` converts a `<ko>` element into opening and closing virtual comment nodes.
  Specs: `packages/provider.virtual/spec/virtualProviderBehaviors.ts`
- `<ko>` attribute names prefixed with `ko-` are normalized to plain binding names in the generated virtual binding.
  Specs: `packages/provider.virtual/spec/virtualProviderBehaviors.ts`
- Child nodes inside `<ko>` are preserved between the generated opening and closing virtual comments.
  Specs: `packages/provider.virtual/spec/virtualProviderBehaviors.ts`

_Curated source: `packages/provider.virtual/verified-behaviors.json`_
