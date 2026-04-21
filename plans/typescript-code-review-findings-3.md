# Plan: TypeScript Code Review — Findings (Round 3, Deduplicated)

**Risk class:** `MEDIUM`

**Status:** Active Backlog

## Status Update (2026-04-21)

- Updated to current software stack terminology.
- Kept only canonical Round-3 findings.
- Removed overlap duplicates with rounds 1, 2, and 4.

## Stack Baseline (Current)

- Type-check: `bun run tsc`
- Lint/format: `bun run check`
- Tests: `bun run test`

## Summary

Round 3 focuses on parser-semantics parity and runtime portability concerns.
It tracks one critical and two important findings that remain canonical for this round.

## Detailed Findings

### Critical Issues 🔴

1. `LifeCycle.__addEventListener` removes listeners with mismatched signature.
File: `packages/lifecycle/src/LifeCycle.ts`

- Register uses `addEventListener(..., options)` but dispose used `removeEventListener(... )` without options.
- Capture listeners can remain attached after disposal.

### Important Improvements 🟡

2. Parser accepts invalid JavaScript mixing of `??` with `||` / `&&` without required parentheses.
File: `packages/utils.parser/src/operators.ts`

- Native JS requires explicit grouping for these mixes.
- Current parser accepts and evaluates such expressions.

3. Runtime paths use ambient `document/window` instead of configured options.
Files:
- `packages/utils.component/src/loaders.ts`
- `packages/binding.foreach/src/foreach.ts`

- Should consistently use `options.document` / `options.global` for portability.

## Verification

- `bun run tsc`
- `bun run check`
- `bun run test`
- Targeted parser and lifecycle regression tests for the above paths
