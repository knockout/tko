# Plan: Fill Test-Coverage Gaps Identified by `bun run test:coverage`

## Context

PR #364 wired up `bun run test:coverage` (vitest + `@vitest/coverage-v8`,
chromium project, source-map remapped to TS). The first run produced
`COVERAGE.md` (text summary) and `coverage/` (HTML + `coverage-summary.json`
+ `lcov.info`). Overall: **92.71% statements / 87.63% branches / 90.29%
functions / 92.82% lines** across the public `@tko/*` surface.

That number hides a long tail of low-coverage files concentrated in the
provider stack and a few utils modules. Because TKO is a published low-level
framework with an unknown audience (AGENTS.md "Context for every agent"), gaps
in those layers are the riskiest: they're the substrate every binding sits on
and every consumer hits at startup.

This plan closes the largest gaps first, in order of risk-adjusted return:
small files with simple uncovered branches, then the provider stack, then
DOM utilities. It is a coverage-driven plan, not a redesign — every commit
adds tests, no production code changes unless a test surfaces a real bug
(in which case the fix is a separate commit per AGENTS.md "Always Improve").

## Source of truth

Regenerate with `bun run test:coverage`

- `coverage/coverage-summary.json` — per-file totals (machine-readable)
- `coverage/lcov-report/index.html` — drill-down with uncovered line ranges
- `COVERAGE.md` — committed text snapshot

Refresh before working on this plan: `bun run test:coverage` then re-read the
relevant `coverage/lcov-report/<package>/<file>.ts.html` for exact line numbers.

## Current gaps (snapshot, lines %)

### Per-package (sorted, public `@tko/*` only)

| Package                  | Lines covered |
|--------------------------|---------------|
| `provider`               | 51.22% (21/41)   |
| `provider.attr`          | 69.23% (18/26)   |
| `builder`                | 70.59% (12/17)   |
| `provider.databind`      | 75.00% (6/8)     |
| `utils`                  | 87.48% (601/687) |
| `utils.functionrewrite`  | 88.89% (8/9)     |
| `provider.component`     | 91.11% (41/45)   |
| `binding.foreach`        | 91.48% (204/223) |
| `utils.parser`           | 92.17% (636/690) |
| `binding.template`       | 93.17% (232/249) |
| `lifecycle`              | 93.33% (42/45)   |
| `binding.core`           | 94.16% (387/411) |
| (everything else ≥ 95%)  |                  |

### Worst individual files (lines %, then branches %)

| File | Lines | Branches | Notes |
|------|-------|----------|-------|
| `utils/src/string.ts`                           | 0.00% (0/5)    | n/a    | `parseJson` has no spec |
| `binding.core/src/descendantsComplete.ts`       | 33.33% (1/3)   | 0%     | only the `static override` getter is hit |
| `provider/src/Provider.ts`                      | 43.75% (14/32) | 38.23% | base class branches not exercised |
| `utils/src/dom/info.ts`                         | 61.90% (13/21) | 50.00% | tag/inline-detection branches |
| `utils/src/dom/html.ts`                         | 69.09% (38/55) | 77.19% | parser/insert edge cases |
| `provider.attr/src/AttributeProvider.ts`        | 69.23% (18/26) | 50.00% | namespace + value-fn paths |
| `builder/src/Builder.ts`                        | 70.58% (12/17) | n/a    | options merging branches |
| `utils/src/tasks.ts`                            | 70.83% (34/48) | 64.00% | error/runaway-loop guards |
| `utils/src/dom/event.ts`                        | 75.00% (30/40) | 67.44% | jQuery-vs-native branch |
| `binding.template/src/templateEngine.ts`        | 75.00% (12/16) | 70.00% | template lookup fallbacks |
| `provider.databind/src/DataBindProvider.ts`     | 75.00% (6/8)   | n/a    | error path |
| `provider/src/BindingHandlerObject.ts`          | 77.77% (7/9)   | 66.66% | registration branches |
| `binding.template/src/nativeTemplateEngine.ts`  | 80.00% (8/10)  | n/a    | text-template fallback |
| `binding.core/src/submit.ts`                    | 81.81% (9/11)  | n/a    | non-form / no-handler |
| `binding.core/src/textInput.ts`                 | 83.33% (45/54) | 66.66% | IME / legacy paths |
| `computed/src/proxy.ts`                         | 83.33% (30/36) | 75.00% | proxy fallbacks |
| `observable/src/Subscription.ts`                | 84.61% (11/13) | n/a    | dispose-twice / teardown |

Open `coverage/lcov-report/<pkg>/<file>.ts.html` to see exact uncovered
ranges before writing tests — line numbers above are from the first run and
will drift as tests land.

## Goals (measurable)

- Bring every public `@tko/*` package to **≥ 90% lines** and **≥ 85%
  branches** (target reflects the bar already cleared by 19 of 24 packages).
- No file in a public package below **70% lines** unless a follow-up issue
  documents why (e.g. legacy compat path that needs a real DOM quirk).
- Overall totals: **≥ 95% lines / ≥ 92% branches**.
- `COVERAGE.md` regenerated and committed with the final commit.

Non-goals:
- No new features, no refactors, no public API changes.
- No production code edits unless a test reveals a real bug (separate commit
  per finding, with reproduction).
