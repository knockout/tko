# Testing Modernization Plan

## Summary

Modernize the TKO test stack by migrating the repo toward `bun test` as the
primary test runner, then expanding browser-level confidence with Playwright as
the future-facing real-browser layer.

The immediate problem is not just runner age. The repo currently carries:

- Karma as the browser unit-test harness
- legacy Jasmine tests
- newer Mocha/Chai/Sinon tests
- SauceLabs as an additional execution path

That combination increases maintenance cost, makes the contributor experience
less predictable, and spreads testing conventions across multiple layers.

## Core Direction

The target testing model should be:

- `bun test` for unit and DOM-simulated tests
- Playwright for browser integration, docs, playground, and acceptance tests
- no remaining Jasmine tests once the migration is complete
- no long-term Mocha dependency for the repo test strategy
- SauceLabs only if a clearly justified coverage gap remains after Playwright
- Karma retained only as a temporary compatibility harness during migration
- Bun-migrated tests should target modern JavaScript directly, including native `DisposableStack` and removal of dead legacy compatibility branches
- Shared runtime infrastructure should target modern JavaScript directly too; for example, the task queue should default to `queueMicrotask` and keep `options.taskScheduler` only as an override surface, not as a compatibility matrix

## Goals

- Replace legacy Jasmine coverage with `bun test` over time.
- Avoid investing further in Mocha as a long-term destination.
- Add a first-class Playwright suite for end-to-end browser verification.
- Reduce dependence on SauceLabs where Playwright gives equivalent confidence.
- Make it easier for contributors to know where a test belongs and how to write
  it.

## Non-Goals

- Do not rewrite every existing test file in one pass.
- Do not remove Karma immediately if it still provides necessary temporary
  coverage during migration.
- Do not force Playwright into unit-test roles where it adds more ceremony than
  value.
- Do not drop cross-browser confidence without a replacement.

## Current State

The repo currently uses:

- Karma for package-level browser test execution
- Electron, headless Chrome, and headless Firefox via Karma
- SauceLabs for CI/browser-cloud execution
- Jasmine 1.3 legacy helpers and specs in parts of the tree
- Mocha/Chai/Sinon as the preferred direction for newer tests

This means the repo has both runner fragmentation and test-style fragmentation.
The long-term fix should reduce both, not merely swap one browser harness for
another.

## Proposed Test Taxonomy

### Unit and DOM-Simulated Tests

Use `bun test` for package-level behavior tests and DOM-simulated tests.

These remain focused on:

- observables/computed semantics
- binding handler behavior at the package level
- provider/parser behavior
- component registration/loading contracts
- pure package logic with minimal UI-flow setup
- DOM-oriented behavior that can be validated in a simulated environment

Short-term migration note:

- some tests may need transitional adaptation while they move off Jasmine or
  Karma-specific assumptions

### Integration and Acceptance Tests

Use Playwright for browser-realistic tests that verify:

- docs examples
- playground payloads and compilation
- browser-global bundle smoke tests
- multi-step binding interactions in a real browser
- compatibility-build vs modern-build smoke coverage

These should live separately from package unit specs and act as an acceptance
layer for the repo as a whole.

### Legacy Tests

Jasmine is migration-only.

Policy:

- no new Jasmine tests
- touched Jasmine files should be considered candidates for conversion when the
  surrounding behavior is being actively edited
- helper code that exists only for Jasmine should be tracked for retirement, not
  long-term preservation

Mocha is also transitional.

Policy:

- no new plan assumptions should depend on Mocha as the end state
- existing Mocha tests can remain temporarily, but new migration work should aim
  at `bun test` compatibility

## Workstreams

### 1. Replace Jasmine with `bun test`

- Inventory remaining Jasmine-based specs and helpers.
- Convert Jasmine specs to `bun test` package by package.
- Replace or remove Jasmine-only helper code as packages are migrated.
- Update contributor guidance and AGENTS/docs so new unit tests use `bun test`.
- Add a lightweight check or review rule that rejects new Jasmine-style specs.

Success criteria:

- migrated packages no longer depend on Jasmine-specific helpers
- no new Jasmine tests are added during the migration
- contributors have one default unit-test style to follow

