# Plan: Dark-Factory Changelog

**Goal**: Replace TKO's per-package changelog sprawl with a single
canonical release narrative that agents and humans can grep once.

This is a Dark Factory plan: the artifact shape should optimize for
*token-efficient retrieval by an agent*, not for the
one-package-one-history mental model inherited from Lerna-era npm
tooling.

---

## Original State (April 2026)

`changeset version` writes a `CHANGELOG.md` per package. With TKO's
fixed-version group of 27 packages, a single cross-cutting concern
(say, `modernize-utils-dead-polyfills`) appears in **eight** package
changelogs verbatim — because the changeset listed all eight packages
that touched the work. Sister packages dragged along by the
fixed-group bump get a single-line `Updated dependencies` stub.

### Concretely on 4.1.0

| Changeset                          | Full body appears in N CHANGELOGs |
|------------------------------------|-----------------------------------|
| `modernize-utils-dead-polyfills`   | 8                                 |
| `modernize-trigger-event`          | 3                                 |
| `fix-jsx-clean-teardown-race`      | 1                                 |
| `fix-proxy-delete-property`        | 1                                 |

To answer *"what landed in 4.1.0?"* an agent (or human) currently has
to:

1. Find every `CHANGELOG.md` in the monorepo.
2. Read each file's `## 4.1.0` section.
3. Dedupe the bodies.
4. Reconstruct the cross-cutting narrative.

That's four wasted operations to recover a story we already wrote
once, in `.changeset/*.md`.

## Pain points

| Symptom                                                    | Cost                                          |
|------------------------------------------------------------|-----------------------------------------------|
| Same changeset body duplicated across 8 files              | Storage trivial; cognitive cost real          |
| No single answer to "what's in this release"               | Agents must aggregate; humans must scroll     |
| Release notes on GitHub redundantly auto-generate the same | Three sources of truth (PR, CHANGELOG, release) |
| Per-package `## 4.0.0` history accumulates noise           | Fixed-group means every package sees every release |

The default Changesets layout assumes Lerna-style independent
packages, each with its own audience reading its own changelog. TKO
ships as a fixed group with one version line — the model doesn't fit.

---

## Options

### A. Top-level CHANGELOG, per-package stubs

- Custom `getReleaseLine`/`getDependencyReleaseLine` writes the
  narrative once to root `CHANGELOG.md`.
- Per-package `CHANGELOG.md` shrinks to:
  ```
  ## 4.1.0 — see [root CHANGELOG](../../CHANGELOG.md#410)
  ```
- npm consumer pages still render *something* per package.
- Smallest behavioral change; each release adds two files modified
  (root CHANGELOG + per-package stub) instead of 27.

### B. Single source, no per-package files [recommended]

- Delete every `packages/*/CHANGELOG.md` and `builds/*/CHANGELOG.md`.
- Root `CHANGELOG.md` is the only release narrative.
- npm package pages link to the repo for history (standard for
  monorepos shipping a fixed group: e.g. `nx`, `pnpm` itself).
- One file to grep, one source of truth. No "see root CHANGELOG"
  pointers anywhere.
- **Tradeoff**: npm-page-only browsers lose per-package timelines.
  Acceptable: anyone browsing `@tko/utils.parser`'s npm page will
  follow the repo link to the canonical history. The TKO audience
  reads the repo, not the npm page.

### C. (B) + structured release notes

- (B), plus a custom post-`changeset version` step that emits the
  release entry in a defined shape:

  ```markdown
  ## 4.1.0 — 2026-04-27

  Internal modernization release. Public API surface unchanged.

  - **Polyfill probes removed.** `useSymbols`,
    `functionSupportsLengthOverwrite` no longer probed at runtime.
    Public exports preserved as `@deprecated` passthroughs in
    `@tko/utils/compat`.
  - **Synthetic events use native constructors.** `triggerEvent` builds
    `MouseEvent`/`KeyboardEvent` with `new`, restoring side-effects in
    happy-dom.
  - **`ko.proxy` `deleteProperty` trap fixed.** Previously silently
    no-op; now correctly deletes the property.
  - **JSX cleanup batching is configurable.** `options.jsxCleanBatchSize`
    (default 1000, set to 0 for synchronous cleanup).

  ### Packages bumped
  All 27 fixed-group packages → `4.1.0`.

  ### Changesets
  - `fix-jsx-clean-teardown-race`
  - `fix-proxy-delete-property`
  - `modernize-trigger-event`
  - `modernize-utils-dead-polyfills`
  ```

- Plays well with `verified-behaviors.json` style — structured,
  greppable, agent-readable.
- **Tradeoff**: more authoring discipline. The `.changeset/*.md` body
  is no longer the verbatim release-note text; it's source material
  for a human-curated narrative summary at release time.

---

## Recommendation

**B + C together, landing in the next minor (4.2.0).**

