# Plan: Live browser test runner at /tests

## Context

TKO specs run under Vitest + happy-dom in CI (`bun run test`). That
covers DOM semantics reachable from a JS implementation of the
DOM, but misses anything that depends on a real browser: system
focus routing, layout, rendering, intersection, CSSOM, and per-
engine DOM quirks across Chromium / WebKit / Firefox.

A live browser runner at `/tests` on `tko.io` closes that gap by
running the same Mocha specs inside real iframes. It serves two
audiences:

1. **Contributors** — open `/tests` in any browser, get real-
   browser pass/fail without installing anything. Double as a
   reproducible bug harness.
2. **Agents** — Playwright or similar hits `/tests`, parses the
   stats chips, and knows whether a change holds up under real
   layout/focus/rendering. Complements verified-behaviors.json
   as an additional correctness signal.

Test environments are additive: Vitest+happy-dom stays, browser
runner expands coverage. Neither replaces the other.

## Approach

Astro page at `tko.io/src/pages/tests.astro` drives two modes via
`?suite=`:

- **source** (default) — run specs from the checkout, bundled
  per-spec into ESM chunks. One iframe per spec.
- **build** — load a published `@tko/build.*` bundle from
  jsDelivr, run all specs in one iframe against that CDN
  artifact. Proves the shipped build is green.

Each spec executes inside a `tests-frame.html` iframe harness
and posts pass/fail/pending/end events to the parent page. The
parent aggregates into a TKO-driven view model (suite tree,
stats chips, progress bar).

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│ /tests page (TKO view model)                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ suite tree (per-spec file, running/pass/fail state) │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  Phase 1: parallel (pool=4) hidden iframes                │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    1×1 offscreen         │
│  │spec │ │spec │ │spec │ │spec │    no focus needed       │
│  └─────┘ └─────┘ └─────┘ └─────┘                          │
│                                                           │
│  Phase 2: serial iframe in bottom-right workarea          │
│  ┌─────────────────┐    real layout box                   │
│  │ focus-spec here │    sole system focus                 │
│  └─────────────────┘    hasfocus/.focus/activeElement     │
│                                                           │
│  postMessage(pass/fail/pending/end) → parent              │
└───────────────────────────────────────────────────────────┘
```

### Why two phases

Chromium grants system focus to one iframe at a time and denies
it to off-screen / zero-area iframes. Specs that assert on
`hasfocus`, `.focus()`, `document.activeElement`, or `focusin` /
`focusout` can't run in parallel in hidden iframes — they need a
real visible layout box and sole focus. A `needsFocus` flag
(grep-based in the bundler) routes those specs serially through
a visible workarea.

### Bundling

`tko.io/scripts/bundle-tests.mjs` (esbuild) produces:

- `public/tests/build-bundle.js` — all `builds/**/spec/*` specs
  that only depend on `ko.*` globals, bundled into one script
  for build mode. Specs with relative imports are excluded.
- `public/tests/source/setup.js` — classic-script IIFE that
  exposes `globalThis.ko`, chai/sinon, punctuation filters,
  mocha-test-helpers, and the focus/sinon polyfills.
- `public/tests/source/<slug>.js` — one ESM module per spec
  for source mode.
- `public/tests/source/manifest.json` — per-spec metadata
  (slug, suite name, needsFocus) the parent uses to schedule.

`prebuild` runs the bundler so the dev server and production
build both serve fresh output.

## Files

| File | Role |
|------|------|
| `tko.io/src/pages/tests.astro` | `/tests` page — TKO VM, suite tree, schedulers |
| `tko.io/public/tests-frame.html` | Per-spec iframe harness |
| `tko.io/scripts/bundle-tests.mjs` | Discover specs, emit bundles + manifest |
| `builds/knockout/helpers/browser-setup.js` | Globals, focus polyfill, sinon restore, ctx-arg shim |
| `tko.io/package.json` | `prebuild` invokes the bundler |
| `tko.io/.gitignore` | Ignores generated `public/tests/` |

## Verification

1. `cd tko.io && bun run dev`
2. Visit `http://localhost:4321/tests` — source mode should
   reach 2708/0/42 in ~5-6s.
3. Switch to `/tests?suite=build&pkg=knockout&ver=latest` —
   build-mode suite runs against the published CDN bundle.
4. `?grep=<pattern>` — filter specs by file/slug (both modes).
5. CI: `bun run verify` still green under Vitest+happy-dom; the
   browser runner is an additive signal, not a replacement.

## What's not there yet

| Gap | What's needed |
|-----|---------------|
| **CI smoke** | Playwright job hitting `/tests` on every PR |
| **Firefox / WebKit coverage** | Playwright per-engine; today only Chromium is exercised interactively |
| **Flaky focus detection** | Track focus-phase retries; flag specs that pass only after retry |
| **Build-mode spec coverage** | 60+ specs currently excluded because they have relative imports — rewrite to use `ko.*` globals so build mode covers them |
| **Differential result** | Surface specs that pass under happy-dom but fail in a real browser (and vice versa) as a report |
