# Plan: TypeScript Code Review - Findings (Round 5)

**Risk class:** `MEDIUM`

**Status:** Active Backlog

## Status Update (2026-05-02)

- Reviewed with the TypeScript Code Review skill.
- Deduplicated against rounds 1-4 before adding findings here.
- This round focuses on async binding completion correctness, null/empty render paths, and stale cleanup edges.

## Stack Baseline (Current)

- Type-check: `bun run tsc`
- Lint/format: `bun run check`
- Tests: `bun run test`
- Targeted tests: `bunx vitest run <path>`

## Summary

Round 5 tracks **3 critical bugs**, **5 important improvements**, and **1 suggestion** that are not
canonical findings in rounds 1-4.

## Prior Rounds

For historical context and previously cataloged findings, see:

1. `plans/typescript-code-review-findings.md`
2. `plans/typescript-code-review-findings-2.md`
3. `plans/typescript-code-review-findings-3.md`
4. `plans/typescript-code-review-findings-4.md`

---

## Detailed Findings

### Critical Issues

#### 1. Conditional bindings do not honor the async completion contract
**File**: `packages/binding.if/src/ConditionalBindingHandler.ts:72-88`

- **Issue**: `render()` does not call `completeBinding()` when `shouldDisplay` is false and there is no else branch.
  That leaves the `AsyncBindingHandler` promise unresolved for initial `if: false`, `ifnot: true`, or `with: null`.
- **Second issue**: `renderAndApplyBindings()` does `await applyBindingsToDescendants(...)`, but
  `applyBindingsToDescendants()` returns a `BindingResult`, not a promise. The await yields immediately and does not
  wait for `BindingResult.completionPromise`.
- **Impact**: `applyBindings()` can either hang forever on non-rendering conditional branches or resolve before async
  descendants finish.
- **Recommended**: Complete immediately for empty/non-rendering branches. In `renderAndApplyBindings()`, inspect the
  returned `BindingResult`; await `completionPromise` only when `!bound.isSync`, then call `completeBinding(bound)`.
- **Regression tests**: Add cases for `if: false`, `ifnot: true`, `with: null`, and an `if` branch containing an async
  descendant binding.

#### 2. Template binding completion is missing for empty render paths and can complete after the first child only
**File**: `packages/binding.template/src/templating.ts:106-109, 429-459`

- **Issue**: The `template` binding is an `AsyncBindingHandler`, but `onValueChange()` does not call
  `completeBinding()` when `shouldDisplay` is false. The `foreach` template path also has no completion callback when
  the rendered array is empty.
- **Second issue**: `activateBindingsOnContinuousNodeArray()` calls `applyBindings(...).then(afterBindingCallback)` once
  per top-level rendered node. The first node to finish can resolve the parent binding while sibling top-level nodes are
  still applying async bindings.
- **Impact**: Server/prerender callers and users awaiting `ko.applyBindings()` get unreliable completion: some empty
  templates never complete, while multi-root templates can complete early.
- **Recommended**: Aggregate the promises returned by all top-level `applyBindings()` calls and invoke the completion
  callback once after all complete. Explicitly complete empty, false, and empty-foreach render paths.
- **Regression tests**: Cover `template: { if: false }`, `template: { foreach: [] }`, and a multi-root template where a
  later sibling has an async binding.

#### 3. `foreach` resolves before async descendants because `BindingResult` objects are passed to `Promise.all`
**File**: `packages/binding.foreach/src/foreach.ts:336-354`

- **Issue**: `added()` pushes the return value from `applyBindingsToDescendants()` into `asyncBindingResults`, then calls
  `Promise.all(asyncBindingResults)`. Those values are `BindingResult` objects, not promises, so `Promise.all()` resolves
  immediately.
- **Impact**: `applyBindings()` can resolve before async descendants inside `foreach` items finish. This weakens the
  binding completion promise that tests, SSR, and automation depend on.
- **Recommended**: Push `bindingResult.completionPromise` for non-sync results and a resolved value for sync results.
  Prefer the configured promise constructor consistently when possible.
- **Regression tests**: Add a `foreach` item with a descendant async binding and assert the outer `applyBindings()`
  promise waits for it.

### Important Improvements

#### 4. `foreach` crashes on nullish data instead of treating it as an empty list
**File**: `packages/binding.foreach/src/foreach.ts:119-151, 230-256`

- **Issue**: The constructor and `processQueue()` read `unwrap(this.data).length` without normalizing nullish values.
  `foreach: null` and observable arrays set to `null` can throw.
- **Impact**: This diverges from the legacy template foreach behavior, where `null` means "no items". In the reference
  build, `foreach` is provided by `@tko/binding.foreach`, so this is user-facing.
- **Recommended**: Normalize `unwrap(this.data) || []` anywhere list length is read, and keep `elseChainSatisfied` false
  for nullish lists.
- **Regression tests**: Add `foreach: null`, `foreach: undefined`, and observable list transitions from populated to
  `null`.

#### 5. Virtual `html` binding does not clear existing content for nullish values
**File**: `packages/utils/src/dom/html.ts:98-143`

