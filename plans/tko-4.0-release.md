# Plan: TKO 4.0 Release

## Goal

Ship a stable `4.0.0` release of TKO with high confidence in:

- package contents and installability
- test and typecheck coverage
- documentation accuracy for a stable release
- npm trusted publishing and provenance attestations

This plan is intentionally release-operator focused. It is a checklist for
turning the current prerelease line into a verified public release, not a broad
roadmap for future automation work.

---

## Current State

- Release automation already exists in `.github/workflows/release.yml`
- Publishing is configured through Changesets
- The release workflow has `id-token: write`
- Publishing currently runs `npx changeset publish --provenance`
- A publish dry-run workflow exists in `.github/workflows/publish-check.yml`
- The repository is currently clean
- Public packages are still on `4.0.0-beta1.x`
- There are currently no pending `.changeset/*.md` files to drive a stable bump
- The docs site still describes TKO as a prerelease in `tko.io/src/content/docs/index.md`
- Current preferred next step: run one more beta rehearsal release to validate
  trusted publishing and provenance before the final stable `4.0.0` cut

---

## Release Gates

The 4.0 release should not be considered ready until all of the following are
true:

1. A coordinated Changesets release plan exists for the public packages that
   need to move to stable `4.0.0`
2. The docs and agent docs no longer describe the line as prerelease where that
   wording would be misleading after release
3. Build, lint, format, typecheck, and browser test gates are green
4. Package dry-run checks confirm that each public package packs cleanly
5. Trusted publishing has been verified with a real GitHub Actions publish that
   does not silently fall back to a long-lived npm token
6. A published package has a visible provenance attestation on npm
7. Post-publish smoke tests confirm that the stable packages install and run as
   expected

---

## Phase 1: Lock Release Scope

Decide and document the exact shape of the release:

- Is this the actual stable `4.0.0` release, or one final rehearsal release?
- Which packages should publish as stable `4.0.0`?
- Should all public packages move together, or only the primary entry points?
- Are there any packages that should intentionally remain behind the main line?

Because `.changeset/config.json` does not use `fixed` or `linked` groups, this
decision must be explicit. We should not assume every package will land on the
same version unless the Changesets inputs say so.

Deliverable:

- one release plan changeset or a small intentional set of changesets covering
  the exact package version moves

---

## Phase 2: Stable Release Readiness

Before cutting the release:

- Review the open issue and PR queue for anything marked release-blocking
- Confirm `@tko/build.knockout` and `@tko/build.reference` are the recommended
  stable entry points and that the docs reflect that
- Update prerelease wording in:
  - `tko.io/src/content/docs/index.md`
  - `tko.io/src/content/docs/3to4.md`
  - any install snippets or migration notes that still tell users to pin a
    prerelease version
- Update agent-facing docs if the public guidance changed:
  - `tko.io/public/agent-guide.md`
  - `tko.io/public/llms.txt`

Questions to answer during this phase:

- Are there any breaking changes since the last beta that need a prominent
  migration note?
- Are there any deprecated or experimental APIs that should be called out
  before calling the line stable?

Timing note:

- Prepare the stable-wording docs changes before release day, but avoid merging
  them so early that `tko.io` presents TKO as fully stable before the stable
  packages are actually live on npm
- Prefer to land the docs wording as part of the final release sequence or in a
  tightly coordinated same-day merge

---

## Phase 3: Technical Preflight

Run and/or verify the full release gate set:

1. `make`
2. `make test-headless`
3. `make test-headless-jquery`
4. `make test-headless-ff`
5. `make format`
6. `make eslint`
7. `make tsc`
8. publish dry-run workflow

If any failures appear, fix those before the release PR is merged. The release
workflow currently runs `make` and `make test-headless`, but the broader matrix
still matters for release confidence.

Additional preflight checks:

- spot-check `npm pack --dry-run` output for `@tko/build.knockout`
- spot-check `npm pack --dry-run` output for `@tko/build.reference`
- verify changelog/release note output from Changesets is understandable to
  downstream users

---

## Phase 4: Provenance and Trusted Publishing Rehearsal

This is the highest-risk new part of the release because it has not yet been
proven end-to-end.

### Why this needs a rehearsal

The current release workflow still passes `NODE_AUTH_TOKEN` / `NPM_TOKEN` into
the publish step. That means a publish could succeed through token auth even if
OIDC trusted publishing is misconfigured. A green publish alone would therefore
not prove that trusted publishing works.

### Rehearsal objective

Prove that npm trusted publishing works for this repository and workflow, and
that a published package receives a provenance attestation.

### Recommended rehearsal approach

Create a one-off canary publish flow that:

- runs on GitHub-hosted Actions
- uses `id-token: write`
- publishes a disposable prerelease or canary version
- does not provide `NPM_TOKEN` to the publish command

Good candidates:

- publish a canary version of a low-risk package
- publish a `4.0.0-rc` or `4.0.0-canary` tag before the final stable cut

Package-scope note:

- Trusted publisher configuration is expected to be uniform across the release
  set, so this is lower risk than a package-specific packaging issue
- Even so, after the rehearsal succeeds, spot-check the npm package settings for
  the main public entry points and confirm there is no package in the release
  set that was omitted from trusted publishing coverage

### Recommended TKO path: beta provenance rehearsal