- B alone leaves the file as raw `getReleaseLine` output — fine, but
  still per-changeset paragraphs in source order, not a curated
  narrative.
- C without B keeps 27 redundant files around with the same noise.
- Together: one root file, structured by release, with a short
  hand-curated narrative summary on top of the auto-generated
  changeset-by-changeset detail.

The custom changelog generator that B needs is the same hook C uses to
emit structured output, so doing them together is one piece of work,
not two.

---

## Implementation surface (B + C)

### `.changeset/config.json`

Swap the changelog generator to a custom one targeting root only:

```json
{
  "changelog": ["./tools/changesets/root-changelog.cjs", null],
  ...
}
```

### `tools/changesets/root-changelog.cjs`

Implements the [Changesets changelog interface][1]:

- `getReleaseLine(changeset, type)` → returns the formatted entry
  for one changeset.
- `getDependencyReleaseLine(changesets, dependenciesUpdated)` →
  returns empty string (we don't want per-package "Updated
  dependencies" lines anywhere).

### `tools/changesets/version.cjs` (new)

A small wrapper that:

1. Runs `npx changeset version` (which would normally write
   per-package CHANGELOGs).
2. Reads what would have been written from each
   `packages/*/CHANGELOG.md` and `builds/*/CHANGELOG.md`, then
   deletes those files.
3. Aggregates the entries into a single new `## X.Y.Z` section in
   root `CHANGELOG.md`, with the C-shaped layout:

   ```markdown
   ## X.Y.Z — YYYY-MM-DD

   <one-paragraph hand-curated summary, edited in by the maintainer
   before merging the version PR>

   ### Highlights
   - <bullet per significant changeset, body trimmed to 1–2 sentences>

   ### Packages bumped
   All N fixed-group packages → `X.Y.Z`.

   ### Changesets
   - `<changeset-name>` — <one-line description>
   ```

4. The "summary" line starts as a placeholder (`_Summary pending._`)
   so the version PR is mergeable as soon as the bot opens it. The
   maintainer can edit it before merge for non-trivial releases, or
   leave the placeholder for boring patch releases.

### `release.yml` (single-action release flow plan)

The release workflow runs `tools/changesets/version.cjs` instead of
`npx changeset version` directly. One-line change in the
`changesets/action` invocation:

```yaml
with:
  version: node tools/changesets/version.cjs
  publish: npx changeset publish
```

### One-time cleanup

```bash
rm packages/*/CHANGELOG.md builds/*/CHANGELOG.md
```

In the same PR as the config change. Root `CHANGELOG.md` is created
with a header noting the format and a `## Unreleased` section.

---

## Tradeoffs and risks

- **npm consumer expectations.** Users reading the npm page for
  `@tko/observable` no longer see a per-package history. The package
  description is updated to point at `https://github.com/knockout/tko/blob/main/CHANGELOG.md`.
- **Authoring discipline.** The maintainer (or agent acting as
  release manager) is expected to edit the placeholder summary
  before merging the version PR for non-trivial releases. Trivial
  patches can ship with the placeholder; nothing breaks.
- **Tooling assumptions.** Some downstream automation (Renovate's
  changelog popups, Dependabot, GitHub's Releases auto-generation)
  expects per-package CHANGELOG.md. Renovate falls back gracefully to
  the GitHub Release; verify before landing.
- **GitHub Release auto-generation.** The single-action release flow
  (separate plan) creates the GitHub Release with `--generate-notes`,
  which uses commit messages, not CHANGELOG content. Output stays
  reasonable; the CHANGELOG link in the release body becomes the
  canonical narrative.
- **Migration cost.** One commit deletes 27 files and adds one. No
  downstream breakage in this repo. External consumers who linked to
  per-package CHANGELOG paths will 404 — small risk, easy to mitigate
  with a redirect note in the release announcement.

---

## Out of scope

- **Single-action release flow.** Tracked in
  `plans/single-action-release.md` — about pipeline triggers, not
  artifact shape.
- **Per-release blog posts / migration guides.** Different artifact
  altogether; lives in `tko.io/`, not `CHANGELOG.md`.
- **Bumping the changelog format retroactively.** Existing
  `## 4.0.0` and `## 4.0.1` per-package entries are deleted with the
  files; root CHANGELOG starts at 4.2.0. Historical context stays
  reachable in git.

---

## Verification

- After landing: `find . -name CHANGELOG.md -not -path './node_modules/*'`
  returns exactly one path: `./CHANGELOG.md`.
- `changeset version` on a test branch writes one entry to the root
  file and modifies zero per-package CHANGELOGs.
- The next published npm package's tarball does not contain a
  `CHANGELOG.md`. (`@tko/observable` `package.json` `files: ["dist/"]`
  already excludes it; verify nothing gets readded.)
- `gh release view v4.2.0` body links to the root CHANGELOG section.

[1]: https://github.com/changesets/changesets/blob/main/docs/modifying-changelog-format.md