- No coverage thresholds enforced in CI yet — that's a separate plan once
  the tail is closed (so CI doesn't flap on every drift).

## Approach

Per AGENTS.md "Implementation discipline": each commit adds tests for one
file (or a tight cluster of related files). Keep diffs reviewable. Match the
existing spec style of the package being tested — Chai `expect`, Sinon for
spies/timers, real-DOM fixtures via the existing helpers.

Order by risk × ease:

### Phase 1 — Trivial wins (single small file each)

One commit per file. Each adds a `*.spec.ts` or appends to an existing one,
and re-runs `bun run test:coverage` for that package to confirm the file
hits ≥ 90%.

1. `utils/src/string.ts` — `parseJson`: valid JSON, whitespace-only string,
   non-string input, malformed JSON (throws).
2. `binding.core/src/descendantsComplete.ts` — `onDescendantsComplete` with
   a function value (callback fires with `$element`), with a non-function
   value (no-op), and `allowVirtualElements` getter already hit.
3. `observable/src/Subscription.ts` — disposing twice, disposing during
   notification.
4. `binding.core/src/submit.ts` — non-form element, missing handler,
   `preventDefault` return-true semantics.
5. `provider/src/BindingHandlerObject.ts` — register, override, lookup miss.

### Phase 2 — Provider stack (highest-leverage gap)

The provider package family is the lowest-covered cluster and the most
load-bearing — every binding string flows through it. Cover end-to-end
through the existing provider specs rather than poking internals.

6. `provider/src/Provider.ts` — base-class branches: missing context,
   non-element nodes, multiple handlers per node, error propagation.
7. `provider.attr/src/AttributeProvider.ts` — namespaced attributes,
   value-as-function path, attributes that look like bindings but aren't.
8. `provider.databind/src/DataBindProvider.ts` — malformed `data-bind`
   string error path (currently the only uncovered branch).
9. `provider.component/src/*` — push to ≥ 95% lines (small file count).

### Phase 3 — Builder + binding edges

10. `builder/src/Builder.ts` — options merging (defaults, overrides,
    duplicate handler registration).
11. `binding.template/src/templateEngine.ts` and `nativeTemplateEngine.ts`
    — anonymous template fallback, missing template id, non-element source.
12. `binding.core/src/textInput.ts` — IME composition events, legacy
    propertychange path (covered branches → 85%+; document any path that
    truly needs a real browser quirk we can't replay).

### Phase 4 — DOM + tasks utilities

13. `utils/src/dom/info.ts` — `tagNameLower`, inline-vs-block detection
    branches.
14. `utils/src/dom/html.ts` — `parseHtmlFragment` table/tbody quirks,
    `setHtml` with observable values, empty input.
15. `utils/src/dom/event.ts` — jQuery branch (already imported by spec
    setup) vs native branch (skip jQuery in fixture).
16. `utils/src/tasks.ts` — runaway-loop guard (`MAX_OBSERVABLE_DEPTH`),
    error in scheduled task (rethrow + drain).
17. `utils/src/dom/disposal.ts` — multi-disposer registration,
    disposeNode on detached node.

### Phase 5 — Tail cleanup

18. Walk the remaining files between 85% and 95% lines, add the one or two
    tests each needs to clear 95%. Skip anything that requires a real
    browser quirk we can't reproduce in headless chromium — file a
    follow-up issue and cite the URL in the commit message.

## Files touched

- `packages/<pkg>/spec/**/*.ts` — new or extended spec files (one per
  commit, scoped to the file under test).
- `COVERAGE.md` — regenerated in the final commit of each phase (so the
  history shows the gap closing).

No production code changes expected. If a phase surfaces a real bug, the
fix lands in a **separate commit before the test commit** with its own
adversarial-review audit line.

## Verification

Per commit:
1. `bun run test` — full real-browser matrix passes (authoritative).
2. `bun run test:coverage` — new tests show in the report; targeted file
   hits its phase target.
3. `bun run check` — biome clean.
4. `bunx tsc` — types clean.

Per phase:
- `COVERAGE.md` regenerated and diff reviewed for unexpected regressions
  in unrelated files (a sign a test is leaking state).

Per merge:
- `bun run verify` passes (AGENTS.md "Before you start").

## Adversarial review checklist

Each commit gets an audit line per AGENTS.md "Review Your Own Change
Adversarially". For coverage-fill commits, the second-agent prompt is:
"Here is a new spec file. Find a test that passes by accident, asserts on
the wrong thing, leaks state into other specs, or only exercises a happy
path the production code already handles trivially." Specific failure modes
to probe:

- **Tests that pass without exercising the code** — assertion fires before
  the call under test, or the call is wrapped in a `try` that swallows
  failures.
- **Coverage gamed by `expect(true).to.be.true`** — covers the line, proves
  nothing.
- **Real-DOM fixtures not torn down** — leaks listeners, breaks subsequent
  specs in the same file (visible as flake in `bun run test`).
- **Reliance on test order** — Vitest may parallelize; assertions must not
  depend on prior spec state.
- **Coverage delta claimed but not measured** — re-run `test:coverage` and
  cite the before/after % in the commit message.
- **Backwards-compat surface drift** — if a new test pins behavior in
  `@tko/build.knockout`, confirm it matches the legacy contract, not just
  current TKO behavior.

## Out of scope

- Enforcing coverage thresholds in CI (`coverage.thresholds` in
  `vitest.config.ts`). File once the tail is closed; otherwise the first
  PR after merge will flap.
- Adding coverage to `builds/*` (those are bundles; their specs already
  ride the per-package coverage).
- Switching coverage provider to istanbul. v8 + source maps is working;
  `@vitest/coverage-istanbul` is available as a peer if a future need
  arises.
- Coverage of the `cli-happy-dom` project. The chromium project is
  authoritative; the happy-dom project is additive runtime coverage and
  will be wired into a separate coverage report only if it diverges.
