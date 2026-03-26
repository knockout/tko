# Plan: Build & Release Certainty with AI/CI

**Goal**: Add certainty to the TKO build and release process so a
time-constrained maintainer can confidently accept contributions and ship
releases without manual verification of every detail.

---

## Current State

- 25-package Lerna monorepo, fully TypeScript, built with esbuild + Make
- ~89% test coverage across 143 test files with Karma
- 7 GitHub Actions workflows (build, test, lint, format, TypeScript, CodeQL, docs deploy)
- ESLint + Prettier enforced on PRs
- Manual release via `lerna version` + `lerna publish`

## Gaps

| Area | Risk |
|------|------|
| Release process | Fully manual — easy to forget steps, publish wrong versions, or skip tests |
| No AGENTS.md / CLAUDE.md | AI agents can't safely contribute without project context |
| No changesets/changelog automation | Hard for contributors to document what changed |
| No branch protection rules | PRs could be merged without passing CI |
| No dependency update automation | Dependencies drift, security vulns accumulate |
| Mixed test frameworks | Jasmine/Mocha split creates confusion for contributors |
| No publish dry-run in CI | Build could pass but publish could fail |
| SauceLabs disabled | Cross-browser coverage gap |

---

## Phase 1: Low-Effort, High-Impact

### 1.1 Add AGENTS.md + CLAUDE.md ✅ DONE

A project-level `AGENTS.md` that tells AI agents and contributors how to work
on this repo: build commands, test commands, package structure, conventions,
what not to touch. `CLAUDE.md` is a thin pointer to it. Other AI tool config
files (`.github/copilot-instructions.md`, `.cursorrules`) can point there too.

### 1.2 Add branch protection on `main`

GitHub settings change (no code needed):
- Require status checks to pass before merging
- Require: `test-headless`, `eslint`, `prettier`, `run-tsc`
- Require branches to be up to date before merging
- Optionally require PR reviews

### 1.3 Add a publish dry-run CI step

New workflow `.github/workflows/publish-check.yml` that runs on PRs:
- Builds all packages
- Runs `lerna publish from-package --dry-run` to catch packaging issues
- Validates that package.json exports and dist files are correct

---

## Phase 2: Automate Releases

### 2.1 Adopt Changesets for versioning

Replace manual `lerna version` with `@changesets/cli`:
- Contributors add a changeset file with their PR describing the change
- On merge to main, a bot opens a "Release" PR that bumps versions and
  updates CHANGELOG.md
- Merging that PR publishes to npm

Benefits:
- Auto-generated changelogs
- Contributor-authored release notes
- One-click publishing (merge the release PR)
- No version mistakes

### 2.2 Add a release workflow

GitHub Action triggered on changeset release PR merge:
- Builds all packages
- Runs full test suite
- Publishes to npm with `--provenance`
- Creates GitHub Release with changelog

---

## Phase 3: Dependency & Security Automation

### 3.1 Enable Dependabot or Renovate

Auto-PRs for dependency updates:
- Security patches: daily
- devDependencies: weekly, grouped
- CI runs tests on these PRs automatically — if green, safe to merge

### 3.2 Add npm provenance to publishing

Publish with `--provenance` flag so users can verify packages were built in
CI, not on a local machine. Builds trust with consumers.

### 3.3 Add `npm audit` to CI

New step in the main build workflow that fails on known vulnerabilities.

---

## Phase 4: AI-Assisted Contribution Pipeline

### 4.1 AI-assisted PR review

GitHub Action triggered on PR open/update that runs an AI review step:
- Checks for breaking API changes
- Flags missing tests for new code
- Validates consistency with project conventions
- Notes if documentation updates are needed

### 4.2 Issue-to-PR automation

Label issues with `ai-candidate` to signal that an AI agent can:
- Pick up the issue
- Create a branch
- Implement the fix/feature
- Open a PR for human review

### 4.3 Contributor sandbox

Enhance the existing `.devcontainer` config + enable GitHub Codespaces so
contributors can spin up a working environment in seconds without local setup.

---

## Outcome

| Before | After |
|--------|-------|
| Manual release, easy to mess up | One-click release via PR merge |
| Hope CI catches things | CI *must* pass before merge |
| No changelog discipline | Auto-generated from changesets |
| Dependencies drift silently | Auto-PRs with test validation |
| Contributors need deep project knowledge | AGENTS.md guides AI and humans |
| Maintainer reviews everything manually | AI pre-reviews, maintainer approves |
