---
"@tko/utils.jsx": patch
---

Add `flushJsxCleanNow()` to drain the JSX clean queue synchronously

`JsxObserver.detachAndDispose` defers node cleanup through a 25ms
`setTimeout` batch (see `jsxClean.ts`). In environments where DOM globals
are torn down between test files (e.g. the `cli-happy-dom` vitest
project), a timer still pending at teardown fires against a dead global
and throws `ReferenceError: Element is not defined` from
`cleanNode` → `node instanceof Element`. All test assertions pass, but
vitest promotes the trailing unhandled exception to a run failure.

This exports a new `flushJsxCleanNow()` helper that cancels the pending
timer and drains the queue synchronously. The happy-dom vitest setup
(`builds/knockout/helpers/vitest-setup.js`) now calls it from `afterEach`,
eliminating the race. Browser projects are unaffected — the hook is
gated on `isHappyDom()`.
