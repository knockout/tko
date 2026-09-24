# Plan: `completeOn: "render"` parity for `template` / `foreach`

## Context

Follow-up split from
[`plans/2026-07-16-ko-binding-lifecycle-parity.md`](2026-07-16-ko-binding-lifecycle-parity.md).
That plan ported KO 3.5's `AsyncCompleteContext` bookkeeping into
`@tko/bind` and wired it through `if`/`ifnot`/`with` (via
`ConditionalBindingHandler`) and `component`. The scope-creep guard in
that plan's §3 deferred `template`/`foreach` because they need their own
async-context rework rather than a small edit:

- `TemplateBindingHandler` (`packages/binding.template/src/templating.ts`)
  is not a `ConditionalBindingHandler` subclass — it renders through
  `renderTemplate` / `renderTemplateForEach` and an `onValueChange`
  computed, not `render()` + `renderAndApplyBindings`.
- Its false/empty branch
  (`virtualElements.emptyNode(element); elseChainSatisfied(false)`) does
  **not** notify `childrenComplete`, so a `template` that evaluates to a
  non-displaying state never resolves an ancestor's
  `descendantsComplete`. (The displaying paths already notify
  `childrenComplete` at lines ~163 and ~309.)
- `completeOn: "render"` is not read anywhere in the template path.

`foreach` delegates to the template engine in both KO and TKO, so it
inherits whatever the template handler does.

## Approach

1. Notify `childrenComplete` on the template's false/empty branch
   (parity with `ConditionalBindingHandler`), guarded by a
   `completeOnRender` check so `completeOn: "render"` can hold it open.
2. Read `completeOn` via `allBindings.get('completeOn') === 'render'`;
   compute `needAsyncContext = completeOnRender ||
   allBindings.has('descendantsComplete')`.
3. Thread `startPossiblyAsyncContentBinding(element, ctx)` through each
   render cycle (both `renderTemplate` and `renderTemplateForEach`
   inner-context creation) so nested async content reports completion up
   to the template node, re-armed per cycle like `if`/`with`.
4. Confirm `foreach` (which routes through the template engine) inherits
   the behavior; add a spec.

## Files

| File | Change |
| ---- | ------ |
| `packages/binding.template/src/templating.ts` | `completeOn`, false-branch `childrenComplete`, async context per render |
| `packages/binding.template/spec/` | template/foreach lifecycle specs |
| `packages/binding.foreach/spec/` | foreach `descendantsComplete` / `completeOn` spec |
| `packages/binding.template/verified-behaviors.json` | changed statements |
| `.changeset/*.md` | minor bump, behavior note |

## Verification

1. `bunx vitest run packages/binding.template packages/binding.foreach`
   (build first — tests load compiled `dist/`).
2. New specs: template with `if: false` holds ancestor
   `descendantsComplete` open under `completeOn: "render"` and resolves
   it otherwise; foreach fires `descendantsComplete` after items render.
3. `bun run verify` (full matrix authoritative).
4. Adversarial review per AGENTS.md; audit line per in-scope commit.

## Risks / open questions

- `renderTemplateForEach` completion timing across array mutations —
  each add/remove is a content cycle; decide whether `descendantsComplete`
  re-fires per mutation or per batch, and document it.
- The template computed re-runs on `onValueChange`; ensure the async
  context is re-armed on the computed's re-evaluation, not just first run.
