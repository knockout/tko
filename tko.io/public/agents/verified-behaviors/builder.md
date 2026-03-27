# Verified Behaviors: @tko/builder

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If a behavior is not covered by unit tests, it does not belong in this directory.

Builder construction from explicit provider, binding, filter, and option inputs.

## When to Read This

Read this when you need test-backed behavior for `@tko/builder`, especially builder construction from explicit provider, binding, filter, and option inputs.

## Status

- Status: curated
- Summary: Curated from unit tests.
- Spec directory: `packages/builder/spec`
- Curated source: `packages/builder/verified-behaviors.json`

## Behaviors

- `Builder` constructs successfully when given `filters`, a `provider`, `bindings`, and `options` in its config object.
  Specs: `packages/builder/spec/builderBehaviors.ts`
- Current active spec coverage for `Builder` is thin; only construction from an explicit config object is verified here.
  Specs: `packages/builder/spec/builderBehaviors.ts`
