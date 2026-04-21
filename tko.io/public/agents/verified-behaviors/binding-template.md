# Verified Behaviors: @tko/binding.template

> Generated from package discovery + curated JSON. Unit-test-backed only.

Template and foreach rendering, including `nodes`, callbacks, and destroyed-item handling.

status: curated · specs: `packages/binding.template/spec` · curated: `packages/binding.template/verified-behaviors.json`

## Behaviors

- `foreach` duplicates template content for each array entry and keeps the DOM in sync with array mutations.
  Notes: Add, insert, splice, shift, and pop flows are covered in the specs.
  Specs: `packages/binding.template/spec/foreachBehaviors.ts`
- `foreach` and `template: { foreach: ... }` support destroyed-item filtering through `includeDestroyed` and `options.includeDestroyed`.
  Notes: `includeDestroyed: false` omits entries whose `_destroy` flag unwraps truthy. `includeDestroyed: true` keeps destroyed entries in the rendered output.
  Specs: `packages/binding.template/spec/foreachBehaviors.ts`, `packages/binding.template/spec/templatingBehaviors.ts`
- `template` supports a `nodes` option that supplies template nodes directly.
  Notes: The nodes source may be a plain array or a `childNodes` collection. The same nodes can be reused across multiple bindings because the template engine clones them. Falsy `nodes` values behave like an empty node list. Observable arrays are rejected for `nodes`.
  Specs: `packages/binding.template/spec/templatingBehaviors.ts`
- `foreach` supports `afterAdd`, `beforeRemove`, and `afterRender` callbacks.
  Notes: `beforeRemove` leaves node removal to the callback.
  Specs: `packages/binding.template/spec/foreachBehaviors.ts`
- `childrenComplete` also fires when rendering through `template`.
  Specs: `packages/binding.template/spec/templatingBehaviors.ts`
