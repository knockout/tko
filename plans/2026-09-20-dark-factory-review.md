# Dark-Factory Review — 2026-09-20

Periodic review of TKO's progress toward the dark factory
([`plans/2026-04-16-dark-factory.md`](2026-04-16-dark-factory.md)):
what shipped, what the outside world did since April, and the next
high-value / low-cost increments. This is a scheduled advisory doc,
not an implementation plan — each recommended step below should get
its own plan (or issue) when picked up.

## External signal since the April plan

- **GitHub Agentic Workflows** (technical preview 2026-02-13, so it
  narrowly predates the April plan; public preview June 2026):
  intent authored in Markdown, compiled by `gh aw` into Actions YAML,
  executed by a coding agent (Copilot, Claude Code, Codex) with
  read-only default access and "safe outputs" for writes. GitHub
  brands the category **Continuous AI** — triage, docs, test
  improvement, CI troubleshooting running alongside CI/CD. This is
  off-the-shelf infrastructure for two of our open gaps (issue
  triage, autonomous PR review).
- **`anthropics/claude-code-action`** is the mature primitive for
  running an agent per PR/issue event inside a standard runner.
- **StrongDM's factory** remains the reference case. Willison's
  distillation: the two load-bearing ideas are (1) agents reliable
  over long horizons, (2) **scenarios as holdout sets, external to
  the code the agents produce**. Our verified-behaviors files are
  contracts, but they live in-repo and in-context; nothing in TKO is
  currently *holdout*.
- Consensus positioning: most teams sit at levels 2–3; level 5 is
  viable for scoped, well-defined problem spaces — which a
  zero-dependency MVVM framework with a frozen legacy surface
  arguably is.

## Scorecard vs. the April gap table

