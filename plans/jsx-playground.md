# Plan: TKO JSX Playground at /playground

**Risk class:** LOW

## Context

TKO users need an interactive playground to experiment with JSX + TKO without
local setup. The site already has a working inline example system in
`tko.io/public/js/examples.js` using CodeMirror 6 + esbuild-wasm + iframe
preview. The playground is a full-page, expanded version of that pattern with
two editor tabs (HTML + TSX) and a larger preview area.

## Approach

Create a standalone Astro page at `tko.io/src/pages/playground.astro` (like
the existing `404.astro` — a full HTML page outside the Starlight docs layout).
All editor/compiler logic lives in a single inline `<script type="module">`
block loading dependencies from CDN. No new npm dependencies needed.

## Architecture

```
┌──────────────────────────────────────────────────┐
│  Header bar: TKO Playground title + Run button   │
├──────────────────────┬───────────────────────────┤
│  Left panel          │  Right panel              │
│  ┌────────────────┐  │                           │
│  │ [HTML] [TSX] ← tabs                          │
│  ├────────────────┤  │  ┌───────────────────┐   │
│  │                │  │  │                   │   │
│  │  CodeMirror 6  │  │  │  iframe (srcdoc)  │   │
│  │  editor        │  │  │  live preview     │   │
│  │                │  │  │                   │   │
│  │                │  │  │                   │   │
│  └────────────────┘  │  └───────────────────┘   │
│                      │  ┌───────────────────┐   │
│                      │  │ Error / Console   │   │
│                      │  └───────────────────┘   │
├──────────────────────┴───────────────────────────┤
│  Status bar: esbuild status, compile time        │
└──────────────────────────────────────────────────┘
```

## Dependencies (all from CDN, no npm install)

Reuse the same CDN versions already used by `examples.js`:
- **esbuild-wasm** `0.24.0` — `https://cdn.jsdelivr.net/npm/esbuild-wasm@0.24.0/`
- **CodeMirror 6** `6.0.1` — `https://esm.sh/codemirror@6.0.1`
- **@codemirror/lang-javascript** `6.2.2` — JSX + TypeScript highlighting
- **@codemirror/lang-html** — HTML highlighting (new, from esm.sh)
- **@codemirror/theme-one-dark** `6.1.2` — dark editor theme
- **TKO** — `/lib/tko.js` (reference build, loaded in iframe)

## File to Create

### `tko.io/src/pages/playground.astro`

Standalone full-page Astro component (no Starlight layout). Contains:

1. **HTML structure**: Header bar, split panel layout (CSS grid), tab
   buttons for HTML/TSX, CodeMirror mount points, iframe, error/console area

2. **CSS**: Full-viewport layout using CSS grid. Reuse TKO design tokens
   from `tko.css` (fonts, colors, border-radius, shadows). Dark editor
   panel on left, light preview on right. Responsive — stack vertically
   on mobile.

3. **`<script type="module">`** with:
   - CDN imports (CodeMirror, esbuild-wasm) — same pattern as `examples.js`
   - Two CodeMirror editors: one for HTML (`lang-html`), one for TSX
     (`lang-javascript` with `jsx: true, typescript: true`)
   - Tab switching (show/hide editors, preserve state)
   - `esbuild.transform()` with `loader: 'tsx'`, `jsxFactory: 'tko.jsx.createElement'`,
     `jsxFragment: 'tko.jsx.Fragment'` — same config as `examples.js:35-44`
   - iframe preview using `srcdoc` — same pattern as `examples.js:97-134`
     but with user's HTML injected into the body
   - Debounced auto-run (500ms) on editor changes
   - Error display panel (compile errors from esbuild, runtime errors via
     iframe `postMessage`)
   - Console capture in iframe via `postMessage` to parent

4. **Default example code** pre-loaded in editors:
   - HTML tab: `<div id="root"></div>`
   - TSX tab: A simple TKO counter example using JSX:
     ```tsx
     const count = tko.observable(0)
     const view = (
       <div>
         <h1>Count: {count}</h1>
         <button ko-click={() => count(count() + 1)}>+1</button>
       </div>
     )
     tko.jsx.render(view, document.getElementById('root'))
     ```

## Key Implementation Details

- **No new npm deps**: Everything loads from CDN in the browser
- **No build step**: The page is static HTML + inline JS module
- **Reuse patterns from `examples.js`**: Same CDN URLs, same esbuild config,
  same iframe srcdoc approach — proven to work
- **TKO loaded in iframe from `/lib/tko.js`**: Already built and served by
  the prebuild script in `tko.io/package.json`
- **JSX factory**: `tko.jsx.createElement` / `tko.jsx.Fragment` (matches
  existing examples.js config)

## Files Modified

| File | Action |
|------|--------|
| `tko.io/src/pages/playground.astro` | **Create** — full playground page |

No other files need modification. The page is self-contained.

## Verification

1. `cd tko.io && bun run dev` — start dev server
2. Visit `http://localhost:4321/playground`
3. Verify: editors load with default example, preview shows counter
4. Edit TSX code — preview updates after 500ms debounce
5. Introduce a syntax error — error panel shows esbuild error
6. Switch between HTML and TSX tabs — content preserved
7. Test responsive: resize browser narrow — panels stack vertically
8. `bun run build && bun run preview` — verify production build works

## AI Evidence
- Risk class: LOW
- Changes and steps: create `playground.astro` standalone page, inline editor/compiler logic via CodeMirror 6 + esbuild-wasm, no new npm dependencies
- Tools/commands: `bun run dev`, `bun run build`, `bun run preview`, `playwright-cli` headless
- Validation: steps 1–8 above; verify playground page loads and live-compiles TSX without errors
- Follow-up owner: TKO maintainers
