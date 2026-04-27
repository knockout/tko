# Plan: Single-Action Release

**Goal**: Reduce the TKO release flow from a multi-step manual dance (tag,
wait, hand-open PR, merge, force-tag, wait) to a single human action — merge
the auto-generated version PR. Everything else runs unattended.

This is a Dark Factory plan: the maintainer's job is direction, not
choreography.

---

## Original State (April 2026)

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
| Review version bumps | Necessary, mechanical |
| Merge PR | Necessary |
| Force-move tag, re-push | Footgun: must be on merge commit |
| Wait for second workflow run | Pure latency |

Five out of seven steps are admin or latency. The two with maintainer
judgment (review and merge) are buried.

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
   - No pending changesets → `publish` job runs. `changeset publish`
     bumps tags per-package on npm via OIDC.
   - A post-publish step creates a single repo-wide `vX.Y.Z` tag and a
     matching GitHub Release.

**Single human action: merge the version PR.** Everything before and
after is automation.

---

## Mechanism

### `release.yml` changes

```yaml
on:
  push:
    branches: [main]

jobs:
  release:
    permissions:
      contents: write          # tags + GitHub release
      pull-requests: write     # opens version PR
      id-token: write          # npm OIDC

    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0       # changesets needs full history
          persist-credentials: false

      - uses: oven-sh/setup-bun@v2
      - uses: actions/setup-node@v6
        with:
          node-version: 24.x
          registry-url: 'https://registry.npmjs.org'

      - run: bun install --frozen-lockfile
      - run: bun run build

      - name: Version PR or publish
        id: changesets
        uses: changesets/action@v1
        with:
          version: npx changeset version
          publish: npx changeset publish
          title: 'chore: version packages'
          commit: 'chore: version packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Tag repo + create GitHub release
        if: steps.changesets.outputs.published == 'true'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          version="$(node tools/release-version.cjs)"
          tag="v${version}"
          git tag "$tag"
          git push origin "$tag"
          prerelease=""
          case "$version" in *-alpha*|*-beta*|*-rc*) prerelease="--prerelease";; esac
          gh release create "$tag" \
            --target "$GITHUB_SHA" \
            --title "TKO ${version}" \
            --generate-notes \
            $prerelease
```

Key shape changes from current `release.yml`:

- **Single trigger** (`push: branches: [main]`).
- **Single job** (was three: `prepare-release`, `publish`, `github-release`).
  One job means no inter-job artifact handoff and no `if:` gating
  between jobs that pass an output.
- **No tag-driven entry point.** The repo-wide `vX.Y.Z` tag is created
  *after* publish, by reading the bumped version from
  `tools/release-version.cjs`.
- **`changesets/action`'s built-in `publish` input is used.** It
  runs `npx changeset publish` automatically when there are no pending
  changesets, then sets `outputs.published`. This collapses what was
  steps 4–5 of the original flow.

### Removed pieces

- Force-pushed tag dance — gone.
- Tag-vs-version validation step — gone (the tag is *generated from* the
  version, so they can't disagree).
- Separate `prepare-release` / `publish` / `github-release` jobs —
  collapsed into one.

### Kept pieces

- npm trusted publishing via OIDC (`id-token: write`).
- `github-release.yml` as a manual fallback to backfill a release that
  the post-publish step missed (rare, but worth keeping).
- `publish-check.yml` on PRs (validates packages are publishable before
  they hit main).

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
- **GitHub release notes lose the "tag pre-existed" guarantee.** The
  post-publish step creates the tag and release together; if either step
  fails the cleanup is manual. Mitigation: `github-release.yml` already
  exists as a backfill workflow.

---

## Phasing

1. **Land this plan + reform `release.yml` in a single PR.** Test by
   cutting a no-op patch release (one trivial changeset, e.g. a typo
   fix), watch the version PR appear, merge it, watch publish run.
2. **Update `AGENTS.md` § Release Process** to describe the new
   single-action flow. Delete the force-push-tag instructions.
3. **Optional follow-up**: enable auto-merge on the version PR once it's
   green and approved, gated by a label like `release-ready`. That gets
   the flow to *zero* human actions for trivial releases (still one for
   anything needing review).

---

## Out of scope

- **Changelog reform** (top-level vs per-package narrative). Tracked
  separately — that's about the artifact shape, not the trigger
  pipeline.
- **Pre-release / canary channels.** The tag-suffix branching for
  `-alpha`/`-beta`/`-rc` in the post-publish step preserves the existing
  prerelease conventions, but a full canary pipeline (auto-publishing
  every main commit to `next`) is a separate plan.

---

## Verification

- A test patch release runs end-to-end without human intervention beyond
  merging the version PR.
- `gh release list` shows `vX.Y.Z` matching the npm-published version.
- npm `dist-tag ls @tko/utils` shows `latest: X.Y.Z`.
- The repo-wide `vX.Y.Z` tag in git points at the merge commit of the
  version PR.
