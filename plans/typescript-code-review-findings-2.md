# Plan: TypeScript Code Review — Findings (Round 2)

**Risk class:** `MEDIUM`

**Status:** Draft

## Status Update (2026-04-20)

- Source basis: local `git log` + GitHub API (`knockout/tko`).
- Marked as done based on code + commits: Findings/Steps 1, 2, 5, 8, 9 (including `bdac39c2`, `3e7a37ae`, `5d6603d7`, `9659cf21`).
- Obsolete: references to `tools/repackage.mjs` (file no longer exists).

## Summary

A comprehensive TypeScript code review of the full TKO monorepo — 25 packages,
2 builds, and tools — applied the `typescript-code-review` skill against all
production source. The review identified **5 critical bugs**, **15 important
improvements**, and **10 suggestions**. The codebase compiles cleanly (`tsc`
zero errors, `eslint` zero errors) and has strong modular architecture.

The most severe findings are:

1. **Proxy `deleteProperty` trap receives wrong argument** — all property
   deletions on computed proxies silently corrupt the wrong key ✅ **Done**
2. **Parser operator precedence inverts JS semantics** — bitwise operators
   parse above relational/equality, causing incorrect expression evaluation ✅ **Done**
3. **`??` (nullish coalescing) behaves identically to `||`** — treats `0`,
   `''`, and `false` as nullish
4. **`TextInputLegacyFirefox` override is dead code** — Firefox
   autocomplete/drag-drop events are never registered
5. **`style` binding references global `jQuery` instead of `options.jQuery`** ✅ **Done**

Additional systemic issues: 17 loose-equality (`==`) comparisons, 4 deprecated
`.substr()` calls ✅ **Done**, 39 unresolved `FIXME`/`TODO` comments, and deprecated DOM
APIs with extraneous arguments in production source.

## Goals

- Fix all 5 confirmed bugs
- Replace all deprecated API usage (`.substr()`, `createEvent`/`initEvent`)
- Fix loose-equality comparisons in production source
- Clean up confirmed dead code

## Non-Goals

- Rewriting all `any` types at once (incremental approach preferred)
- Changing runtime behavior or public API surface beyond bug fixes
- Modifying `tools/build.mk` or `tools/karma.conf.js` (shared infra — needs
  separate HIGH-risk plan)
- Adding new runtime dependencies
- Re-enabling disabled ESLint rules (separate effort)
- DON'T resolve or triage all FIXME/TODO annotations

## Current State

### Baselines

- `make tsc` — zero errors
- `make eslint` — zero errors
- Loose-equality (`==`) in production source: **17 occurrences**
- ~~Deprecated `.substr()` in production source: **4 occurrences**~~ ✅ **Done**
  (Current state: 0 matches in `packages/*/src` + `builds/*/src`)
- Unresolved `FIXME`/`TODO`/`HACK`/`XXX` in production source: **39 occurrences**

### Overlap with Existing Plan

The previous plan (`typescript-code-review-findings.md`) identified some of the
same issues (`.substr()` in `attr.ts`, `AttributeMustacheProvider` bug, FIXMEs).
This plan provides a comprehensive superset with verified new critical findings.
The previous plan's Phase 1 quick wins (steps 1–3) should be subsumed by this
plan's Phase 1.

---

## Detailed Findings

### Critical Issues 🔴

#### 1. Proxy `deleteProperty` trap receives wrong argument ✅ Done
**File**: `packages/computed/src/proxy.ts:57–60`
- **Issue**: The `deleteProperty` trap declares only one parameter `property`,
  but the Proxy spec requires `(target, property)`. The first argument is the
  target object, not the property name. All deletions on computed proxies
  silently fail or corrupt the wrong key.
- **Current**:
  ```ts
  deleteProperty(property) {
    delete mirror[property as any]
    return delete object[property as any]
  }
  ```
- **Recommended**:
  ```ts
  deleteProperty(_target, property) {
    delete mirror[property as any]
    return delete object[property as any]
  }
  ```

