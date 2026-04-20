---
"@tko/utils.jsx": patch
---

Add `options.jsxCleanBatchSize` (default `1000`) controlling JSX node cleanup
batching. Setting it to `0` runs cleanup synchronously on detach. Registered
via `defineOption` — the hardcoded `MAX_CLEAN_AT_ONCE` constant is gone, but
the new default matches it so production behavior is unchanged.

Fixes a `ReferenceError: Element is not defined` in the `cli-happy-dom` test
project where the 25ms batch timer could fire after happy-dom had torn down
DOM globals.
