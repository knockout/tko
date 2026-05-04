# Plan: Single-Action Release

**Goal**: Reduce the TKO release flow from a multi-step manual dance (tag,
wait, hand-open PR, merge, force-tag, wait) to a single human action — merge
the auto-generated version PR. Everything else runs unattended.

This is a Dark Factory plan: the maintainer's job is direction, not
choreography.

---

## Original State (May 2026)

`release.yml` triggers on `push: tags: v*`. The intended flow is:

1. Maintainer pushes `vX.Y.Z` tag.
2. `prepare-release` runs `changesets/action@v1`. If there are pending
   changesets, it commits version bumps to a branch and opens a "chore:
   version packages" PR.
3. Maintainer reviews and merges that PR.
4. Maintainer force-moves the tag to the merged commit and re-pushes.
5. `prepare-release` re-runs, sees no changesets, gates in the `publish`
   job. `changeset publish` runs to npm via OIDC.
6. `github-release` creates the matching GitHub Release.

### What actually happened on the 4.1.0 cut

- Step 2 produced the bumped branch `changeset-release/refs/tags/v4.1.0`
  but **did not open a PR**. `changesets/action@v1` was designed for
  `push: branches` triggers; under tag-push it can produce the branch and
  silently skip PR creation. The branch name itself leaks the tag ref
  (`changeset-release/refs/tags/v4.1.0` instead of the usual
  `changeset-release/main`), which is the symptom.
- A human had to hand-open the PR (#372) wrapping the bot-generated
  branch.
- Step 4's force-push tag is a footgun — easy to forget to `git pull`
  first and tag the wrong commit.

## Pain points

| Current step | Time/risk cost |
|---|---|
| Push initial tag | Trivial, but obscures intent ("am I starting a release or testing CI?") |
| Wait for action to maybe-open a PR | Action is flaky under tag triggers (see above) |
| Hand-open the PR if action skipped | Pure admin |
| Merge PR | Necessary (review + click) |
| Force-move tag, re-push | Footgun: must be on merge commit |
| Wait for second workflow run | Pure latency |

Four of six steps are admin or latency. The one with maintainer
judgment (review + merge) is buried.

---

## Target State

**Trigger**: `push: branches: [main]`.

**Flow**:
1. Feature PR with a changeset merges to `main`.
2. `release.yml` runs:
   - Pending changesets exist → `changesets/action` opens or updates the
     "chore: version packages" PR. Done.
3. Maintainer accumulates PRs over time. When ready to release, **merges
   the version PR**.
4. `release.yml` re-runs:
   - No pending changesets → `publish-and-tag` job runs. `changeset publish`
     publishes per-package versions on npm via OIDC, then a post-publish
     step creates a single repo-wide `vX.Y.Z` tag and a matching GitHub
     Release.

**Single human action: merge the version PR.** Everything before and
after is automation.

---

## Mechanism

### `release.yml` changes

Two-job design preserves least-privilege isolation: `prepare` only needs
PR-write to open/update the version PR (no OIDC); `publish-and-tag` only
needs OIDC and contents-write (no PR-write). They communicate via a
single output (`should_publish`).

```yaml
on:
  push:
    branches: [main]

# Serialize releases against themselves so two near-simultaneous main
# pushes (e.g. version-PR merge + a doc PR merge) cannot race two
# parallel publishes or tag creations.
concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  prepare:
    name: Open or update version PR
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    outputs:
      should_publish: ${{ steps.changesets.outputs.hasChangesets == 'false' }}
    steps:
      - uses: actions/checkout@v6
        with:
          # changesets/action commits version bumps via the GitHub API
          # (commitMode: github-api) so we deliberately disable persisted
          # credentials — there is no `git push` from this job.
          persist-credentials: false

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version-file: .tool-versions

      - uses: actions/setup-node@v6
        with:
          node-version: 24.x
          registry-url: 'https://registry.npmjs.org'

      - run: bun install --frozen-lockfile

      - name: Open or update version PR
        id: changesets
        uses: changesets/action@v1
        with:
          version: npx changeset version
          title: 'chore: version packages'
          commit: 'chore: version packages'
          # Required when persist-credentials: false — without this the
          # action falls back to git-cli, which has no remote auth and
          # fails the push. github-api also produces a verified commit
          # authored by github-actions[bot].
          commitMode: github-api
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  publish-and-tag:
    name: Publish to npm + tag repo
    needs: prepare
    if: needs.prepare.outputs.should_publish == 'true'
    runs-on: ubuntu-latest
    permissions:
      # contents:write is required to push the repo-wide vX.Y.Z tag.
      # PRs are not modified from this job.
      contents: write
      id-token: write       # npm OIDC trusted publishing
    steps:
      - uses: actions/checkout@v6
        # persist-credentials defaults to true, which is required for the
        # post-publish `git push origin "$tag"`.

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version-file: .tool-versions

      - uses: actions/setup-node@v6
        with:
          # npm trusted publishing requires npm CLI 11.5.1+
          node-version: 24.x
          registry-url: 'https://registry.npmjs.org'

      - run: bun install --frozen-lockfile

      # Build is gated on the publish path so doc-only / plan-only main
      # pushes do not pay the cost.
      - run: bun run build

      # Tests run before publish so a regression caught only in the
      # browser matrix cannot ship to npm. main-build.yml is parallel,
      # not a gate; this is the gate.
      - run: bun run test

      - name: Determine release version
        id: version
        run: |
          version="$(node tools/release-version.cjs)"
          echo "version=$version" >> "$GITHUB_OUTPUT"

      - name: Publish packages
        # changeset publish creates per-package git tags by default
        # (e.g. @tko/utils@4.1.0). With the .changeset/config.json
        # `fixed` group all 27 @tko/* packages share one version, so the
        # per-package tags carry no information beyond the repo-wide
        # vX.Y.Z. We suppress them via --no-git-tag and rely solely on
        # the post-publish step below for the single tag.
        run: npx changeset publish --no-git-tag

      # Order: create GH release first via a single API call that also
      # creates the tag ref, then verify. This avoids the failure mode
      # where `git tag && git push` succeeds and the subsequent
      # `gh release create` fails, leaving an orphan tag. `gh release
      # create` errors if the tag already exists, which is itself a
      # guard against the "no-changeset push to main" re-publish case
      # (changeset publish would no-op against npm; this step refuses
      # to re-tag).
      - name: Create GitHub release
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          VERSION: ${{ steps.version.outputs.version }}
          TARGET_SHA: ${{ github.sha }}
        run: |
          tag="v${VERSION}"
          # Tighten prerelease matching: only match canonical pre-release
          # suffixes anchored after the final hyphen, not substrings.
          prerelease_flag=""
          case "$VERSION" in
            *-alpha|*-alpha.*|*-beta|*-beta.*|*-rc|*-rc.*)
              prerelease_flag="--prerelease"
              ;;
          esac
          gh release create "$tag" \
            --repo "$GITHUB_REPOSITORY" \
            --target "$TARGET_SHA" \
            --title "TKO ${VERSION}" \
            --generate-notes \
            $prerelease_flag
