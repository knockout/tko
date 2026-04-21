# Plan: TypeScript Code Review — Findings (Round 2, Deduplicated)

**Risk class:** `MEDIUM`

**Status:** Active Backlog

## Status Update (2026-04-21)

- Updated to current toolchain (Bun + Biome).
- Removed completed/obsolete items and cross-round duplicates.
- This file now keeps only Round-2-specific backlog items not promoted as canonical findings in rounds 3–4.

## Stack Baseline (Current)

- Type-check: `bun run tsc`
- Lint/format: `bun run check`
- Tests: `bun run test`
- Unused analysis: `bun run knip`

## Summary

Round 2 currently tracks medium/low-risk cleanup and consistency work that is still relevant,
but not duplicated in newer findings plans.

## Remaining Round-2 Findings

### Important Improvements 🟡

1. `subscribable.when()` may keep subscription alive forever when condition never becomes true.
File: `packages/observable/src/subscribable.ts`

2. Duplicate `bindingKey` in apply-bindings error message.
File: `packages/bind/src/applyBindings.ts`

3. `value.isInput()` checks `this.$element` instead of the parameter.
File: `packages/binding.core/src/value.ts`

4. Loose equality debt (`==`/`!=`) still needs intentional triage and selective replacement.
Scope: multiple packages

5. Deprecated `clonePlainObjectDeep` remains exported.
File: `packages/utils/src/object.ts`

6. `AttributeMustacheProvider.getBindingAccessors` returns `false` for non-element nodes (type-contract mismatch).
File: `packages/provider.mustache/src/AttributeMustacheProvider.ts`

7. `Parser` imported as value and downcast via `as any` in component provider path.
File: `packages/provider.component/src/ComponentProvider.ts`

8. JsxObserver subscription callback ignores callback value.
File: `packages/utils.jsx/src/JsxObserver.ts`

9. `NativeProvider` redundant null fallback.
File: `packages/provider.native/src/NativeProvider.ts`

### Suggestions 🔵

10. Unused `SubscriptionCallback` import.
File: `packages/bind/src/bindingEvent.ts`

11. Legacy `event.returnValue` fallback.
File: `packages/binding.core/src/submit.ts`

12. `readElseChain()` returns `false` where object shape is expected.
File: `packages/binding.if/src/else.ts`

13. Redundant `nodeType` check after `instanceof Element`.
File: `packages/provider.component/src/ComponentProvider.ts`

14. AMD `require` call has no explicit error callback path.
File: `packages/utils.component/src/loaders.ts`

## De-duplication Rules

- Findings tracked in rounds 3 or 4 must not be re-added here.
- Fixed findings stay in git history, not in the active list.
- Obsolete paths (for example removed files) are excluded.

## Verification

- `bun run tsc`
- `bun run check`
- `bun run test`
- `bun run knip`
