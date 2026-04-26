# Mocha Test Modernization Reset

## Summary

Restart the test modernization effort from clean `main` with a browser-safe
direction:

- no `bun:test` in repository specs
- convert legacy Jasmine tests to Mocha/Chai/Sinon
- preserve browser execution during the migration
- add Playwright later as the future browser-real integration layer

This reset exists because the Bun-based migration exposed a real constraint:
many TKO specs are shared between local unit work and the current browser test
harness. A runner-specific import like `bun:test` makes those specs diverge
from the environments that still matter for CI and equivalence checks.

## Core Decision

Repository tests should standardize on:

- Mocha for test structure
- Chai for assertions
- Sinon for spies, stubs, and fake timers

Repository tests should not use:

- Jasmine 1.3
- `bun:test`

Playwright remains the future browser-real layer, but it should not be mixed
into the first reset PR.

## Immediate Actions

1. Replace the testing modernization plan language so it is Mocha-first, not
   Bun-first.
2. Remove any Bun-specific testing guidance from `AGENTS.md`.
3. Inventory the Bun-based migration commits and split them into:
   - runner-specific changes to discard or redo
   - useful runner-agnostic changes worth preserving
4. Create a rollback strategy for Bun-specific test infrastructure.
5. Start a clean Mocha conversion series package by package.

## Keep From The Bun Exploration

These ideas or findings are still useful:

- compare each converted package against clean `origin/main`
- review migrations for assertion loss, not just passing counts
- preserve stronger assertions where we improved them
- keep useful runtime modernizations that are independent of the test runner
- keep the lesson that shared specs must continue to run in real browsers until
  Playwright replaces that role
- simplify task scheduling to a modern default: `queueMicrotask`, while
  keeping `options.taskScheduler` as the public override surface

## Drop Or Redo

These should not be carried forward as-is:

- root `bun test` command surface in `package.json`
- `bun:test` imports in repository specs
- Bun-specific preload/helpers used only for Bun execution
- Bun-specific migration notes in plans or AGENTS docs

## Workstreams

### 1. Reset Testing Guidance

- Update `plans/testing-modernization.md` to describe the Mocha-first path.
- Remove Bun references from `AGENTS.md`.
- Make the repo guidance explicit: no new Jasmine, no `bun:test`.

### 2. Undo Bun-Specific Test Runner Changes

- Remove root Bun test scripts from `package.json`.
- Remove Bun-only testing infrastructure if it is not useful for Mocha.
- Keep the repo runnable with the existing Karma browser harness.

### 3. Reconvert Bun-Migrated Specs To Mocha

Rework already-touched spec slices to:

- use Mocha hooks
- use Chai assertions
- use Sinon spies, stubs, and fake timers
- stay runnable in the current browser harness

Likely first rollback/conversion targets:

- `@tko/observable`
- `@tko/computed`
- `@tko/binding.component`
- `@tko/binding.template`
- `@tko/provider.component`
- `@tko/provider.mustache`
- `@tko/binding.if`
- `@tko/binding.foreach`
- `@tko/utils.component`
- `@tko/utils.functionrewrite`
- `@tko/utils` task behavior slice

### 4. Convert Remaining Jasmine Packages

- inventory remaining Jasmine specs and helper dependencies
- convert them package by package
- replace helper idioms like `runs`, `waitsFor`, `this.after`,
  `this.restoreAfter`, and `jasmine.prepareTestNode`

### 5. Add Playwright After The Reset Stabilizes

- add docs and playground verification
- add bundle smoke tests
- add representative browser-real integration flows

## Verification

For each converted package or spec slice:

1. run the package or slice in the current repo test path
2. compare behavior against clean `origin/main`
3. review for assertion loss
4. only then commit

## Recommended PR Sequence

1. testing-direction reset PR
2. Bun-runner rollback PR
3. package conversion PRs
4. Playwright introduction PR