```

Key shape changes from current `release.yml`:

- **Trigger** flips from `push: tags: v*` to `push: branches: [main]`.
- **Two jobs** instead of three (`prepare-release` / `publish` /
  `github-release` → `prepare` / `publish-and-tag`).
- **`prepare` keeps least-privilege** — only `contents:write` +
  `pull-requests:write`, never holds OIDC.
- **`publish-and-tag` keeps OIDC** but never gets PR-write.
- **No tag-driven entry point.** The repo-wide `vX.Y.Z` tag is created
  by a single `gh release create` call that creates both the release
  and the underlying tag ref, by reading the bumped version from
  `tools/release-version.cjs`.
- **`changesets/action` runs only the `version` path.** Publish is
  invoked explicitly by the second job, so we have control over what
  runs between version-bump and publish (build, test, version
  read-back).

### Removed pieces

- Force-pushed tag dance — gone.
- Tag-vs-version validation step — gone for *tag typos* (the tag is
  generated from the version). The same validator was also catching
  `tools/release-version.cjs` errors when public-package versions
  drift; that error path is preserved because `release-version.cjs`
  still runs in the `Determine release version` step and exits non-zero
  on drift.
- Separate `prepare-release` / `publish` / `github-release` jobs —
  collapsed into two.

### Kept pieces

- npm trusted publishing via OIDC (`id-token: write` on
  `publish-and-tag`).
- `github-release.yml` as a manual fallback to backfill a release that
  the post-publish step missed (rare, but worth keeping).
- `publish-check.yml` on PRs (validates packages are publishable before
  they hit main). **Caveat**: PRs opened by `changesets/action` use
  `GITHUB_TOKEN`, and GitHub by default does not trigger
  `pull_request` workflows on PRs authored by `GITHUB_TOKEN`. The
  version PR will therefore not run `publish-check.yml` on its own. We
  accept this — the version PR's diff is mechanical (changeset bumps
  + changelog appends) and the publish path itself runs the same
  validation. If we want triggers, switch the action's token to a
  scoped GitHub App / PAT.

### Failure modes

- **Partial publish.** `changeset publish` publishes packages
  serially. If one of 27 fails mid-loop, npm has a partial release and
  the workflow exits non-zero before the tag step runs — no tag, no GH
  release. Recovery: re-run the workflow (already-published packages
  are skipped by `changeset publish`); the tag step then runs once the
  full set succeeds. If the partial state is unrecoverable (e.g. a
  yanked-then-rebumped version is required), `github-release.yml`
  remains the manual backfill.
- **Tag/release dual-failure.** `gh release create` creates the tag
  ref atomically with the release, so the previous "tag exists,
  release missing" failure mode is closed. If `gh release create`
  fails entirely, no tag exists either; rerun.
- **Doc-only main pushes.** Every merge to `main` invokes `prepare`,
  including doc-only or plan-only PRs. `prepare` runs `bun install
  --frozen-lockfile` plus the changesets call (~1–3 min cold; faster
  with cache, not added in this plan). Only the `publish-and-tag` job
  — gated on `should_publish == 'true'` — pays the build/test cost.
  The concurrency block also queues a doc-only push behind any
  in-flight `publish-and-tag` for the same ref; doc-only latency
  during a release window is the price of serialization.
- **No-changeset main push triggers `publish-and-tag`.** If a
  maintainer pushes directly to `main` without a changeset (or merges
  a no-changeset PR), `prepare` reports `hasChangesets == 'false'` and
  the publish job runs. `changeset publish` is a no-op against npm
  (already-published versions skip), and `gh release create` refuses
  to overwrite an existing tag, so the worst case is a noisy failed
  workflow run. No data loss; review the run, ignore.

---

## Tradeoffs

- **No more "I tag when I want to release."** The maintainer decides via
  PR merge, not via tag push. This is the canonical changesets pattern
  and arguably clearer — "I merge the version PR" is one action with
  visible review surface.
- **Releases batch by version-PR cadence.** Multiple feature PRs land,
  each adding a changeset, all accumulate in the version PR. Maintainer
  merges when the batch feels release-worthy. Still gives full control
  over timing.
- **The version PR auto-updates on every main push.** Each new merged
  changeset rebumps it. Maintainers can preview the next release at any
  time by reading the open PR.
- **`prepare` job runs on every main push, including doc-only.**
  ~1–3 min cold install + changesets call. Non-zero CI minutes plus
  queueing latency under concurrency. Accepted; see Failure modes
  above. A future PR can add `actions/cache` over `~/.bun` and
  `node_modules` to cut this further.
- **Per-package npm tags retained, per-package git tags suppressed.**
  npm dist-tags (`@tko/utils@4.1.0`) are how consumers install; they
  stay. Per-package git tags add noise without information given the
  fixed group; `--no-git-tag` removes them.
- **Bot version PR does not run `publish-check.yml`.** See *Kept
  pieces* caveat. Acceptable trade because the change is mechanical.
  Cheaper alternatives to a scoped App/PAT exist if we want PR-time
  validation: switch the workflow to `pull_request_target` (fires for
  bot-authored PRs, but runs against the *base* ref with elevated
  perms — only safe because the version PR is bot-generated, not a
  fork PR), or trigger `publish-check.yml` on `push` to the
  `changeset-release/main` branch.

---

## Phasing

The plan-only PR (#373) is the proposal and ships first so reviewers
can argue with the design without YAML to wade through. The
implementation PR ships the `release.yml` rewrite + AGENTS.md update
**together** so the running workflow and the documented procedure
never disagree.

Between merge of #373 and merge of the implementation PR, AGENTS.md
§ Release Process still describes the tag-push flow — that's
intentional: AGENTS.md describes the *current* workflow, not the
planned one. Plans live in `plans/`.

1. **Land plan** (this PR, #373) — proposal only, no behavior change.
2. **Implementation PR**:
   - Replace `.github/workflows/release.yml` with the two-job design
     above.
   - Update `AGENTS.md` § Release Process in the same commit: drop
     force-push-tag instructions, replace with "merge the version PR;
     the workflow handles publish + tag + GH release".
   - Update `AGENTS.md` workflows table row for `release.yml` (trigger
     column changes from "Tag push (`v*`)" to "Push to `main`").
   - Verify with a no-op patch release: one trivial changeset (e.g.
     typo fix), watch the version PR appear, merge, watch publish run,
     confirm tag + release. This exercises the happy path only;
     partial-publish recovery and unrecoverable-publish paths are
     covered by re-running the workflow on synthetic failures in a
     follow-up dry-run, not the initial cut.
3. **Optional follow-up**: enable auto-merge on the version PR once
   it's green and approved, gated by a label like `release-ready`.
   That gets the flow to *zero* human actions for trivial releases
   (still one for anything needing review).

---

## Out of scope

- **Changelog reform** (top-level vs per-package narrative). Tracked
  separately — that's about the artifact shape, not the trigger
  pipeline.
- **Pre-release / canary channels.** The tag-suffix branching for
  `-alpha`/`-beta`/`-rc` in the post-publish step preserves the
  existing prerelease conventions, but a full canary pipeline
  (auto-publishing every main commit to `next`) is a separate plan.
- **Switching to a scoped GitHub App for the release token.** Would
  enable `publish-check.yml` on the bot version PR and is a strict
  improvement, but introduces a secret-management dependency. Track
  separately.

---

## Verification

- A test patch release runs end-to-end without human intervention beyond
  merging the version PR.
- `gh release list` shows `vX.Y.Z` matching the npm-published version.
- npm `dist-tag ls @tko/utils` shows `latest: X.Y.Z`.
- The repo-wide `vX.Y.Z` tag in git points at the merge commit of the
  version PR.
- No per-package git tags (`@tko/utils@X.Y.Z`) created (suppressed by
  `--no-git-tag`).
- Doc-only main pushes invoke only `prepare`; `publish-and-tag` is
  skipped (visible in workflow run summary).