#### 2. Parser operator precedence inverts JS semantics for bitwise operators ✅ Done
**File**: `packages/utils.parser/src/operators.ts:172–192`
- **Issue**: Bitwise operators `|`(12), `^`(11), `&`(10) have higher precedence
  than relational (11) and equality (10) operators — the exact inverse of
  JavaScript. Expression `a < b | c` parses as `a < (b | c)` instead of
  `(a < b) | c`. `^` collides with `<` at 11; `&` collides with `===` at 10.
- **Current**:
  ```ts
  operators['|'].precedence = 12
  operators['^'].precedence = 11
  operators['&'].precedence = 10
  operators['<'].precedence = 11
  operators['==='].precedence = 10
  ```
- **Recommended** (match JS/MDN precedence):
  ```ts
  operators['<'].precedence = 12   // relational
  operators['<='].precedence = 12
  operators['>'].precedence = 12
  operators['>='].precedence = 12
  operators['=='].precedence = 11  // equality
  operators['!='].precedence = 11
  operators['==='].precedence = 11
  operators['!=='].precedence = 11
  operators['&'].precedence = 10   // bitwise AND
  operators['^'].precedence = 9    // bitwise XOR
  operators['|'].precedence = 8    // bitwise OR
  ```

#### 3. `??` nullish coalescing behaves identically to `||`
**File**: `packages/utils.parser/src/operators.ts:199`
- **Issue**: `earlyOut` for `??` is `a => a`, which returns falsy for `0`, `''`,
  and `false`. The RHS is evaluated unnecessarily and `??` becomes a duplicate
  of `||`. If the RHS has side effects, they fire incorrectly.
- **Current**: `operators['??'].earlyOut = a => a`
- **Recommended**: `operators['??'].earlyOut = a => a !== null && a !== undefined`

#### 4. `TextInputLegacyFirefox` overrides non-existent method (dead code)
**File**: `packages/binding.core/src/textInput.ts:132–143`
- **Issue**: Overrides `eventsIndicatingValueChange()`, but the parent class
  `TextInput` calls `eventsIndicatingSyncValueChange()` and
  `eventsIndicatingDeferValueChange()` — never `eventsIndicatingValueChange()`.
  The Firefox-specific `DOMAutoComplete`, `dragdrop`, `drop` events are never
  registered.
- **Current**: `eventsIndicatingValueChange(): string[] {`
- **Recommended**: `override eventsIndicatingSyncValueChange(): string[] {`

#### 5. `style` binding references global `jQuery` instead of `options.jQuery` ✅ Done
**File**: `packages/binding.core/src/style.ts:16–17`
- **Issue**: Guards with `options.jQuery` but calls bare global `jQuery(element)`.
  In module environments where jQuery is not a global, this throws
  `ReferenceError`.
- **Current**: `if (options.jQuery) { jQuery(element).css(styleName, styleValue) }`
- **Recommended**: `if (options.jQuery) { options.jQuery(element).css(styleName, styleValue) }`

---

### Important Improvements 🟡

#### 6. `subscribable.when()` — subscription leak on unsatisfied condition
**File**: `packages/observable/src/subscribable.ts:191–197`
- **Issue**: Promise never rejects. If the test condition is never satisfied, the
  subscription lives forever and the Promise never settles — a memory leak.
- **Recommended**: Add a disposal mechanism (e.g., accept an `AbortSignal`, or
  reject when the observable is disposed).

#### 7. Duplicate `bindingKey` in error message
**File**: `packages/bind/src/applyBindings.ts:510–516`
- **Issue**: Error message includes `spec.bindingKey` twice, producing messages
  like `Unable to process binding "text" in binding "text"`.
- **Recommended**: Remove the duplicated segment or replace the second with the
  binding expression text.

