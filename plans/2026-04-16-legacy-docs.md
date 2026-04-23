# Plan: Write fresh docs for critical gaps

**Risk class:** LOW — new documentation pages only, no code changes
**Owner:** brianmhunt

## Context

TKO's Starlight docs cover bindings, observables, computed, components, and binding context thoroughly — but lack foundational pages that new users need: installation, API reference, browser support, utility functions, and data serialization. Legacy Knockout docs covered these topics but are outdated. We're writing fresh content informed by the legacy structure.

## New pages (5 files)

### 1. `tko.io/src/content/docs/getting-started/index.md` — Installation & Setup
- Sidebar: `label: Overview, order: 0`
- CDN (ES module + classic script) for `build.reference`
- Package manager install (npm/bun/pnpm/yarn tabs)
- `build.knockout` as migration option with link to `/3to4/`
- First binding example (standalone HTML)
- TypeScript setup notes
- Landing page quick start stays as-is (quick taste vs full guide)

### 2. `tko.io/src/content/docs/getting-started/browser-support.md` — Browser Support
- Modern browser engine coverage (Chromium, WebKit, Gecko)
- ES module support requirements
- Classic script fallback for older environments
- How TKO is tested (Vitest + Playwright, 3 engines in CI)

### 3. `tko.io/src/content/docs/observables/utilities.md` — Utility Functions
- `ko.toJS` / `ko.toJSON` serialization
- `ko.unwrap` / `ko.isObservable` / `ko.isWritableObservable` / `ko.isComputed`
- `.fn` extensibility (`ko.observable.fn`, `ko.observableArray.fn`, etc.)
- Type hierarchy: subscribable → observable → observableArray/computed
- Working examples

### 4. `tko.io/src/content/docs/observables/json-data.md` — Loading & Saving Data
- Serializing view models with `ko.toJS` / `ko.toJSON`
- Loading data into observables (manual assignment patterns)
- Fetch API examples (replacing legacy jQuery patterns)
- Debugging: rendering JSON in the UI

### 5. `tko.io/src/content/docs/api.md` — API Reference
- Root-level page (add to sidebar config)
- Index/lookup table format: function name, one-liner, link to detailed page
- Organized by category: Observables, Computed, Components, Bindings, Utilities
- No full signatures — just names + links for quick navigation

## Sidebar config update

Edit `tko.io/astro.config.mjs` to add:
```js
{ label: 'Getting Started', autogenerate: { directory: 'getting-started' } },
// ... existing sections ...
{ label: 'API Reference', slug: 'api' },
```

Place "Getting Started" right after Introduction. Place "API Reference" before "Knockout 3 → 4 Guide".

## Conventions to follow
- Frontmatter: `title` required, `description` + `sidebar` on index pages
- Filenames: kebab-case `.md`
- Code examples: use `<Tabs>` from `@astrojs/starlight/components` for multi-variant snippets (`.mdx` extension when using imports)
- Link to existing docs pages with relative paths
- Keep pages concise — reference detailed pages rather than duplicating

## Files to modify
- `tko.io/astro.config.mjs` — sidebar config
- 5 new files as listed above

## Verification
1. Run `bun run dev` in `tko.io/` and check all new pages render
2. Verify sidebar navigation order is correct
3. Check all internal links resolve
4. Review on mobile viewport
