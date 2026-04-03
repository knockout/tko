# Verified Behaviors: @tko/binding.if

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If a behavior is not covered by unit tests, it does not belong in this directory.

Conditional and contextual bindings: `if`, `ifnot`, `with`, `else`, and `elseif`.

## When to Read This

Read this when you need test-backed behavior for `@tko/binding.if`, especially conditional and contextual bindings: `if`, `ifnot`, `with`, `else`, and `elseif`.

## Status

- Status: curated
- Summary: Curated from unit tests.
- Spec directory: `packages/binding.if/spec`
- Curated source: `packages/binding.if/verified-behaviors.json`

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
