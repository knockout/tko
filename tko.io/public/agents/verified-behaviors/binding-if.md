# Verified Behaviors: @tko/binding.if

> Generated from package discovery + curated JSON. Unit-test-backed only.

Conditional and contextual bindings: `if`, `ifnot`, `with`, `else`, and `elseif`.

## Behaviors

- `<!-- else -->` inside an `if` region toggles between the if-content and else-content as the condition changes.
  Specs: `packages/binding.if/spec/elseBehaviors.ts`
- Standalone `else` and `elseif` regions chain after `if` across DOM and virtual-element forms.
  Notes: Reactive switching across `if` -> `elseif` -> `else` is covered by the specs.
  Specs: `packages/binding.if/spec/elseBehaviors.ts`
- `with` removes descendants for falsy values and binds descendants in the supplied value context for truthy values.
  Notes: The region is reconstructed when the supplied observable changes truthiness.
  Specs: `packages/binding.if/spec/withBehaviors.ts`
- `with` preserves `$parent`, `$parents`, and `$root` access inside nested contexts.
  Specs: `packages/binding.if/spec/withBehaviors.ts`
- When `options.createChildContextWithAs` is disabled, `with: value, as: "alias"` aliases the value without creating a new child context.
  Notes: Observable aliases update in place without re-rendering the region.
  Specs: `packages/binding.if/spec/withBehaviors.ts`
- `if`/`ifnot`/`with` participate in the KO 3.5 async-completion lifecycle: each render cycle re-arms the node's async context so an ancestor's `descendantsComplete` fires once content renders, and a false branch that renders nothing still notifies `childrenComplete`.
  Notes: `completeOn: "render"` defers the node's `childrenComplete` (and any ancestor `descendantsComplete`) until content is actually rendered. The `completeOn` binding key is reserved and read via `allBindings`; it needs no binding handler of its own.
  Specs: `packages/binding.core/spec/descendantsCompleteBehaviors.ts`

_Curated source: `packages/binding.if/verified-behaviors.json`_
