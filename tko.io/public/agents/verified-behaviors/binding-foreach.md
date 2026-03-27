# Verified Behaviors: @tko/binding.foreach

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If a behavior is not covered by unit tests, it does not belong in this directory.

Standalone `foreach` binding behavior, templates, and else-chain state.

## When to Read This

Read this when you need test-backed behavior for `@tko/binding.foreach`, especially standalone `foreach` binding behavior, templates, and else-chain state.

## Status

- Status: curated
- Summary: Curated from unit tests.
- Spec directory: `packages/binding.foreach/spec`
- Curated source: `packages/binding.foreach/verified-behaviors.json`

## Behaviors

- `foreach` accepts a plain array, `observableArray`, plain observable holding an array, or computed returning an array.
  Specs: `packages/binding.foreach/spec/eachBehavior.ts`
- Initial render is synchronous even when `ForEachBinding.setSync(false)` is configured; later updates can be asynchronous.
  Specs: `packages/binding.foreach/spec/eachBehavior.ts`
- `foreach` binds immediate children, nested descendants, and virtual-element templates.
  Specs: `packages/binding.foreach/spec/eachBehavior.ts`
- `foreach: { name: "id", data: ... }` resolves templates by `id` from `<template>`, `<script type="text/ko-template">`, and regular DOM elements.
  Specs: `packages/binding.foreach/spec/eachBehavior.ts`
- Empty lists set `elseChainSatisfied()` false; non-empty lists set it true, and that flag updates as the array is filled or emptied.
  Specs: `packages/binding.foreach/spec/eachBehavior.ts`
- Array mutation, reordering, duplicate values, `$index`, `as`, and `noIndex` are all exercised in spec coverage.
  Specs: `packages/binding.foreach/spec/eachBehavior.ts`
