# Verified Behaviors: @tko/utils

> Generated from package discovery + curated JSON. Unit-test-backed only.

Task scheduling, DOM disposal, memoization, HTML parsing, and array diff utilities.

status: curated · specs: `packages/utils/spec` · curated: `packages/utils/verified-behaviors.json`

## Behaviors

- `tasks.schedule(...)` runs callbacks asynchronously, preserves scheduling order, processes tasks scheduled during a run, and continues running remaining tasks before surfacing an exception from a throwing task.
  Specs: `packages/utils/spec/taskBehaviors.ts`
- `tasks.cancel(handle)` skips only the canceled task, and `tasks.runEarly()` flushes queued work immediately, including work scheduled during the flush.
  Specs: `packages/utils/spec/taskBehaviors.ts`
- The task queue protects against runaway recursion with a fixed recursion cutoff while still allowing large nonrecursive queues.
  Specs: `packages/utils/spec/taskBehaviors.ts`
- `addDisposeCallback`, `removeDisposeCallback`, `cleanNode`, and `removeNode` run registered disposal callbacks, recurse through descendants, and avoid double-cleaning nodes removed by another dispose handler.
  Specs: `packages/utils/spec/domNodeDisposalBehaviors.ts`
- `memoization.memoize(fn)` returns an HTML comment token; `unmemoize(...)` invokes the callback once; `unmemoizeDomNodeAndDescendants(...)` finds memo nodes in a subtree, passes the memo node to the callback, and removes memo nodes afterward.
  Specs: `packages/utils/spec/memoizationBehaviors.ts`
- `parseHtmlFragment(...)` parses a wide range of HTML fragment shapes into fresh node copies, rejects oversized templates when the size limit is active, and rejects script-tag content when script tags in templates are disallowed.
  Specs: `packages/utils/spec/parseHtmlFragmentBehavior.ts`
- `compareArrays(oldArray, newArray)` reports `retained`, `added`, and `deleted` entries, annotates detected moves with `moved`, supports sparse diffs, and honors the `dontLimitMoves` option.
  Specs: `packages/utils/spec/arrayEditDetectionBehaviors.ts`
