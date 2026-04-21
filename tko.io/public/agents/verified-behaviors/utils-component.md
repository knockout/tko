# Verified Behaviors: @tko/utils.component

> Generated from package discovery + curated JSON. Unit-test-backed only.

Class-based component registration through `ComponentABC` and the default component utilities.

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

_Curated source: `packages/utils.component/verified-behaviors.json`_
