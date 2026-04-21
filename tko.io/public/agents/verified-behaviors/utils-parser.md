# Verified Behaviors: @tko/utils.parser

> Generated from package discovery + curated JSON. Unit-test-backed only.

Binding-expression parsing, identifier lookup, filters, namespaces, and preprocess hooks.

## Behaviors

- The parser supports object-literal bindings, arrays, arithmetic, logic, ternaries, lambdas, function calls, indexing, optional chaining, nullish coalescing, template-string interpolation, and comment or virtual-element parsing.
  Specs: `packages/utils.parser/spec/parserBehaviors.ts`, `packages/utils.parser/spec/nodeBehaviors.ts`, `packages/utils.parser/spec/preparserBehavior.ts`
- Identifier lookup and write work against parser context, plain `$data`, no-prototype `$data`, and writable observables.
  Specs: `packages/utils.parser/spec/identifierBehaviors.ts`
- Dereferenced method calls preserve `this` as the parent object; top-level calls use `$data` as `this` when appropriate.
  Specs: `packages/utils.parser/spec/identifierBehaviors.ts`
- Filter syntax `value | filter[:arg...]` composes, accepts looked-up values and expressions, unwraps observables when requested, and preserves the parser root as `this` across filter chains.
  Specs: `packages/utils.parser/spec/filterBehaviors.ts`
- Namespace syntax builds nested binding objects such as `event.click`, `css.classname`, and `style.stylename`, and rejects conflicting shapes like `{ x: identifier, x.y: val }`.
  Specs: `packages/utils.parser/spec/namespaceBehaviors.ts`
- Binding-handler `preprocess` hooks can rewrite values, add bindings, chain across added bindings, and resolve dynamically created binding handlers during preprocessing.
  Specs: `packages/utils.parser/spec/preprocessingBehavior.ts`

_Curated source: `packages/utils.parser/verified-behaviors.json`_
