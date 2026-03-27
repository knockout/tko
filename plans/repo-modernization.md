# Repo Modernization Plan

## Summary

Modernize TKO so the repo communicates a sharper product story, exposes a more
reliable contract surface, teaches the modern authoring model consistently, and
detects documentation drift earlier.

This plan is deliberately broader than a docs cleanup pass. The goal is not
just to make pages read better, but to make the repository easier to understand,
easier to contribute to, and more trustworthy for both humans and agents.

## Core Direction

TKO should present itself as:

- a velocity-first framework built around observables and direct DOM bindings
- a framework with granular DOM updates and low authoring ceremony
- a repo with a recommended path (`@tko/build.reference`) and a compatibility
  path (`@tko/build.knockout`)
- a project whose documentation, examples, and agent guidance are anchored to
  verified behavior instead of legacy assumptions

The compatibility story remains important, but it should stop dominating the
default mental model.

## Goals

- Make the modern TKO path easy to recognize and hard to confuse with the
  compatibility path.
- Strengthen the link between prose docs, verified behaviors, and tests.
- Normalize example quality across bindings, components, observables, and
  computed docs.
- Add repo-level guardrails that catch stale docs, dead links, and contract
  drift earlier.

## Non-Goals

- Do not remove or break `@tko/build.knockout`.
- Do not erase compatibility docs that remain necessary for migrations.
- Do not try to rewrite every package API surface in one pass.
- Do not replace human-authored docs with generated output.

## Workstreams

### 1. Product Positioning

Clarify the top-level story everywhere a reader first encounters TKO.

Key changes:

- Make `@tko/build.reference` the clearly documented modern default.
- Present `@tko/build.knockout` as the compatibility build with explicit
  backwards-compatibility intent.
- Standardize the core contract language and product framing:
  - TKO is velocity-first.
  - observables/computeds are the state layer.
  - TKO binds state directly to the DOM for granular updates.
  - `bindingHandlers` are the bridge between the DOM and observable state.
- Ensure home, migration, component, provider, and agent entry points all tell
  the same story.

Candidate files:

- `tko.io/src/content/docs/index.md`
- `tko.io/src/content/docs/3to4.md`
- `tko.io/public/llms.txt`
- `tko.io/public/agents/guide.md`
- any package/build README or landing docs that position the builds

### 2. Contract Surface

Turn the docs site into a clearer contract layer rather than a loose mix of
legacy prose and examples.

Key changes:

- Keep `verified-behaviors` strictly test-backed.
- Expand package-local `verified-behaviors.json` coverage as packages are
  audited.
- Link human-facing docs to relevant package-level verified behaviors where that
  helps answer “what is actually guaranteed?”
- Use verified behaviors to resolve disagreements between stale prose and
  implementation.
- Keep agent docs short, direct, and aligned with verified behavior.

Candidate files/systems:

- `packages/*/verified-behaviors.json`
- `tko.io/scripts/generate-verified-behaviors.mjs`
- `tko.io/public/agents/verified-behaviors/`
- `tko.io/public/llms.txt`
- `tko.io/public/agents/guide.md`

### 3. Example Quality and Consistency

Establish a clear house style for examples and apply it across the docs.

Example rules:

- observables first
- derived binding values stay observable/computed
- examples should be interactive where interaction is the point
- TSX examples should be shorter than their legacy HTML + JS counterparts where
  practical
- remove stale framework-era noise, including old jQuery, IE, and AMD-era
  habits unless the page is explicitly historical
- keep examples runnable through the playground or through a documented
  zero-infra workflow

Priority areas:

- `tko.io/src/content/docs/bindings/`
- `tko.io/src/content/docs/components/`
- `tko.io/src/content/docs/computed/`
- `tko.io/src/content/docs/observables/`

Related existing work:

- `plans/tsx-doc-examples-rollout.md`

This modernization plan should absorb the example rollout as one of its main
execution tracks rather than leaving it isolated.

### 4. Drift Detection and Maintenance Signals

Make stale docs and contract mismatches easier to detect before review.

Key changes:

- Add checks for dead internal links and old `.html`-style paths where
  applicable.
- Add a docs drift pass for legacy terms that should not reappear casually
  (selected IE, jQuery, AMD, require.js, bower, gulp references).
- Ensure generated agent/verified-behavior output is regenerated during docs
  build and publish.
- Fail loudly when generated artifacts are stale or referenced spec files are
  missing.
- Consider lightweight docs linting for heading structure, duplicate wording
  patterns, and known discouraged phrases.

Candidate systems:

- `tko.io/package.json`
- `tko.io/scripts/`
- CI workflow integration if the checks prove stable

## Execution Plan

### Phase 1. Establish the repo-level narrative

- Update entry-point docs and agent entry points to prefer the modern build, the velocity-first framing, and the direct-DOM contract wording.
- Audit build-selection language for consistency.
- Remove contradictory “default path” messaging.

Success criteria:

- a new reader can tell which build is recommended
- compatibility guidance is still present but clearly framed

### Phase 2. Normalize examples

- Continue the TSX/HTML example work with a shared house style.
- Upgrade weak or static examples where interactivity would teach better.
- Remove leftover outdated examples that imply obsolete browser or library
  assumptions.

Success criteria:

- examples are readable, accurate, and consistently runnable
- TSX examples feel like the modern path instead of a verbose sidecar

### Phase 3. Deepen the contract layer

- Expand `verified-behaviors` package coverage.
- Link relevant docs pages to verified behavior references where useful.
- Tighten agent docs so they route readers toward the right verified behavior
  files quickly.

Success criteria:

- package behavior questions can usually be answered by a package-scoped
  verified-behaviors page
- agent docs stop duplicating broad prose that is better handled elsewhere

### Phase 4. Add maintenance guardrails

- Add automated checks for stale generated files and weak link/path regressions.
- Add targeted linting for common documentation regressions.
- Promote the stable checks into CI once noise is low enough.

Success criteria:

- obvious docs regressions fail early
- generated behavior docs cannot silently drift

## Verification

Use a mix of build, browser, and audit checks:

1. `bun run build` for the docs site
2. headless `playwright-cli` against touched live pages
3. `verified-behaviors` generator run and spot-check output
4. targeted grep/lint passes for discouraged legacy terms and known link shapes
5. package/test cross-checks when updating verified behaviors

## Risks

- Over-correcting toward the modern path could make compatibility users feel
  abandoned if the framing is too abrupt.
- Example normalization can accidentally hide important distinctions if
  everything is over-condensed.
- Verified-behavior expansion can create maintenance overhead if it is not kept
  tightly test-backed and package-local.
- New linting can become noisy if introduced too aggressively.

## Outcomes

After this plan:

- TKO presents a sharper, more modern, velocity-first identity.
- The repo communicates the recommended path clearly.
- Docs and examples become more trustworthy and easier to learn from.
- Agents and humans can both find the contract surface faster.
- Drift between docs, tests, and implementation becomes harder to miss.