#### 8. `value.isInput()` type guard checks wrong element
**File**: `packages/binding.core/src/value.ts:53–54`
- **Issue**: Type guard narrows the `element` parameter but checks
  `this.$element` instead. Works by coincidence since callers pass
  `this.$element`.
- **Recommended**: `return tagNameLower(element) === 'input'`

#### 9. Deprecated `createEvent`/`initEvent` with extraneous arguments ✅ Done
**File**: `packages/utils/src/dom/event.ts:83–96`
- **Issue**: Uses deprecated `document.createEvent()` and `initEvent()`.
  `initEvent` accepts 3 arguments but 15 are passed (remnant from
  `initMouseEvent` signature) — the extra 12 are silently ignored.
- **Recommended**: Replace with `new Event(eventType, { bubbles: true, cancelable: true })`.

#### 10. Deprecated `.substr()` usage (4 occurrences) ✅ Done

| File | Line |
|------|------|
| `packages/binding.core/src/attr.ts` | 15 |
| `packages/utils.parser/src/preparse.ts` | 94 |
| `packages/filter.punches/src/index.ts` | 54 |
| `packages/filter.punches/src/index.ts` | 57 |

- **Recommended**: Replace with `.substring()` (identical semantics for
  non-negative indices).

#### 11. Duplicate import alias in computed
**File**: `packages/computed/src/computed.ts:12–15`
- **Issue**: `options` is imported both directly and as `options as koOptions`.
  Dead alias creates confusion.
- **Recommended**: Remove one import; use a single name consistently.

#### 12. Loose equality (`==`) instead of strict (`===`) — 17 occurrences
Across `packages/observable`, `packages/binding.core`, `packages/utils`,
`packages/binding.template`, `packages/filter.punches`. Most compare strings
or numbers where `===` is both safer and idiomatic.

#### 13. Dead code: `dataStore` variable in utils
**File**: `packages/utils/src/dom/data.ts:8`
- **Issue**: `const dataStore = {}` declared but never referenced. Leftover from
  prior implementation.
- **Recommended**: Remove.

#### 14. Deprecated `clonePlainObjectDeep` still exported
**File**: `packages/utils/src/object.ts:60–77`
- **Issue**: Annotated `@deprecated Function is unused` but still exported.
- **Recommended**: Remove after confirming no consumers via `knip`.

#### 15. `AttributeMustacheProvider.getBindingAccessors` returns `false`
**File**: `packages/provider.mustache/src/AttributeMustacheProvider.ts:99–100`
- **Issue**: Base `Provider.getBindingAccessors` returns an object. This override
  returns `false` for non-Element nodes — a type-contract violation.
- **Recommended**: Return `Object.create(null)` for consistency.

#### 16. `var` re-declaration shadows parameter in Parser Node ✅ Done
**File**: `packages/utils.parser/src/Node.ts:55–56`
- **Issue**: `var node: Node = this` re-declares the `node` parameter via `var`
  hoisting, discarding it. Confusing and fragile.
- **Recommended**: Rename the parameter to `_node` and use `const node: Node = this`.

#### 17. `Parser` imported as value but only used as type cast
**File**: `packages/provider.component/src/ComponentProvider.ts:11`
- **Issue**: `Parser` is imported as a value, then cast with `as any` to call
  `new (Parser as any)(...)`. The `as any` hides constructor type errors.
- **Recommended**: Fix the `Parser` constructor signature to accept the correct
  arguments, removing the need for `as any`.

#### 18. JsxObserver subscription ignores callback argument
**File**: `packages/utils.jsx/src/JsxObserver.ts:369`
- **Issue**: Subscription callback receives `attr` (new value) but re-passes
  `value` (the observable) to `setNodeAttribute`. Works because
  `setNodeAttribute` calls `unwrap`, but the callback arg is wasted.
- **Current**: `value.subscribe(attr => this.setNodeAttribute(node, name, value))`
- **Recommended**: `value.subscribe(attr => this.setNodeAttribute(node, name, attr))`

