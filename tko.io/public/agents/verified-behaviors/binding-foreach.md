# Verified Behaviors: @tko/binding.foreach

> Generated from package discovery + curated JSON. Unit-test-backed only.

Standalone `foreach` binding behavior, templates, and else-chain state.

status: curated · specs: `packages/binding.foreach/spec` · curated: `packages/binding.foreach/verified-behaviors.json`

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
