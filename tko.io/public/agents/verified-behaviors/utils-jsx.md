# Verified Behaviors: @tko/utils.jsx

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If behavior not covered by unit tests, not belong in this directory.

JSX object-to-DOM conversion, reactive children and attributes, async child handling.

## When to Read This

Read when need test-backed behavior for `@tko/utils.jsx`, especially JSX object-to-DOM conversion, reactive children/attributes, async child handling.

## Status

- Status: curated
- Summary: Curated from unit tests.
- Spec directory: `packages/utils.jsx/spec`
- Curated source: `packages/utils.jsx/verified-behaviors.json`

## Behaviors

- JSX objects convert to DOM nodes, including nested children, arrays, generators, sparse arrays, primitives, SVG nodes, actual DOM nodes.
  Specs: `packages/utils.jsx/spec/jsxBehaviors.ts`
- Observable children and attributes stay live: text, nodes, arrays, numbers, attributes, nested observable structures update in place.
  Specs: `packages/utils.jsx/spec/jsxBehaviors.ts`
- Binding-handler attributes like `ko-x` keep observable refs intact, not unwrapped at JSX conversion time.
  Specs: `packages/utils.jsx/spec/jsxBehaviors.ts`
- Re-inserting original JSX nodes supported; re-inserting non-JSX nodes with existing bindings throws instead of applying bindings twice.
  Specs: `packages/utils.jsx/spec/jsxBehaviors.ts`
- Promise and thenable children supported: resolved-node binding, removal before/after resolution, error-to-comment behavior.
  Specs: `packages/utils.jsx/spec/jsxBehaviors.ts`
- JSX-created nodes carry native bindings, participate in component rendering and observable-array diff updates.
  Specs: `packages/utils.jsx/spec/jsxBehaviors.ts`
- Binary HTML attributes (`disabled`, `readonly`, `hidden`, `required`, `checked`, `selected`) omit attribute when observable/computed value is `null`, `undefined`, or `false`; any other value (including string `"false"`) sets attribute. Use `|| undefined` in computeds to express "no attribute" explicitly.
  Specs: `packages/utils.jsx/spec/jsxBehaviors.ts`