#### 19. NativeProvider redundant null-guard
**File**: `packages/provider.native/src/NativeProvider.ts:23–26`
- **Issue**: `|| {}` fallback is dead code — early return already handles falsy.
- **Recommended**: Remove the `|| {}`.

#### 20. `repackage.mjs` swallows write errors silently ⚠️ Obsolete
**File**: `tools/repackage.mjs:48–49`
- **Issue**: `.catch(console.error)` logs but exits 0 on failure. CI won't
  catch broken repackaging.
- **Recommended**: `await` the write and let rejections propagate.

---

### Suggestions 🔵

#### 21. Unused `SubscriptionCallback` import
**File**: `packages/bind/src/bindingEvent.ts:3`

#### 22. Deprecated `event.returnValue = false` fallback
**File**: `packages/binding.core/src/submit.ts:17`
- Legacy IE property; `preventDefault()` is already called in the preceding branch.

#### 23. `readElseChain` returns `false` where object expected
**File**: `packages/binding.if/src/else.ts:36`
- Returns `false` but callers access `.elseChainSatisfied`. Works by accident.

#### 24. Redundant `nodeType` check after `instanceof Element`
**File**: `packages/provider.component/src/ComponentProvider.ts:55`

#### 25. AMD require call lacks error callback
**File**: `packages/utils.component/src/loaders.ts:277`

#### 26. `repackage.mjs` relative path fragility ⚠️ Obsolete
**File**: `tools/repackage.mjs:7`
- `../../lerna.json` assumes CWD depth. Derive from `import.meta.url`.

---

### Positive Observations ✅

- **Zero `tsc` errors** — the full production source compiles cleanly
- **Zero `eslint` errors** — linting passes across all packages
- **Consistent architecture** — factory-function-as-constructor, Symbol keys,
  centralized error handling via `options.onError` are used uniformly
- **Proper `import type`** — the vast majority of type-only imports correctly
  use `import type` as required by `verbatimModuleSyntax`
- **Strong modularity** — 25 packages with clear boundaries, barrel exports,
  and zero runtime dependencies
- **LifeCycle disposal pattern** — modern binding handlers consistently use
  `LifeCycle.anchorTo()` for automatic subscription cleanup
- **Well-structured tests** — Mocha/Chai/Sinon with ~89% statement coverage

---

## Steps

### Phase 1: Critical Bug Fixes (HIGH priority, behavior-changing)

1. ✅ **Fix Proxy `deleteProperty` trap** — Add missing `_target` parameter in
   `packages/computed/src/proxy.ts:57`. Verify with proxy-related tests in
   `packages/computed/spec/`. Done via commit `bdac39c2`.

2. ✅ **Fix parser operator precedence** — Reorder precedence values for bitwise,
   relational, and equality operators in
   `packages/utils.parser/src/operators.ts:172–192`. Must match JS semantics
   exactly. Run full parser test suite. Done via commit `3e7a37ae`.

3. **Fix `??` earlyOut semantics** — Change `a => a` to
   `a => a !== null && a !== undefined` in
   `packages/utils.parser/src/operators.ts:199`. Verify `??` correctly
   preserves `0`, `''`, `false`.

4. **Fix `TextInputLegacyFirefox` override** — Rename
   `eventsIndicatingValueChange()` to `eventsIndicatingSyncValueChange()` in
   `packages/binding.core/src/textInput.ts:132`.

5. ✅ **Fix `style` binding jQuery reference** — Change `jQuery(element)` to
   `options.jQuery(element)` in `packages/binding.core/src/style.ts:17`.
   Done via commit `5d6603d7`.

### Phase 2: Important Fixes (MEDIUM priority, no behavior change unless noted)

6. **Fix `value.isInput()` type guard** — Change `this.$element` to `element`
   in `packages/binding.core/src/value.ts:54`.

7. **Fix duplicate error message** — Remove duplicated `spec.bindingKey`
   segment in `packages/bind/src/applyBindings.ts:510–516`.

