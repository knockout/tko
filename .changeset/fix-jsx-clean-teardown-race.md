---
"@tko/utils": patch
"@tko/utils.jsx": patch
---

Add `options.jsxCleanBatchSize` to control JSX node cleanup batching

`JsxObserver.detachAndDispose` defers node cleanup through a 25ms
`setTimeout` batch (see `packages/utils.jsx/src/jsxClean.ts`). In
environments where DOM globals are torn down between test files (e.g.
the `cli-happy-dom` vitest project), a timer still pending at teardown
fires against a dead global and throws `ReferenceError: Element is not
defined` from `cleanNode`. All assertions pass, but vitest promotes the
trailing unhandled exception to a run failure.

A new `options.jsxCleanBatchSize` (default `1000`) controls the batch
size. Setting it to `0` disables batching entirely — JSX node cleanup
then runs synchronously on detach, eliminating the race. The test setup
(`builds/knockout/helpers/vitest-setup.js`) sets it to `0`.

The hardcoded `MAX_CLEAN_AT_ONCE = 1000` constant is removed; production
behavior is unchanged (the new default matches the old constant).
