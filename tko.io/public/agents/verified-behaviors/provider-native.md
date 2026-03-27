# Verified Behaviors: @tko/provider.native

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If a behavior is not covered by unit tests, it does not belong in this directory.

Native `ko-*` binding accessors attached directly to DOM nodes.

## When to Read This

Read this when you need test-backed behavior for `@tko/provider.native`, especially native `ko-*` binding accessors attached directly to DOM nodes.

## Status

- Status: curated
- Summary: Curated from unit tests.
- Spec directory: `packages/provider.native/spec`
- Curated source: `packages/provider.native/verified-behaviors.json`

## Behaviors

- `NativeProvider` only recognizes entries stored under `NATIVE_BINDINGS` whose keys start with `ko-`.
  Notes: Nodes without the symbol, or with only non-`ko-*` entries, report no bindings.
  Specs: `packages/provider.native/spec/NativeProviderBehaviors.ts`
- `NativeProvider.getBindingAccessors(node)` returns value accessors that read observables and write back through writable observables.
  Specs: `packages/provider.native/spec/NativeProviderBehaviors.ts`
- `NativeProvider` is preemptive: when native bindings are present, it outranks `data-bind` and mustache providers.
  Notes: It does not preempt those providers when the native binding bag is empty or contains no `ko-*` entries.
  Specs: `packages/provider.native/spec/NativeProviderBehaviors.ts`
