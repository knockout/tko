# Verified Behaviors: @tko/utils.jsx

> Generated from package discovery + curated JSON. Unit-test-backed only.

JSX object-to-DOM conversion, reactive children and attributes, and async child handling.

## Behaviors

- JSX objects convert to DOM nodes, including nested children, arrays, generators, sparse arrays, primitives, SVG nodes, and actual DOM nodes.
  Specs: `packages/utils.jsx/spec/jsxBehaviors.ts`
- Observable children and attributes stay live: text, nodes, arrays, numbers, attributes, and nested observable structures update in place.
  Specs: `packages/utils.jsx/spec/jsxBehaviors.ts`
- Binding-handler attributes like `ko-x` keep observable references intact instead of being unwrapped at JSX conversion time.
  Specs: `packages/utils.jsx/spec/jsxBehaviors.ts`
- Re-inserting original JSX nodes is supported; re-inserting non-JSX nodes that already carry bindings throws rather than applying bindings twice.
  Specs: `packages/utils.jsx/spec/jsxBehaviors.ts`
- Promise and thenable children are supported, including resolved-node binding, removal before or after resolution, and error-to-comment behavior.
  Specs: `packages/utils.jsx/spec/jsxBehaviors.ts`
- JSX-created nodes can carry native bindings and participate in component rendering and observable-array diff updates.
  Specs: `packages/utils.jsx/spec/jsxBehaviors.ts`

_Curated source: `packages/utils.jsx/verified-behaviors.json`_