### 2. Move the Unit Layer Toward Bun

- Identify which current Karma tests can move directly to `bun test`.
- Split browser-real tests from pure/unit tests where they are currently mixed.
- Establish only the minimal shared Bun test support needed for DOM globals or similar runtime setup.
- Prefer native Bun APIs and modern language features over compatibility shims in migrated specs.
- Remove dead compatibility branches and stale browser-era guards when Bun migration shows they no longer matter.
- Simplify cross-cutting infrastructure when legacy support is the only reason it remains complex; the task queue is a good example, where a modern default (`queueMicrotask`) is preferable to browser-era fallback logic.
- Add coverage/reporting guidance for the Bun-based suite.

Success criteria:

- a growing share of package-level tests run under `bun test`
- test ownership becomes clearer: unit in Bun, browser acceptance in Playwright
- Karma becomes smaller instead of remaining the default by inertia

### 3. Add a First-Class Playwright Suite

Create a repo-level Playwright test layer for:

- docs site smoke tests
- playground compile/run tests
- build.knockout browser bundle smoke tests
- build.reference browser bundle smoke tests
- selected binding/component integration flows

This suite should be easy to run locally and in CI without requiring SauceLabs.

Success criteria:

- the repo has browser-realistic acceptance coverage outside Karma
- docs/playground regressions can be caught without manual verification only

### 4. Reduce SauceLabs Dependence

Audit what SauceLabs still provides that local/CI Playwright does not.

Likely candidates for replacement:

- Chromium/Firefox/WebKit browser coverage for smoke and interaction flows
- many cross-browser acceptance scenarios currently handled indirectly via Karma

Possible retained reasons:

- a browser/version matrix that Playwright cannot reasonably cover
- a CI environment requirement not met by local browser execution

Success criteria:

- Sauce usage is justified by specific coverage needs, not inertia
- at least part of the current Sauce burden is replaced by Playwright

### 5. Retire or Contain Karma

Once enough unit tests have moved to Bun and Playwright owns acceptance
coverage, reassess whether Karma should remain at all.

Possible outcomes:

- fully retire Karma
- keep Karma only for a small legacy subset during a final migration window
- remove Sauce-integrated Karma paths first, then the remaining local harness

This decision should happen after the earlier phases, not before.

Success criteria:

- Karma is no longer the default testing path for the repo
- if Karma remains temporarily, it has a very small and explicit role
- the long-term path is Bun for tests and Playwright for real browsers

## Candidate Deliverables

- `plans/testing-modernization.md`
- updated contributor guidance in `AGENTS.md` and README sections
- Bun test configuration/helpers as needed
- a repo-level Playwright config and test directory
- CI job(s) for Bun and Playwright coverage
- a Jasmine-inventory document or migration tracker
- optional lint/checks to discourage new Jasmine usage

## Verification

For the modernization work itself:

1. Migrated packages pass under `bun test`
2. New Playwright suite runs headlessly in CI and locally
3. Docs/playground/browser-bundle smoke checks are covered by Playwright
4. New tests added during the migration use the intended framework by default
5. Sauce usage is reviewed against real remaining gaps

## Risks

- Trying to replace Karma, Jasmine, Mocha, and Sauce all at once would create
  too much migration surface area.
- Some Karma-era tests may mix unit and browser concerns and need decomposition
  before they fit cleanly into Bun or Playwright.
- Playwright can add overhead if used for tests that should remain simple unit
  specs.
- Coverage reporting may need separate handling as more verification moves out
  of the Karma pipeline.

## Recommended Order

1. Replace Jasmine with `bun test`
2. Move more package-level tests to Bun
3. Add Playwright acceptance coverage
4. Replace the easiest Sauce-only use cases
5. Retire or contain Karma after the suite is less fragmented

## Outcome

After this plan:

- the repo has one clear long-term test runner for unit work: `bun test`
- browser acceptance testing becomes more realistic and easier to reason about
- SauceLabs is used only where it still adds distinct value
- Karma becomes temporary or disappears entirely
- the long-term testing story is clearer: Bun for tests, Playwright for real browsers
