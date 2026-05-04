# Plan: Dark-Factory Changelog

**Goal**: Eliminate verbatim duplication of cross-cutting changeset
bodies across per-package `CHANGELOG.md` files so an agent (or human)
can answer *"what landed in vX.Y.Z?"* by reading **one** file.

This is a Dark Factory plan: the artifact shape should optimize for
*token-efficient retrieval by an agent*, not for the
one-package-one-history mental model inherited from Lerna-era npm
tooling.

---

## Original State (May 2026)

`changeset version` writes a `CHANGELOG.md` per package. With TKO's
fixed-version group of 27 packages, a single cross-cutting concern
(e.g. `modernize-utils-dead-polyfills` on the 4.1.0 cut) appears in
**eight** package changelogs verbatim — because the changeset listed
all eight packages that touched the work. Sister packages dragged
along by the fixed-group bump get a single-line `Updated dependencies`
stub.

### Concretely on 4.1.0

| Changeset                          | Full body in N CHANGELOGs |
|------------------------------------|---------------------------|
| `modernize-utils-dead-polyfills`   | 8                         |
| `modernize-trigger-event`          | 3                         |
| `fix-jsx-clean-teardown-race`      | 1                         |
| `fix-proxy-delete-property`        | 1                         |

To answer *"what landed in 4.1.0?"* an agent currently has to (a) find
every `CHANGELOG.md` in the monorepo, (b) read each file's `## 4.1.0`
section, (c) dedupe the bodies, (d) reconstruct the cross-cutting
narrative. Four wasted operations to recover a story we already wrote
once, in `.changeset/*.md`.

---

## Options surveyed

### A. Top-level CHANGELOG, per-package stubs **[recommended]**

- Each release writes the full narrative *once* to root
  `CHANGELOG.md`, deduped across packages.
- Per-package `CHANGELOG.md` retains its `## X.Y.Z` heading but the
  body shrinks to one line: `*See [root CHANGELOG](../../CHANGELOG.md#xyz).*`
- `Updated dependencies` lines suppressed everywhere.

### B. Single source, no per-package files (rejected)

- Delete every `packages/*/CHANGELOG.md` and `builds/*/CHANGELOG.md`.
- Root is the only release narrative; npm-page deep links 404.

### C. (B) + curated structured release notes (rejected)

- Hand-curated summary placeholder edited in by the maintainer before
  merging the version PR.

---

## Why A, not B or C

This plan went through three rounds of adversarial review. Earlier
drafts recommended **B + C**. Both were rejected. Reasoning:

### C reintroduces the toil dark-factory eliminates