| Gap (April plan) | Status (Sept 2026) |
|---|---|
| Dependency updates | ✅ Dependabot weekly, 2-day cooldown, grouped minor/patch |
| Release automation | ✅ Single-action release, OIDC trusted publishing. (Changelog dedup — `plans/changelog-dark-factory.md` — is planned, **not shipped**: `.changeset/config.json` still uses the stock generator) |
| Copilot/Cursor support | ✅ `.github/copilot-instructions.md` → AGENTS.md |
| Coverage confidence | 🟡 `coverage.yml` informational; closed loop (PR delta + gate) tracked in #379 |
| Autonomous PR review | 🟡 Adversarial-review process rule exists but is honor-system: since the rule landed (2026-04-20), 29 of ~130 non-merge commits touching in-scope paths carry an audit line (~22%); no repo-level agent reviewer |
| Bundle size tracking | ❌ Not started |
| Benchmarks | ❌ Not started |
| Issue triage | ❌ Not started (live candidates: #414, #410, #401) |
| Scenario testing | ❌ Not started |

Also true but untracked: `bun run knip` is in scripts and AGENTS.md
but runs in **no CI workflow** (blocked-ish on #366 warning cleanup).

## Recommended next increments (ranked by value ÷ cost)

1. **Close the coverage loop (#379).** The artifacts (30-day
   `coverage-data` uploads) were designed for this. A small job that
   downloads the base commit's summary, computes the delta, posts a
   PR comment, and fails on regression converts an informational
   signal into a gate. Highest leverage per line of YAML.
2. **Bundle-size check.** Build `builds/*/dist/browser.min.js` on PR
   and against the merge base; report bytes + gzip delta in the job
   summary (informational first, gate later — same maturation path as
   coverage). For a framework judged on footprint this is core
   signal, and it's an afternoon of work with no new dependencies.
3. **Enforce the adversarial-review audit line.** The process rule is
   only verifiable if something checks it. A small PR workflow:
   for **each non-merge commit** whose diff touches in-scope paths
   (per AGENTS.md's list — `packages/`, `builds/`, `tko.io/public/`,
   `AGENTS.md`, `llms.txt`, `.github/workflows/`, `tools/`,
   `.changeset/`, `vitest.config.ts`, `biome.json`), require that
   commit's message to match `Adversarial pass:` — per-commit, not
   per-PR, because process.md explicitly forbids batching audit
   lines. Cheap, dumb, and converts an honor-system rule into a
   checked invariant. (Compliance since the rule landed is ~22%; see
   scorecard.)
4. **Agent PR reviewer.** Add a `claude-code-action` (or GitHub
   Agentic Workflow) review job briefed with AGENTS.md's
   failure-modes list + the touched packages' `verified-behaviors.json`,
   asked only "where is this wrong?". This is the repo-level
   counterpart of the per-session adversarial pass — it also reviews
   human PRs and Dependabot PRs, which today get no adversarial pass
   at all.
5. **Issue-triage workflow.** On `issues: opened`: attempt to
   reproduce as a failing spec, label, and attach the repro branch.
   Read-only + safe-outputs default makes this low-risk. Pilot it
   retroactively on #414 / #410 / #401 — three open bugs that each
   want a failing spec before a fix.
6. **`vitest bench` for hot paths.** Observable read/write, computed
   dependency tracking, `applyBindings` over a large foreach.
   Informational job on PR, compare against base. Guards the perf
   failure mode AGENTS.md already names but nothing measures.
7. **Scenario/holdout suite.** The honest version for a public repo:
   consumer-perspective scenarios (an app built against the published
   `tko` bundle, exercised end-to-end) in a directory agents are
   instructed not to edit in the same PR as implementation, enforced
   by a path check. True holdout secrecy is impossible in public;
   the value here is the *external consumer perspective*, testing the
   built artifact rather than the source graph.
8. **Publish-surface checks (#403).** `attw` + `publint` in
   `publish-check.yml`; pairs with the d.ts work (#384).
9. **knip in CI.** After (or alongside) #366: add a knip step to
   `lint-and-typecheck.yml`, and fold it into `bun run verify` so the
   local gate and CI agree.
10. **Ship the changelog dedup** already designed in
   [`changelog-dark-factory.md`](changelog-dark-factory.md) — the
   plan is fully worked out but nothing has landed
   (`.changeset/config.json` is stock, root `CHANGELOG.md` ends at
   4.0.1 while packages are at 4.1.1).

Issue numbers above (#379, #414, #410, #401, #366, #403, #384) were
verified against the live GitHub issue list on 2026-09-20.

## Guidance (AGENTS.md / llms.txt / process.md) findings

Fixed in this commit:

- AGENTS.md CI table was stale: missing `build-and-test.yml` (the
  reusable core) and `coverage.yml`; `test-headless.yml` row said
  "Chrome, Firefox, jQuery" (actual: chromium/firefox/webkit +
  happy-dom); `main-build.yml` row claimed an audit step it doesn't
  run.
- Package count (26 → 25) and "npm workspaces" → "Bun workspaces".
- Testing section said "headless Chromium" while describing a
  three-browser CI matrix four lines later; now distinguishes local
  default (chromium) from the CI matrix.
- `tools/` structure comment named only `build.ts`; three other
  CI-load-bearing scripts live there.
- Agent-facing file inventory listed 4 of the 9 files llms.txt
  indexes; now matches, with llms.txt named as the canonical index.

Suggested, not done here:

- **Doc-drift is the recurring failure.** The CI table drifted
  because it duplicates facts the workflows already state. Either
  trim the table to workflow names + one-liners, or add a checklist
  item to process.md: "changed `.github/workflows/`? update the
  AGENTS.md table in the same PR."
- **`bun run verify` ≠ CI, today.** The invariant "verify passing
  locally ⇒ CI green" is what lets an agent trust local feedback,
  and it is already false: `verify` ends in `bunx vitest run`, which
  defaults to chromium only, while CI runs the firefox + webkit
  matrix and a publish dry-run that `verify` never exercises. Either
  document the gap in AGENTS.md or close it (e.g. a `verify:full`
  that matches CI), and keep the invariant in mind as coverage/knip
  gates are added.
- **plans/ naming.** `changelog-dark-factory.md` and
  `single-action-release.md` violate the documented
  `YYYY-MM-DD-<slug>.md` convention that keeps `ls plans/`
  chronological. Nothing links to them by filename, so renaming is
  safe. Relatedly: this review doc is itself not an implementation
  plan (precedent: neither is `2026-04-16-dark-factory.md`, a vision
  doc). If scheduled reviews recur, move them to `plans/reviews/` so
  `ls plans/` stays a list of plans.
- **llms.txt** could eventually point at a single-file answer to
  "what landed in vX.Y.Z" — but only after the changelog-dedup plan
  ships *and* the root changelog is published at a site path llms.txt
  can reference (everything in llms.txt is site-absolute; root
  `CHANGELOG.md` is not served by tko.io today, and it currently
  stops at 4.0.1). Premature to add now.
- **Audit-line rule needs teeth** — see increment 3 above; a process
  rule that ~22% of in-scope commits follow is a suggestion, not a
  contract.

## References

- [GitHub Agentic Workflows announcement](https://github.blog/ai-and-ml/automate-repository-tasks-with-github-agentic-workflows/)
- [GitHub Agentic Workflows docs](https://github.github.com/gh-aw/)
- [InfoQ on Agentic Workflows](https://www.infoq.com/news/2026/02/github-agentic-workflows/)
- [Willison — An AI State of the Union](https://www.lennysnewsletter.com/p/an-ai-state-of-the-union)
- [Willison — StrongDM's Software Factory](https://simonwillison.net/2026/Feb/7/software-factory/)
