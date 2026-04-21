# Plan: TypeScript Code Review — Findings (Round 4)

**Risk class:** `MEDIUM`

**Status:** Active Backlog

## Status Update (2026-04-21)

- Updated to current toolchain language (Bun + Biome).
- Deduplicated against rounds 1–3.
- This file keeps only Round-4-canonical findings.

## Stack Baseline (Current)

- Type-check: `bun run tsc`
- Lint/format: `bun run check`
- Tests: `bun run test`
- Unused analysis: `bun run knip`

## Summary

Round 4 tracks **2 critical bugs**, **8 important improvements**, and **9 suggestions**
that are not duplicated as canonical findings in rounds 1–3.

## Prior Rounds

For historical context and previously cataloged findings, see:

1. `plans/typescript-code-review-findings.md`
2. `plans/typescript-code-review-findings-2.md`
3. `plans/typescript-code-review-findings-3.md`

---

## Detailed Findings

### Critical Issues 🔴

#### 1. `notifyNextChange` closure variable never reset — sticky spurious notifications
**File**: `packages/observable/src/observable.ts:212`
- **Issue**: In `subscribable.fn.limit`, the chained assignment
  `self._notifyNextChange = didUpdate = ignoreBeforeChange = false` writes to
  the instance property `self._notifyNextChange` — which is never read anywhere
  in the codebase — instead of resetting the closure variable `notifyNextChange`.
  Once `_notifyNextChangeIfValueIsDifferent()` sets `notifyNextChange = true`
  (line 238), it is **never** reset to `false`. Every subsequent call to
  `finish()` will see `shouldNotify === true` regardless of value equality,
  causing spurious notifications for any rate-limited or deferred observable.
- **Verified**: `notifyNextChange` is a closure-scoped `let` (line 194).
  `self._notifyNextChange` is never read. Confirmed bug.
- **Current**:
  ```ts
  self._notifyNextChange = didUpdate = ignoreBeforeChange = false
  ```
- **Recommended**:
  ```ts
  notifyNextChange = didUpdate = ignoreBeforeChange = false
  ```

#### 2. Missing `getOwnPropertyDescriptor` Proxy trap breaks `Object.keys()`, `JSON.stringify()`
**File**: `packages/computed/src/proxy.ts:47–84`
- **Issue**: The Proxy defines an `ownKeys` trap returning keys from the source
  `object`, but no `getOwnPropertyDescriptor` trap. The proxy target is an empty
  `function () {}`. When `Object.keys(proxy)` is called, the engine calls
  `ownKeys` (returns real keys), then calls `getOwnPropertyDescriptor` for each —
  which falls through to the empty function target, returning `undefined`. All
  keys are filtered out.
- **Impact**: `Object.keys(proxy)` returns `[]`, `JSON.stringify(proxy)` returns
  `undefined`, and `{...proxy}` produces `{}`.
