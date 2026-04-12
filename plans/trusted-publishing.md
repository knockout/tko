# Plan: Trusted Publishing for npm Releases

**Risk class:** HIGH

**Goal**: Move TKO npm publishing from long-lived `NPM_TOKEN` authentication to
npm trusted publishing via GitHub Actions OIDC.

---

## Current State

- `.github/workflows/release.yml` already grants `id-token: write`
- Releases still document and use `NPM_TOKEN`
- Workflow publishes through `changesets/action`
- Current workflow uses Node 22, but npm trusted publishing now requires
  npm CLI `11.5.1+`

## Desired State

- Release publishing works from GitHub-hosted runners without a write token
- The workflow uses a Node/npm combination compatible with npm trusted publishing
- Release docs no longer tell maintainers to configure `NPM_TOKEN`
- The migration path notes the remaining manual npm-side setup:
  trusted publisher registration and token revocation after verification

## Implementation

### 1. Workflow

- Update the release workflow to use a trusted-publisher-compatible Node version
- Split version-PR automation from npm publishing so the publish job can run
  with read-only repository permissions plus OIDC
- Switch CI dependency installation to `npm ci` for lockfile-enforced releases
- Pin third-party GitHub Actions by commit SHA
- Remove publish-time `NPM_TOKEN` / `NODE_AUTH_TOKEN` env wiring
- Keep `id-token: write`
- Keep Changesets for release PR creation
- Drop explicit `--provenance` because npm generates provenance automatically
  during trusted publishing

### Why split prepare vs publish

Many Changesets-based repositories keep release-PR creation and npm publishing
in one job. That is simpler, but it forces the publish path to carry both
repository write access and package-publish credentials at the same time.

For TKO, the split is intentional:

- `prepare-release` needs repository write permissions to open/update the
  version PR branch
- `publish` only needs `contents: read` plus `id-token: write` for npm OIDC
- this keeps the npm publish path on least privilege while preserving the
  standard Changesets PR flow on `main`

This is a better fit for trusted publishing than the default single-job
Changesets pattern.

### 2. Repository docs

- Update the build/release plan to describe trusted publishing instead of
  token-based publishing
- Update the README release guidance so maintainers do not follow the old
  `lerna publish` path

### 3. Follow-up outside the repo

- Configure trusted publishers for the public `@tko/*` packages on npm
- Verify one publish from GitHub Actions
- After verification, disable token-based publishing for those packages and
  revoke unneeded automation tokens

## Verification

- Review `.github/workflows/release.yml` for OIDC-only publish auth
- Confirm no remaining repo docs require `NPM_TOKEN` for publishing
- Confirm the workflow now targets a Node/npm version that meets npm trusted
  publishing requirements

## AI Evidence
- Risk class: HIGH
- Changes and steps: update `release.yml` to use OIDC trusted publishing, upgrade Node to 24.x, remove `NPM_TOKEN` references from docs and workflow
- Tools/commands: review workflow YAML, `make test-headless`, manual dry-run via `npm publish --dry-run`
- Validation: `release.yml` grants only `id-token: write`, no `NPM_TOKEN` secret referenced, workflow runs `npm publish` via OIDC on tag push
- Follow-up owner: TKO maintainers (npm trusted publisher configuration on npmjs.com)