For TKO specifically, the safest rehearsal path is:

1. Cut one more beta release such as `4.0.0-beta1.8`
2. Do the prerelease work from a dedicated release branch, not `main`
3. Use Changesets prerelease mode with the `beta` tag
4. Publish from GitHub Actions without `NPM_TOKEN` so OIDC is the only publish
   path

This follows the Changesets prerelease guidance more closely than trying to run
prerelease mode directly from `main`. Changesets explicitly warns that doing
prereleases from the default branch can complicate the repository state and
block other changes until prerelease mode is exited.

### Concrete beta rehearsal flow

On a dedicated prerelease branch:

1. Add the release changeset set for the intended beta release
2. Enter prerelease mode with `npx changeset pre enter beta`
3. Run `npx changeset version`
4. Commit the resulting version and changelog changes, including
   `.changeset/pre.json`
5. Trigger a dedicated GitHub Actions publish workflow from that branch that:
   - runs on a GitHub-hosted runner
   - has `id-token: write`
   - uses a recent enough Node/npm toolchain for trusted publishing
   - does not pass `NPM_TOKEN` / `NODE_AUTH_TOKEN` to the publish command
   - runs `npx changeset publish`

Important note:

- In Changesets prerelease mode, the prerelease tag is used both in the version
  string and as the npm dist-tag, so the beta publish should land under the
  `beta` tag rather than replacing `latest`

After the rehearsal succeeds:

1. Verify the beta package versions and provenance on npm
2. Install the beta in a fresh test project and run smoke tests
3. Exit prerelease mode with `npx changeset pre exit` when ready to prepare the
   stable cut, or discard the prerelease branch if it was only used as a
   rehearsal branch

### Rehearsal verification

After the canary publish:

- confirm the package appears on npm
- confirm npm shows provenance / attestation details for the published version
- install the canary in a fresh test project
- run `npm audit signatures` in that project to confirm attestation verification

### Exit criteria

We only consider provenance verified when:

- the publish succeeded without token fallback
- the package version is visible on npm
- attestation metadata is visible and verifiable

If the rehearsal fails:

- confirm the trusted publisher configuration in npm matches the exact GitHub
  repo and workflow filename
- confirm GitHub-hosted runners are being used
- confirm the workflow still has `id-token: write`
- confirm the npm/node versions used by CI satisfy trusted publishing
  requirements

---

## Phase 5: Final Release Cut

Once the rehearsal and readiness gates pass:

1. Merge the changeset and prepare the release-doc updates for a coordinated
   same-day landing
2. Let Changesets open or update the version PR
3. Review the version PR carefully:
   - every intended stable package appears in the release set
   - package versions are the ones we intended
   - changelog output is readable and accurate
   - any lockfile or generated metadata changes look expected
4. Merge the version PR
5. Land the stable-wording docs changes in a coordinated same-day step if they
   were held back
6. Watch the release workflow through publish completion
7. Watch the docs deployment to ensure stable wording reaches `tko.io`

Release-day checks:

- npm package pages show the expected stable versions
- the `latest` tag points to stable `4.0.0`
- GitHub tags and release metadata are correct
- no package was accidentally skipped or mis-versioned

---

## Phase 6: Post-Release Verification

After publish:

- install `@tko/build.knockout@4.0.0` in a clean sample project
- install `@tko/build.reference@4.0.0` in a clean sample project
- verify basic import/use flows work for both entry points
- confirm docs pages load and no longer present stale prerelease guidance
- verify provenance remains visible on the npm package pages
- announce the release with:
  - headline changes
  - migration guidance
  - preferred starting packages
  - any known limitations

Optional hardening after the first successful trusted publish:

- remove publish-token dependence from the release workflow
- switch npm package settings to require trusted publishing and disallow
  traditional publish tokens where appropriate

---

## Risks

- Stable release docs may lag the published packages and create immediate user
  confusion
- Changesets may version packages unevenly if the release bump is not expressed
  intentionally
- Trusted publishing may appear to work while actually succeeding through token
  fallback
- A package can pass build/test but still have an unexpected packed file set
- `latest` can be pointed incorrectly if publish tagging is not reviewed

---

## Working Checklist

- [ ] Decide whether the next cut is the final stable `4.0.0` or a rehearsal
- [ ] Preferred path: run a `beta` provenance rehearsal before the final stable cut
- [ ] Create the release changeset set for the intended packages
- [ ] Remove or rewrite prerelease wording in the docs
- [ ] Update agent-facing docs if public guidance changed
- [ ] Run build, lint, format, typecheck, and browser test gates
- [ ] Confirm publish dry-run passes
- [ ] Run a token-free trusted publishing rehearsal from GitHub Actions
- [ ] Verify npm provenance/attestation on the rehearsal publish
- [ ] Merge the release inputs to `main`
- [ ] Review and merge the Changesets version PR
- [ ] Confirm every intended stable package appears in the version PR as expected
- [ ] Watch publish and docs deploy complete successfully
- [ ] Smoke-test clean installs of the stable packages
- [ ] Publish release notes and migration guidance

---

## Outcome

After this plan is complete, TKO 4.0 should be a stable release with:

- intentional versioning
- stable-facing documentation
- verified package contents
- verified CI-backed publishing
- verified provenance attestations
- a repeatable release checklist for future maintainers