8. ✅ **Replace deprecated `.substr()`** — 4 files (see finding #10).
   Done via commit `9659cf21`.

9. ✅ **Replace deprecated `createEvent`/`initEvent`** — Use `new Event()` in
   `packages/utils/src/dom/event.ts:83–96`.
   Done (current code uses `new MouseEvent`/`new KeyboardEvent`/`new Event`).

10. **Fix loose equality** — Replace 17 `==`/`!=` with `===`/`!==` across
    6 packages (see finding #12).

11. **Remove dead code** — `dataStore` in `utils/dom/data.ts`,
    `clonePlainObjectDeep` in `utils/object.ts`, duplicate `options` alias
    in `computed.ts`.

12. **Fix `AttributeMustacheProvider` return type** — Return `Object.create(null)`
    instead of `false` in `provider.mustache/src/AttributeMustacheProvider.ts:99`.

13. **Fix JsxObserver subscription callback** — Pass `attr` instead of `value`
    in `utils.jsx/src/JsxObserver.ts:369`.

14. ✅ **Fix `repackage.mjs` error handling** — `await` the `writeFile` call
    in `tools/repackage.mjs:48`. ⚠️ **Obsolete/dropped**: `tools/repackage.mjs`
    is not present in the current repo state.

### Phase 3: Cleanup (LOW priority)

15. **Triage TODO/FIXME annotations** — Review all 39 annotations; fix, convert
    to tracking issues, or remove stale ones.

16. **Apply remaining suggestions** — Findings #21–#26.

---

## Verification

- `make tsc` — zero errors (must remain green after each step)
- `make test-headless` — all tests pass after each step
- `make eslint` — no new errors introduced
- `make format` — formatting check passes

### Per-Phase Test Strategy

- **Phase 1**: Run full test suite (`make test-headless`). For findings #2/#3
  (parser), add targeted test cases for `a < b | c` and `x ?? 0` expressions.
  For finding #1 (proxy), test `delete proxy.key`.
- **Phase 2**: Run package-specific tests for each changed package, then full
  suite at phase end.
- **Phase 3**: No behavior change expected; full suite once at phase end.

## AI Evidence

- Risk class: `MEDIUM` — behavior-changing bug fixes in binding/parser/proxy
  logic; no CI/CD, release, or shared tooling modification
- Changes and steps: See Steps section (3 phases, 16 steps)
- Tools/commands: `tsc`, `eslint`, subagent code review across all packages
  and builds, manual source verification of all 10 highest-severity findings
- Validation: `tsc` and `eslint` pass with zero errors; all 10 critical/important
  findings confirmed against actual source code at reported line numbers
- Follow-up owner: Maintainer review required before Phase 1 implementation
  (behavior-changing fixes)

# LATER TASK (Don't do this now)

#### 1. Unresolved TODO: class refactoring in subscribable
**File**: `packages/observable/src/subscribable.ts:68`

#### 2. Unresolved TODO: downcast in observable
**File**: `packages/observable/src/observable.ts:209`

#### 3. Unresolved TODO: dangerous `this` in static method
**File**: `packages/bind/src/BindingHandler.ts:97`

#### 4. Unresolved TODOs across multiple packages
**Files**: `packages/utils/src/array.ts:97`,
`packages/utils/src/dom/html.ts:59,146`,
`packages/utils/src/dom/selectExtensions.ts:43`,
`packages/binding.template/src/templating.ts:40`,
`packages/binding.template/src/templateEngine.ts:63`,
`packages/binding.foreach/src/foreach.ts:581`,
`packages/binding.if/src/ConditionalBindingHandler.ts:11`,
`packages/provider/src/Provider.ts:59`,
`packages/utils.parser/src/operators.ts:82–84`,
`builds/reference/src/common.ts:5`
- **Total**: 39 FIXME/TODO/HACK/XXX annotations in production source.
- **Recommended**: Triage all: fix, convert to issues, or remove if stale.