C says "maintainer (or agent acting as release manager) edits a
placeholder summary before merging the version PR." That is a human
in the loop on every release — exactly the opposite of dark-factory's
"merge the version PR is the only human action" thesis (the
single-action release flow shipped in #377).

The current root `CHANGELOG.md` proves the point: it ends at 4.0.1
even though 4.1.0 shipped, because nobody hand-curated a 4.1.0
narrative. If structure can't survive cadence, structure is theater.

### B breaks deep links for a 13-year-old library's downstream users

External docs, blog posts, Stack Overflow answers, and Renovate
release-note popups link to `packages/utils/CHANGELOG.md#400`. Stub
files preserve those links at the cost of one line of disk per
package per release.

Renovate's `release-notes` extractor reads `CHANGELOG.md` from the
repo and renders nothing if absent — it does *not* automatically swap
to the GitHub Release. With stubs the popup links to the root.

### Prior art does not support full deletion

`pnpm` (the closest fixed-group monorepo using changesets) ships
default per-package `CHANGELOG.md` files. So does `nx`. Earlier
drafts asserted the opposite as supporting evidence; spot-check did
not survive verification.

### npm-tarball motivation was overstated

All 27 `package.json` `files` arrays are `["dist/"]`, so
`CHANGELOG.md` is **not** included in any published tarball. npm
package pages render CHANGELOG content from the **repo URL**, not
the tarball. Removing per-package `CHANGELOG.md` doesn't change
tarball content; it breaks the npm-page-deep-link experience.

---

## Recommendation: A only

The whole win is one file at the root that contains the canonical
narrative for each release, with per-package stubs preserving the
deep-link surface.

---

## Implementation surface

### Why a wrapper is required

The natural-looking approach — point `.changeset/config.json` at a
custom changelog generator — does not work for our goal:

- The `getReleaseLine(changeset, type, options)` interface has access
  to the changeset id, body, and bump type only. It does **not**
  receive: the package name, the package directory, the new version
  string, or any context about whether it's the first/last invocation
  in a run.
- For a fixed-group cross-cutting changeset listing 8 packages,
  `getReleaseLine` is invoked 8 times with identical input across
  different package contexts the function cannot distinguish.
- The return value is a string spliced into one per-package file by
  Changesets' built-in writer. It cannot redirect output to root,
  because root is not the file currently being assembled.
- Default generators are pure functions returning strings; the
  Changesets release pipeline applies Prettier and `prependFile` to
  per-package CHANGELOGs only.

A custom generator can shape the *per-package* string but cannot
reach the root file. Achieving the goal requires running the default
generator first, then post-processing — i.e. a wrapper.

### `tools/changesets/version.cjs` (new)

Invoked by `release.yml`'s `changesets/action` `version:` input
instead of `bunx changeset version`. Behavior:

1. **Snapshot pre-state.**
   - Read each `packages/*/CHANGELOG.md` and
     `builds/*/CHANGELOG.md` into memory. Used in step 3 to detect
     prepended bytes precisely (rather than relying on "topmost
     heading", which becomes ambiguous on re-run).
   - Read each `.changeset/*.md` and parse its frontmatter — capture
     the **declared** package list per changeset id. Required in
     step 4: dedup keys on what the changeset author intended, not
     on the fixed-group bump set (which is always all 27).

2. **Run the default version pipeline.** `bunx changeset version`
   executes normally, writing per-package `## X.Y.Z` sections with
   full bodies + `Updated dependencies` lines, and consuming the
   `.changeset/*.md` files.

3. **Extract just-written sections by diff.** For each per-package
   CHANGELOG, the new bytes are exactly `current_content` minus
   `pre_content` from step 1 (file is prepended to). Capture:
   version `X.Y.Z`, full new-section text. If diff is empty, skip
   (no version change for this package — defensive; never happens in
   TKO's fixed group).

4. **Dedupe across packages.** Bodies are compared by content hash
   after stripping leading `### {Major,Minor,Patch} Changes`
   subheadings. Identical bodies coalesce; the **declared** package
   list (from step 1) is attached to each unique body.

5. **Write the root section.** Prepend a single `## X.Y.Z` section
   to root `CHANGELOG.md` (no date in the heading — see slug note
   below). Date appears in the section body:

   ```markdown
   ## X.Y.Z

   _Released YYYY-MM-DD._

   ### Major Changes
   <deduped major bodies, grouped by content>

   ### Minor Changes
   <deduped minor bodies, grouped by content>

   ### Patch Changes
   <deduped patch bodies, grouped by content>
   ```

   Each unique body is written once. Bodies whose **declared**
   package list equals the full fixed-group set get no list footer.
   Bodies declared on a strict subset get a `Affects: @tko/x,
   @tko/y` footer.

   The heading is bare `## X.Y.Z` (no em-dash, no date) so GitHub's
   GFM slugger produces a stable anchor (`#410` for `4.1.0`,
   `#4100` for `4.10.0`). The anchors are collision-free for our
   actual cadence. Adding date to the heading would slug to
   `#410--2026-mm-dd` and break the per-package stub link.

6. **Replace per-package new sections with stubs.** For each
   per-package CHANGELOG, splice over the captured new section so
   the heading is preserved but the body becomes a single stub line:

   ```markdown
   ## X.Y.Z

   *See [root CHANGELOG](../../CHANGELOG.md#410).*
   ```

   `../../` is correct from both `packages/*/` and `builds/*/`
   depths (both two levels deep). The anchor is computed from the
   bare heading slug, not from the date-bearing line in the body.
   `Updated dependencies`-only sections (the 19+ sister packages
   that didn't appear in any changeset's declared list) are
   replaced wholesale by the same stub — no special-case parsing
   needed since step 3 captures whatever new bytes appeared.

7. **No formatter pass needed.** Biome (the project's only
   formatter) does not format Markdown. Markdown style follows the
   default Changesets writer for per-package files; the wrapper
   writes the root file in matching style.

The wrapper is idempotent on no-op runs: if `changeset version`
writes nothing (no pending changesets, snapshot equals current),
step 3 finds empty diffs and steps 4–6 short-circuit.

### `release.yml`

One-line change in the `prepare` job:

```yaml
- name: Open or update version PR
  id: changesets
  uses: changesets/action@v1
  with:
    version: node tools/changesets/version.cjs        # was: bunx changeset version
    title: 'chore: version packages'
    commit: 'chore: version packages'
    commitMode: github-api
```

`changesets/action`'s `commitMode: github-api` discovers files
changed via git status post-version, then commits via the API. The
wrapper's writes — to root CHANGELOG, to each per-package CHANGELOG —
all show up in `git status` after step 1 of the wrapper, so they're
included in the bot's commit. No additional auth or push logic
needed.

### `.changeset/config.json`

**No change.** The default generator (`@changesets/cli/changelog`)
keeps writing per-package files; the wrapper post-processes them.
A custom generator was the original idea but is incompatible with
the goal (see *Why a wrapper is required* above).

### `CHANGELOG.md` (repo root)

Already exists; ends at 4.0.1. The first run of the wrapper on the
next release will prepend `## X.Y.Z` (newest first) above the
existing `## 4.0.1` heading. No retroactive backfill of 4.1.0 — that
release shipped under the old generator and its narrative lives in
the eight per-package files until they get overwritten on next
release.

---

## Tradeoffs

- **Per-package stubs accumulate.** After N releases each per-package
  CHANGELOG has N stub lines under N headings. Trivially compactable
  later; not worth solving preemptively.
- **The 4.1.0 narrative stays only in per-package files.** Migrating
  it into root retroactively would require a one-time backfill. Out
  of scope; root's first new entry is the next release.
- **Wrapper is one more file to maintain.** ~150 lines of CJS,
  including dedup + Prettier integration. Cheap relative to the
  retrieval-cost reduction.
- **Wrapper composes with `commitMode: github-api`.** The bot's API
  commit picks up the wrapper's writes via the standard "what
  changed in the worktree" discovery the action already uses. No
  special handling needed.
- **Renovate popup quality dips slightly.** Renovate's
  `release-notes` extractor reads per-package `CHANGELOG.md`; with
  stubs in place it sees the stub line and the link. Still better
  than option B's empty-file state. Acceptable.

---

## Out of scope

- **Single-action release flow** — already shipped in #377
  (`release.yml` rewrite).
- **Deleting per-package CHANGELOG.md files (option B).** Rejected
  above.
- **Curated structured release notes (option C).** Rejected above;
  re-openable as a separate plan if a *non-blocking* curation
  workflow is found (e.g. agent-generated summary in the version
  PR description rather than the CHANGELOG itself).
- **Backfilling 4.1.0 into the root file.** Could be done as a
  one-shot script post-merge; not part of this plan's surface.

---

## Verification

- After landing: `find . -name CHANGELOG.md \
    -not -path './node_modules/*' \
    -not -path './.claude/*' \
    -not -path './.git/*' \
    -not -path './dist/*' \
    -not -path '*/dist/*'` returns exactly the root file plus the
  27 package stubs.
- `bunx node tools/changesets/version.cjs` on a test branch with one
  cross-cutting changeset listing 8 packages:
  - Appends one new `## X.Y.Z` section to root `CHANGELOG.md`
    containing the changeset body **once**.
  - Each of the 8 listed packages' `CHANGELOG.md` gains a stub line
    under a new `## X.Y.Z` heading.
  - The other 19 fixed-group packages' `CHANGELOG.md` gains the same
    stub (they bumped via fixed-group dependency, no `Updated
    dependencies` line).
  - No `Updated dependencies` line in any file.
- `bunx changeset publish` on the same test branch publishes
  successfully and creates per-package git tags as before.
- Re-running the wrapper with no pending changesets is a no-op
  (no version change → no new sections → wrapper short-circuits).

[1]: https://github.com/changesets/changesets/blob/main/docs/modifying-changelog-format.md
