# Verified Behaviors: @tko/utils.component

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If a behavior is not covered by unit tests, it does not belong in this directory.

Class-based component registration through `ComponentABC` and the default component utilities.

## When to Read This

Read this when you need test-backed behavior for `@tko/utils.component`, especially class-based component registration through `ComponentABC` and the default component utilities.

## Status

- Status: curated
- Summary: Curated from unit tests.
- Spec directory: `packages/utils.component/spec`
- Curated source: `packages/utils.component/verified-behaviors.json`

## Behaviors

- `ComponentABC.register()` requires an overloaded component definition.
  Notes: Registration throws when the class does not provide the required template/element contract.
  Specs: `packages/utils.component/spec/ComponentABCBehaviors.ts`
- When no custom element name is supplied, `ComponentABC.register()` infers a kebab-case custom element name from the class name.
  Specs: `packages/utils.component/spec/ComponentABCBehaviors.ts`
- A registered `ComponentABC` class is used as the component view model and may provide its template through either `template` or `element`.
  Specs: `packages/utils.component/spec/ComponentABCBehaviors.ts`
- Component instances derived from `ComponentABC` are disposed when their bound node is cleaned.
  Specs: `packages/utils.component/spec/ComponentABCBehaviors.ts`
