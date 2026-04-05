# Plan: Build & Release Certainty with AI/CI

**Goal**: Add certainty to the TKO build and release process so a
time-constrained maintainer can confidently accept contributions and ship
releases without manual verification of every detail.

---

## Original State

- 25-package Lerna monorepo, fully TypeScript, built with esbuild + Make
- ~89% test coverage across 143 test files with Karma
- 7 GitHub Actions workflows (build, test, lint, format, TypeScript, CodeQL, docs deploy)
- ESLint + Prettier enforced on PRs
- Manual release via `lerna version` + `lerna publish`

## Original Gaps

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
- After a successful publish, creates the matching GitHub Release and tag in the same workflow
- Uses npm trusted publishing via GitHub Actions OIDC
- Requires trusted publisher configuration for the public `@tko/*` packages on npm
- Includes a manual `github-release.yml` workflow to backfill a missing release/tag for a published `main` commit if GitHub release creation ever needs a retry after publish

---

## Phase 3: Dependency & Security Automation

### 3.1 Enable Dependabot ✅ DONE

`.github/dependabot.yml` — weekly updates on Mondays:
- npm dependencies grouped by dev/production (minor+patch batched)
- GitHub Actions versions tracked separately
- Security updates opened individually (ungrouped, default behavior)

### 3.2 Add npm provenance to publishing ✅ DONE

When publishing through npm trusted publishing from GitHub Actions, npm
automatically emits provenance attestations for public packages.

### 3.3 Add `npm audit` to CI ✅ DONE

Added `npm audit --audit-level=high` step to `main-build.yml`.
Fails on high or critical vulnerabilities.

---

## Phase 4: AI-Assisted Contribution Pipeline

### 4.1 AI-assisted PR review ✅ DONE

- **CodeRabbit**: Already enabled on the repo for automated PR review
- **GitHub Copilot**: Enable in repo settings for AI code suggestions
- Added `.github/copilot-instructions.md` pointing to AGENTS.md

### 4.2 Issue-to-PR automation

Label issues with `ai-candidate` to signal that an AI agent can:
- Pick up the issue
- Create a branch
- Implement the fix/feature
- Open a PR for human review

This can be done with Copilot Workspace, Claude Code, or similar tools
as they mature. No workflow needed yet — the AGENTS.md context file
is the key enabler.

### 4.3 Contributor sandbox ✅ DONE

Updated `.devcontainer/devcontainer.json` to:
- Build from the existing Dockerfile (no pre-built image required)
- Auto-run `npm install && make` on creation
- Include ESLint and Prettier VS Code extensions
- Works with GitHub Codespaces out of the box

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
