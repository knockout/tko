# Plan: Dark-Factory Next Steps (July 2026)

**Status:** proposal — not yet approved for implementation.

**Parent:** [`2026-04-16-dark-factory.md`](2026-04-16-dark-factory.md).

Six months into the dark-factory plan, most of the plumbing is in place:
`bun run verify`, 25 `verified-behaviors.json` contracts (118 statements),
coverage on PRs, single-action release, dependabot with 2-day cooldown,
adversarial-review mandate in `process.md`, root-CHANGELOG dedup wrapper
plan.

The gaps that remain in the parent plan's "What's not there yet" table are
the ones a small OSS team feels most on a busy day: PR review, bundle
size, benchmarks, issue triage, scenario holdouts. This plan proposes a
prioritized cut through those, sized to *low cost / high value* so we
keep earning trust incrementally (parent-plan principle #6).

## Landscape check (mid-2026)

Since the parent plan landed, three concrete tools have matured and are
directly applicable to a small OSS TypeScript framework:

- `anthropics/claude-code-action@v1` — self-hosted Claude Code as a
  GitHub Action, runs autonomous PR review on `pull_request` events.
- `autofix.ci` — GitHub App that pushes Biome/formatter fixes back onto
  PRs. Free for public repos.
- `size-limit` (with `--why`) — bundle-size budgets per entry, blocks
  merge on regression. Battle-tested; TKO's IIFE builds are exactly the
  shape it targets.

Two failure modes cited in recent writeups worth designing around:

- **Test-gaming.** StrongDM found agents happily writing `return true`
  when they could see the tests. Mitigation: keep an authoritative
  scenario set outside the agent's write scope. TKO's
  `verified-behaviors.json` is close but not that — the JSON *and* the
  specs it points to live inside `packages/*` where the coding agent
  reads and writes.
- **Naive reviewers nag.** Anthropic's managed reviewer solves this
  with a verify-pass. A hand-rolled Sonnet reviewer needs the same
  structure or it drowns PRs in false positives.

## Proposed cut (priority order)

### 1. Autonomous PR review via `claude-code-action@v1`

Closes: "Autonomous PR review" gap.

Trigger on `pull_request: [opened, synchronize]`. Restrict to PRs from
`knockout/*` collaborators + Dependabot to avoid abuse from forks.
Anchor the reviewer against `verified-behaviors.json` and the
"Failure modes" checklist in `AGENTS.md`. Follow Anthropic's two-stage
pattern to keep false positives down: **find** pass (list candidate
issues) then **verify** pass (re-check each candidate against the
actual diff / spec output) before it posts a comment. The find/verify
split is what makes the managed reviewer usable at merge cadence.

- ~40 lines of workflow YAML.
- Requires `ANTHROPIC_API_KEY` repo secret.
- Cost: token-metered per PR. Sonnet 4.6 default; can down-tier to
  Haiku 4.5 for the find pass and reserve Sonnet 4.6 for verify.

### 2. Bundle-size gate via `size-limit`

Closes: "Bundle size tracking" gap.

The build already emits `meta/browser_min_meta.json` and
`meta/browser_meta.json` via esbuild's `--metafile` flag — the data is
there, we just don't guard on it. Add a `.size-limit.json` at repo root
covering:

- `builds/knockout/dist/browser.min.js` (backwards-compat surface)
- `builds/reference/dist/browser.min.js` (modern surface)

Both gzipped. Set the initial budget to *current size + a small
tolerance* so the first regression trips the gate. Ship as PR check
via `andresz1/size-limit-action`.

- ~30 lines config + 1 workflow file.
- Free.
- Adversarial note: budgets can rot upward silently as they get
  bumped. Mitigation: any budget bump needs its own changeset entry
  explaining the tradeoff.

### 3. `autofix.ci` for Biome fixes

Closes: no explicit gap, but removes the most common review-round-trip
("unused import", "extra whitespace") entirely — freeing the
autonomous reviewer above to spend its cycles on real findings.

- Install GitHub App on `knockout/tko`.
- 1 workflow file, ~15 lines.
- Free for public repos.

### 4. Holdout scenarios for the coding agent

Closes: "Scenario testing" gap, and directly answers the StrongDM
test-gaming failure mode.

Create `tko.io/public/agents/holdouts/` with a small set of end-to-end
behavioral scenarios that the coding agent is *instructed not to
modify* (via `AGENTS.md`) and that a separate CI job runs against every
PR. Sources for the initial set:

- The Knockout.js example gallery (todos, click counter, cart) —
  timeless, external-facing, easy to hand-derive from public docs.
- Behaviors marked `curated` in `verified-behaviors.json` where the
  spec assertions are trivial to double up in an outside-the-packages
  spec file.

Not perfect isolation — a determined agent can still touch them — but
turning "these files are off-limits" into a documented rule that the
adversarial reviewer checks for closes the exploit for well-intentioned
agents (which is what we have).

- ~20 scenarios + 1 workflow job.
- Cost: real engineering (a day) to curate the initial set.

### 5. Coverage floor + PR delta

Closes: "Coverage confidence" gap.

Coverage already runs and uploads `coverage-summary.json`. Add:

- A `thresholds` block in `vitest.config.ts` coverage config — floor at
  current level (statements ~85%, branches ~75%, whatever `bun run
  test:coverage` currently reports). Fails the run below the floor;
  doesn't force us to keep ratcheting.
- A PR-delta job in `coverage.yml` that downloads the base commit's
  `coverage-data` artifact (the retention is already 30 days, per the
  comment in `coverage.yml`) and posts a comparison table.

- ~40 lines split between two files.

### 6. `vitest bench` for hot paths

Closes: "Benchmarks" gap.

Add `packages/observable/bench/observable.bench.ts`,
`packages/computed/bench/computed.bench.ts`, and one for the
binding-apply hot path in `@tko/bind`. Compare against `main` in CI
via `vitest-bench-action` or hand-rolled artifact comparison.

- Higher up-front cost than the others (need to identify the right
  micro-benchmarks and stabilize them). Defer if capacity is tight.

## Documentation improvements

### `AGENTS.md`

- **Add a "Contracts" subsection** that promotes `verified-behaviors.json`
  from a passing mention to the primary artifact of correctness, matching
  its role in the parent plan and the newly-shipped generator flow. Point
  to the schema and to the generated `/agents/verified-behaviors/` set.
- **Add a "Holdout Scenarios" note** listing the paths the coding agent
  must not modify (once §4 above lands). Currently no place says this.
- **Inline the adversarial-review one-liner** ("when your change touches
  in-scope files, spawn a fresh subagent, brief with diff-only, prompt
  for failure modes"). The full rule lives in `process.md`; a single
  imperative line in `AGENTS.md` removes the round-trip the agent
  currently takes to reload it.

### `.github/copilot-instructions.md`

Currently one line: *"Read and follow the instructions in AGENTS.md"*.
Copilot doesn't consistently follow deep-link redirection into the
repo. Inline the essentials (build/verify commands, verified-behaviors
mandate, "plans-first" rule, backwards-compat rule for
`@tko/build.knockout`) — ~20 lines — so Copilot's context contains what
it needs without a fetch step. Retain the pointer to `AGENTS.md` for
full detail.

### `llms.txt`

- **Add a "Verify" section** with the two commands agents reach for
  most and can't currently find on this page: `bun run verify` at
  repo root, `cd tko.io && bun run build` for docs. Both are named in
  `AGENTS.md`/`process.md` but not on the discovery entry point.
- **Prune Gotchas.** Some entries are dense one-liners that duplicate
  `guide.md`. Keep 3–5 truly non-obvious ones (function-valued
  observable trap, computed-inside-computed leak, binary-attr `||
  undefined`) and defer the rest to `guide.md`. `llms.txt` is a router
  — it earns its tokens by pointing well, not by carrying the payload.

### Consider dropping

- **Managed Claude Code Review** ($15–$25/PR). At Dependabot's PR
  cadence this adds up fast; the self-hosted `claude-code-action` above
  covers the same ground for token cost only.
- **Migration to Renovate.** Dependabot is already configured with
  cooldown + groups + ignore list. Renovate's marginal wins
  (release-notes richness, merge-confidence) aren't worth the
  migration cost here.

## Sequencing

Land in this order. Each row is independently mergeable — the next
row's value stacks on the previous but doesn't require it.

| Order | Item                       | Days | Recurring cost         |
|-------|----------------------------|------|------------------------|
| 1     | `autofix.ci` (§3)          | 0.25 | none                   |
| 2     | `size-limit` gate (§2)     | 0.5  | none                   |
| 3     | `claude-code-action` (§1)  | 1    | tokens per PR          |
| 4     | AGENTS.md / llms.txt docs  | 0.5  | none                   |
| 5     | Coverage floor + delta (§5)| 0.5  | none                   |
| 6     | Holdout scenarios (§4)     | 1–2  | none                   |
| 7     | `vitest bench` (§6)        | 2    | small runner-time      |

Steps 1–4 are the cheap, uncontroversial wins. Step 4 depends on §4's
holdouts landing before the AGENTS.md pointer to them makes sense.
Steps 5–7 are worth doing but can wait if capacity is tight.

## Out of scope

- **AI code generation for feature work.** This plan is about the
  scaffolding that makes agent-produced code trustworthy, not the
  generation itself. The parent plan is explicit that TKO sits between
  L3 and L4 — humans still direct.
- **Coverage 100% target.** Floor-and-hold, not ratchet. Ratcheting
  chases the metric.
- **Cursor / Cline / other agent tooling.** `AGENTS.md` is the shared
  contract; anything more is per-tool cosmetics.

## Adversarial notes (pre-emptive)

- *"size-limit's initial budget will rot."* — Yes, unless bumps go
  through a changeset entry (see §2). Enforce that in the reviewer's
  prompt.
- *"An autonomous reviewer will nag on Dependabot PRs."* — Scope the
  workflow trigger to skip `dependabot[bot]` PRs. Dependency bumps go
  through the existing publish/test/matrix gates; a reviewer that
  hand-writes prose on every dev-dep bump is noise.
- *"Holdout scenarios inside the repo aren't really holdouts."* — True.
  This is a best-effort, well-intentioned-agent mitigation, not
  cryptographic isolation. Documenting the rule + gating on the
  adversarial-reviewer check for "did this PR modify holdouts?" is the
  ceiling we can reach without a separate repo.
- *"claude-code-action is not free."* — Correct. Budget-cap via
  workflow-level token limits and skip on doc-only PRs (path filter).
