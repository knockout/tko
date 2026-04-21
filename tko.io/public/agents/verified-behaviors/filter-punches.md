# Verified Behaviors: @tko/filter.punches

> Generated from package discovery + curated JSON. Unit-test-backed only.

Built-in string, defaulting, fitting, and JSON filters.

status: curated · specs: `packages/filter.punches/spec` · curated: `packages/filter.punches/verified-behaviors.json`

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
