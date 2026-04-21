# Verified Behaviors: @tko/binding.component

> Generated from package discovery + curated JSON. Unit-test-backed only.

Component binding runtime, slots, virtual elements, and JSX/object templates.

status: curated · specs: `packages/binding.component/spec` · curated: `packages/binding.component/verified-behaviors.json`

## Behaviors

- `component` works on virtual elements as well as normal elements.
  Specs: `packages/binding.component/spec/componentBindingBehaviors.ts`
- `childrenComplete` fires after a component finishes rendering and receives the rendered nodes plus the component params.
  Specs: `packages/binding.component/spec/componentBindingBehaviors.ts`
- `slot` supports named and default slots, works in virtual-element form, and preprocesses native `<slot>` elements.
  Notes: Named slot templates and plain nodes with a matching `slot` attribute are both covered.
  Specs: `packages/binding.component/spec/componentBindingBehaviors.ts`
- Component templates can be supplied as JSX-style object trees or arrays of JSX-style nodes.
  Notes: Reactive attribute and child updates on those object templates are covered by the specs.
  Specs: `packages/binding.component/spec/componentBindingBehaviors.ts`
