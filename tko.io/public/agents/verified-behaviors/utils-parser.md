# Verified Behaviors: @tko/utils.parser

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If a behavior is not covered by unit tests, it does not belong in this directory.

Binding-expression parsing, identifier lookup, filters, namespaces, and preprocess hooks.

## When to Read This

Read this when you need test-backed behavior for `@tko/utils.parser`, especially binding-expression parsing, identifier lookup, filters, namespaces, and preprocess hooks.

## Status

- Status: curated
- Summary: Curated from unit tests.
- Spec directory: `packages/utils.parser/spec`
- Curated source: `packages/utils.parser/verified-behaviors.json`

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