- **Issue**: `setHtml()` calls `emptyDomNode(node)` before checking the new value. That clears real elements, but not
  virtual elements because a comment node has no `firstChild`. The later `virtualElements.emptyNode(node)` branch is
  unreachable for `null` because it is nested under `if (html !== null && html !== undefined)`.
- **Impact**: `<!-- ko html: value --><!-- /ko -->` leaves stale DOM in place when `value` changes from HTML to
  `null` or `undefined`.
- **Recommended**: For comment nodes, call `virtualElements.emptyNode(node)` before returning on nullish HTML.
- **Regression tests**: Add a virtual `html` binding that first renders markup and then updates to `null`.

#### 6. Async binding code bypasses `options.Promise` and rejects cross-realm/thenable promises
**Files**:
- `packages/bind/src/BindingHandler.ts:118`
- `packages/bind/src/applyBindings.ts:382, 418, 501`
- `packages/bind/src/BindingResult.ts:21-22`
- `packages/computed/src/when.ts:18`
- `packages/observable/src/subscribable.ts:207-208`
- `packages/utils.jsx/src/JsxObserver.ts:404`

- **Issue**: Several async paths use native `Promise`, and `applyBindings` only records async binding completion when
  `bindingHandler.bindingCompleted instanceof Promise`.
- **Impact**: A custom `options.Promise`, cross-window promises, or thenables can be ignored or wrapped by the wrong
  constructor. The existing "returns a promise" test only proves the default case where `options.Promise === Promise`.
- **Recommended**: Use a shared thenable check (for example `isThenable`) for completion detection and route framework
  promise creation through `options.Promise`. Alternativ, you
  should remove this unused old option.
- **Regression tests**: Temporarily replace `options.Promise` with a compatible custom constructor and assert
  `applyBindings()` waits for async bindings.

#### 7. `Subscription.dispose()` is not idempotent
**File**: `packages/observable/src/Subscription.ts:20-26`

- **Issue**: Repeated `dispose()` calls keep invoking `_disposeCallback()`. For normal subscriptions this repeats
  `afterSubscriptionRemove` even though the subscription has already been removed.
- **Impact**: Pure computeds and subscription-count-sensitive code can observe duplicate removal notifications, and DOM
  disposal callbacks can be removed more than once.
- **Recommended**: Return early when `_isDisposed` is already true; clear `_domNodeDisposalCallback` after removing it.
- **Regression tests**: Dispose the same subscription twice and assert `afterSubscriptionRemove` and callback removal
  happen only once.

#### 8. JSX attribute subscriptions can outlive the current attribute set
**File**: `packages/utils.jsx/src/JsxObserver.ts:362-376`

- **Issue**: `updateAttributes()` appends subscriptions for observable attribute values but does not dispose previous
  subscriptions when an attribute is removed or replaced by a different observable.
- **Impact**: A stale observable can later re-add or overwrite an attribute that no longer exists in the JSX attributes
  object, and the old subscription remains alive until the whole node is removed.
- **Not a duplicate**: Round 2 tracks the callback-value concern in this area. This finding is specifically about
  subscription lifetime and stale attribute ownership.
- **Recommended**: Track attribute subscriptions by attribute name and dispose the prior subscription before replacing
  or removing that attribute.
- **Regression tests**: Render an observable attributes object, replace/remove an observable attribute, then update the
  old observable and assert the DOM is unchanged.

### Suggestions

#### 9. `safeStringify()` treats repeated `null` values as circular references
**File**: `packages/utils/src/object.ts:88-98`

- **Issue**: The JSON replacer calls `seen.has(v)` before checking whether `v` is object-like, then adds all values whose
  `typeof` is `'object'`. Because `typeof null === 'object'`, repeated nulls are serialized as `"..."`.
- **Impact**: `safeStringify([null, null])` would produce a misleading second entry. This is low risk but surprising for
  a utility exported by `@tko/utils`.
- **Recommended**: Only consult and update `seen` for non-null objects.
- **Regression tests**: Add coverage for repeated `null`, repeated primitives, and a true circular object.

---

## Steps

### Phase 1: Async Completion Contract

1. Fix conditional, template, and foreach completion semantics with focused tests.
2. Add a small shared helper for extracting a promise from `BindingResult` values.
3. Re-run `packages/bind`, `packages/binding.if`, `packages/binding.template`, and `packages/binding.foreach` specs.

### Phase 2: Runtime Correctness

4. Normalize nullish `foreach` data and add reference-build coverage.
5. Fix virtual `html` null clearing and add core binding coverage.
6. Make subscription disposal idempotent.

### Phase 3: Cleanup

7. Standardize promise/thenable detection around `options.Promise`.
8. Rework JSX attribute subscription ownership.
9. Patch `safeStringify()` null handling.

## Verification

- `bunx vitest run packages/bind/spec/bindingCompletionPromiseBehavior.ts`
- `bunx vitest run packages/binding.if`
- `bunx vitest run packages/binding.template`
- `bunx vitest run packages/binding.foreach`
- `bunx vitest run packages/binding.core`
- `bunx vitest run packages/observable`
- `bun run tsc`
- `bun run check`
