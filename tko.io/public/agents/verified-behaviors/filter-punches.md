# Verified Behaviors: @tko/filter.punches

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If a behavior is not covered by unit tests, it does not belong in this directory.

Built-in string, defaulting, fitting, and JSON filters.

## When to Read This

Read this when you need test-backed behavior for `@tko/filter.punches`, especially built-in string, defaulting, fitting, and JSON filters.

## Status

- Status: curated
- Summary: Curated from unit tests.
- Spec directory: `packages/filter.punches/spec`
- Curated source: `packages/filter.punches/verified-behaviors.json`

## Behaviors

- `filters.uppercase` uppercases plain strings and unwrapped observables, and `filters.lowercase` lowercases them.
  Specs: `packages/filter.punches/spec/filterBehavior.ts`
- `filters.default` replaces empty string, whitespace-only string, empty array, `null`, and `undefined`, but leaves nonblank strings, `0`, and functions unchanged.
  Specs: `packages/filter.punches/spec/filterBehavior.ts`
- `filters.replace` performs string replacement and unwraps observable input.
  Specs: `packages/filter.punches/spec/filterBehavior.ts`
- `filters.fit` truncates with default ellipsis, supports custom suffix text, and supports left or middle truncation modes.
  Specs: `packages/filter.punches/spec/filterBehavior.ts`
- `filters.json` stringifies strings, arrays, and objects, and accepts a spacing argument.
  Specs: `packages/filter.punches/spec/filterBehavior.ts`