- **Verified**: Confirmed — no `getOwnPropertyDescriptor` trap exists in the
  handler. The related `deleteProperty` trap bug in the same file was independently
  confirmed and fixed in PR [#336](https://github.com/knockout/tko/pull/336),
  validating the review's accuracy for this proxy handler.
- **Recommended**:
  ```ts
  getOwnPropertyDescriptor(_target, prop) {
    return Object.getOwnPropertyDescriptor(object, prop)
      ?? Reflect.getOwnPropertyDescriptor(_target, prop)
  }
  ```

---

### Important Improvements 🟡

#### 3. Base `Provider.preprocessNode` returns `[node]`, short-circuiting MultiProvider
**File**: `packages/provider/src/Provider.ts:53–55`
- **Issue**: The base `Provider.preprocessNode` returns `[node]` (truthy) instead
  of `null`. In `MultiProvider.preprocessNode`, the first provider returning
  truthy wins — subsequent providers are never consulted. Any provider inheriting
  the default claims every node, preventing later providers from preprocessing.
- **Current**: `return [node]`
- **Recommended**: `return null`

#### 4. `Text.textNodeReplacement` ignores `textNode` parameter, uses global `document`
**File**: `packages/provider.mustache/src/mustacheParser.ts:67–70`
- **Issue**: `Text.textNodeReplacement()` declares zero parameters, but callers
  pass `textNode`. The argument is silently ignored. Uses global
  `document.createTextNode(...)` while sibling `Expression.textNodeReplacement`
  correctly uses `textNode.ownerDocument`. Causes cross-document DOM adoption
  errors.
- **Recommended**: Accept `textNode` parameter, use `textNode.ownerDocument`.

#### 5. `VirtualProvider.preprocessNode` removes node unconditionally when `parent` is null
**File**: `packages/provider.virtual/src/VirtualProvider.ts:21–31`
- **Issue**: Replacement insertions use `parent?.insertBefore(...)` (no-op when
  null), but `node.remove()` always executes. Content silently lost.
- **Recommended**: Early-return `null` when `!parent`.

#### 6. `slotBinding.ts` `getSlot()` returns `Node[]` typed as `Node`
**File**: `packages/binding.component/src/slotBinding.ts:76–86`
- **Issue**: `getSlot` declares return type `Node`, but the default-slot fallback
  returns a filtered `Node[]`.
- **Recommended**: Correct return type to `Node | Node[]` or normalize.

#### 7. `foreach.ts` `removeNodes` — null `parentNode` dereference
**File**: `packages/binding.foreach/src/foreach.ts:~413`
- **Issue**: `removeFn` reads `nodes[0].parentNode` into `parent`, then calls
  `parent.removeChild()`. If nodes are already detached, throws `TypeError`.
- **Recommended**: Use `parent?.removeChild(nodes[i])`.

#### 8. `foreach.ts` `makeTemplateNode` bypasses HTML sanitization
**File**: `packages/binding.foreach/src/foreach.ts:~60`
- **Issue**: For `<script>` template elements, assigns `sourceNode.text` directly
  to `parentNode.innerHTML`, bypassing `options.sanitizeHtmlTemplate`,
  `options.templateSizeLimit`, and `options.allowScriptTagsInTemplates`.
- **Recommended**: Route through `parseHtmlFragment`.

#### 9. `LifeCycle.mixInto` copies `constructor`, overwriting target class identity
**File**: `packages/lifecycle/src/LifeCycle.ts:18–22`
- **Issue**: `Object.getOwnPropertyNames(mixin)` includes `'constructor'`. Breaks
  `instance.constructor === TargetClass` and `instanceof` transitivity.
- **Recommended**: `if (prop === 'constructor') continue`

#### 10. Shell command injection surface in build script
**File**: `tools/build.ts:14–18`
- **Issue**: `esbuild()` passes interpolated string to `sh -c`. Shell
  metacharacters in `package.json` fields are interpreted.
- **Recommended**: Replace `sh -c` with array-based `Bun.spawn`.

---

### Suggestions 🔵

#### 11. `hasSubscriptionsForEvent` returns `number | undefined`, annotated `boolean`
**File**: `packages/observable/src/subscribable.ts:155–157`
- **Recommended**: `return (this._subscriptions[event]?.length ?? 0) > 0`

#### 12. `LifeCycle.addEventListener` crashes when no anchor node is set
**File**: `packages/lifecycle/src/LifeCycle.ts:60–66`
- **Recommended**: Throw a clear error message early.

#### 13. `BindingResult.completionPromise` may be `undefined` despite non-optional type
**File**: `packages/bind/src/BindingResult.ts:5`
- **Recommended**: Mark as optional or assign `Promise.resolve(this)` for sync.

#### 14. Inconsistent `getBindingAccessors` return types across providers
**Files**: `provider/src/Provider.ts`, `provider.bindingstring/src/BindingStringProvider.ts`,
`provider.native/src/NativeProvider.ts`
- **Recommended**: Standardize to `BindingAccessors | null`.

#### 15. `editScriptItem` typed as `number[]` but is a keyed object
**File**: `packages/bind/src/arrayToDomNodeChildren.ts:143–148`
- **Recommended**: Define proper `EditScriptItem` interface.

#### 16. `memoization.ts` variable shadowing of module-level `memos`
**File**: `packages/utils/src/memoization.ts:6,56`
- **Recommended**: Rename local to `foundMemos`.

#### 17. ESM import-fix regex over-matches non-JS extensions
**File**: `tools/build.ts:58`
- **Recommended**: Use `(?<!\.\w+)` instead of `(?<!\.js)`.

#### 18. Self-referential package import in `extenders.ts`
**File**: `packages/observable/src/extenders.ts:8`
- **Recommended**: `import type { ObservableArray } from './observableArray'`

#### 19. Duplicate import from `@tko/utils.jsx` in reference build
**File**: `builds/reference/src/index.ts:19–20`
- **Recommended**: Merge into single import statement.

---

## PR #297 Review — Additional Notes

- Brian recommended treating findings plans as separate follow-ups rather than bundling with the skill PR.
- Each critical finding should be independently verified before locking it in as a plan item.
- Findings #1 and #2 are confirmed as real bugs (see verification notes above).
- Open PRs addressing findings from across all rounds: #345 (`??` earlyOut), #346 (TextInputLegacyFirefox), #347 (duplicate options import).

---

## Steps

### Phase 1: Critical Bug Fixes (HIGH priority)

1. Fix `notifyNextChange` closure reset and add focused tests.
2. Add `getOwnPropertyDescriptor` proxy trap and add focused tests for key enumeration/serialization.

### Phase 2: Important Fixes (MEDIUM priority)

3. Fix findings #3–#10 with package-scoped tests and one full-suite pass.

### Phase 3: Suggestions (LOW priority)

4. Triage findings #11–#19 and land low-risk cleanup separately.

## Verification

- `bun run tsc`
- `bun run check`
- `bun run test`
- `bun run knip`
