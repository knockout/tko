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

### 1.2 Add branch protection on `main` ✅ DONE

Set via `gh api`. Required checks:
- Require status checks to pass before merging
- Require: `test-headless`, `eslint`, `prettier`, `run-tsc`
- Require branches to be up to date before merging
- Optionally require PR reviews

### 1.3 Add a publish dry-run CI step ✅ DONE

New workflow `.github/workflows/publish-check.yml` that runs on PRs:
- Builds all packages
- Verifies each public package has dist output
- Runs `npm pack --dry-run` on each to validate publishability

---

## Phase 2: Automate Releases

### 2.1 Adopt Changesets for versioning ✅ DONE

Installed `@changesets/cli`. Configuration in `.changeset/config.json`.
Contributors add a changeset file with their PR: `npx changeset add`.
On merge to main, the release workflow opens a "Version Packages" PR
that bumps versions and updates changelogs. Merging that PR publishes
to npm.

### 2.2 Add a release workflow ✅ DONE

`.github/workflows/release.yml` — triggered on push to main:
- Builds all packages and runs tests
- If unreleased changesets exist, opens/updates a version PR
- If version PR is merged, publishes to npm
- Requires `NPM_TOKEN` secret in GitHub repo settings

---

## Phase 3: Dependency & Security Automation

### 3.1 Enable Dependabot ✅ DONE

`.github/dependabot.yml` — weekly updates on Mondays:
- npm dependencies grouped by dev/production (minor+patch batched)
- GitHub Actions versions tracked separately
- Security updates opened individually (ungrouped, default behavior)

### 3.2 Add npm provenance to publishing ✅ DONE

Release workflow publishes with `--provenance` flag so users can verify
packages were built in CI.

### 3.3 Add `npm audit` to CI ✅ DONE

Added `npm audit --audit-level=high` step to `main-build.yml`.
Fails on high or critical vulnerabilities.

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
