# Verified Behaviors: @tko/provider.databind

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If a behavior is not covered by unit tests, it does not belong in this directory.

`data-bind` parsing, expression lookup, and end-to-end binding accessors.

## When to Read This

Read this when you need test-backed behavior for `@tko/provider.databind`, especially `data-bind` parsing, expression lookup, and end-to-end binding accessors.

## Status

- Status: curated
- Summary: Curated from unit tests.
- Spec directory: `packages/provider.databind/spec`
- Curated source: `packages/provider.databind/verified-behaviors.json`

## Behaviors

- `nodeHasBindings` detects elements with a `data-bind` attribute.
  Specs: `packages/provider.databind/spec/dataBindProviderBehaviors.ts`
- `getBindingAccessors` parses multiple bindings, preserves escaped quotes in string literals, and returns value-accessor functions.
  Specs: `packages/provider.databind/spec/dataBindProviderBehaviors.ts`
- Parsed accessors are what binding handlers receive as `valueAccessor` during `init` and `update`.
  Specs: `packages/provider.databind/spec/dataBindProviderBehaviors.ts`
- The provider drives core bindings end to end for `text`, `attr`, `click`, and `value`, including reading from and writing to observables.
  Specs: `packages/provider.databind/spec/dataBindProviderBehaviors.ts`
- `value` bindings work with ES5 `defineProperty` getters/setters, including nested property paths.
  Specs: `packages/provider.databind/spec/dataBindProviderBehaviors.ts`
- Expression lookup resolves `$data` before `$context`, `$context` before globals, recognizes `$element`, can be denied access to `window` globals, and does not bleed one globals object into another.
  Specs: `packages/provider.databind/spec/dataBindProviderBehaviors.ts`
