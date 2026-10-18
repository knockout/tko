# Verified Behaviors: @tko/binding.component

> Generated from package discovery + curated JSON. Unit-test-backed only.

Component binding runtime, slots, virtual elements, and JSX/object templates.

## Behaviors

- `component` works on virtual elements as well as normal elements.
  Specs: `packages/binding.component/spec/componentBindingBehaviors.ts`
- `childrenComplete` fires after a component finishes rendering and receives the rendered nodes plus the component params.
  Specs: `packages/binding.component/spec/componentBindingBehaviors.ts`
- A component viewmodel's `koDescendantsComplete` is invoked via the element's `descendantsComplete` event, so it waits for inner components to complete first (KO 3.5 ordering: inner components before outer).
  Notes: Ordering holds whether components render synchronously or asynchronously, and across intermediate bindings (`with`, nesting several layers deep). Re-rendering an inner component does not re-fire the outer component's `koDescendantsComplete`.
  Specs: `builds/knockout/spec/components/componentBindingBehaviors.js`
- `slot` supports named and default slots, works in virtual-element form, and preprocesses native `<slot>` elements.
  Notes: Named slot templates and plain nodes with a matching `slot` attribute are both covered.
  Specs: `packages/binding.component/spec/componentBindingBehaviors.ts`
- Component templates can be supplied as JSX-style object trees or arrays of JSX-style nodes.
  Notes: Reactive attribute and child updates on those object templates are covered by the specs.
  Specs: `packages/binding.component/spec/componentBindingBehaviors.ts`

_Curated source: `packages/binding.component/verified-behaviors.json`_
