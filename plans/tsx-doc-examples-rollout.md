# Plan: TSX Docs Example Rollout

**Risk class:** LOW

## Goal

Make the TSX side of the docs easier to read than the legacy HTML + viewmodel
examples while keeping every example runnable in the playground.

The reader-facing convention is:

- Declare observables and other referenced variables at the top of the example
- Show the binding-focused TSX snippet only
- Hide mount/setup boilerplate from the visible example
- Keep the legacy HTML + JS example intact inside the HTML tab
- Ensure both tabs continue to open working playground sessions

---

## Current Problem

The first TSX migration pass made several examples longer and noisier than the
legacy HTML version:

- Some TSX examples include repeated `root / render / applyBindings` ceremony
- Some examples introduce intermediate objects that are not needed to explain
  the binding
- Legacy HTML `viewModel` blocks can appear visually detached from the HTML tab
- The docs are teaching setup details at the same level as binding syntax

This is backwards for readers. TSX should feel more direct, not more verbose.

---

## Reader-First Convention

### Visible TSX example

Each TSX example should show only:

1. Top-level variables and observables referenced by `ko-*={...}`
2. The JSX that demonstrates the binding itself

Example shape:

```tsx
const url = ko.observable('year-end.html')
const details = ko.observable('Report including final year-end statistics')

<a ko-attr={{ href: url, title: details }}>Report</a>
```

### Hidden playground wrapper

The playground button should wrap the visible snippet with the standard mount
code automatically:

- locate or create `#root`
- render the JSX into the root
- call `tko.applyBindings({}, root)`

This keeps the docs short without breaking playground execution.

### HTML tab behavior

- Keep the legacy HTML snippet visible
- Keep the matching JS viewmodel visible, but only inside the HTML tab panel
- Preserve a working HTML playground button using the paired HTML + JS payload

---

## Scope

Apply this convention to TSX-capable docs examples across:

- `tko.io/src/content/docs/bindings/`
- selected examples in `observables/`, `computed/`, and `components/` where a
  TSX companion is helpful and already being introduced
- supporting docs for agents/readers:
  - `tko.io/public/agent-guide.md`
  - `tko.io/public/agent-testing.md`

Initial priority is bindings pages that already have active TSX work:

- `attr`
- `click`
- `enable`
- `foreach`
- `hasfocus`
- `if`
- `text`
- `textInput`
- `value`
- component pages already touched in the current branch

---

## Implementation Plan

### Phase 1: Lock the convention in tooling

Update the docs rendering/playground pipeline so it supports the reader-first
shape:

- `plugins/tsx-tabs.js`
  - continue pairing handwritten `tsx` + `html` examples
  - keep legacy JS blocks inside the HTML tab panel
- `plugins/playground-button.js`
  - support TSX snippets that omit mount/setup boilerplate
  - auto-wrap TSX snippets before encoding the playground payload
  - keep HTML payload pairing exact and deterministic

Success criteria:

- visible TSX snippet can stop at the JSX example
- playground still receives runnable `{ html, js }`
- HTML tab still renders its JS block inside the tab

### Phase 2: Migrate simple binding examples

For simple bindings, prefer:

- observables first
- inline JSX binding expression
- no extra `view` variable unless it improves readability
- no visible mount/setup footer

Examples include:

- `attr`
- `enable`
- `text`
- `textInput`
- `value`
- `click`

### Phase 3: Migrate context-sensitive examples

Bindings like `foreach` and `if` need extra care because they mix:

- compile-time variables in `ko-*={...}`
- runtime binding-context strings like `$data`, `$parent`, `name`

For these pages:

- keep top-level collections/computeds explicit
- keep runtime binding-context references as strings in child nodes
- add short notes only where the compile-time/runtime boundary is easy to miss

### Phase 4: Align docs and agent docs

After the pattern stabilizes in the binding pages, update:

- `public/agent-guide.md`
- `public/agent-testing.md`

to document the new visible-snippet convention and the hidden playground
wrapper behavior.

---

## Content Rules

Use these rules consistently during migration:

- If a `ko-*` attribute references a value, define that value first
- Prefer observables when the original example is demonstrating reactive data
- Prefer literals only when reactivity is not the point of the example
- Do not show `document.getElementById`, `appendChild`, or `applyBindings`
  unless the page is explicitly teaching render/setup mechanics
- Avoid helper objects like `const attrs = { ... }` unless the object itself is
  part of what the reader should learn
- Keep the TSX tab shorter than the HTML + JS alternative whenever possible

---

## Verification

For each migrated page:

1. Run `bun run build`
2. Run the docs site locally with `bun x astro dev --host 127.0.0.1 --port 4321 --force`
3. Verify the page with headless `playwright-cli`
4. Confirm:
   - TSX tab renders the shortened reader-facing snippet
   - HTML tab renders both legacy HTML and its JS block inside the tab
   - TSX playground button opens a runnable payload
   - HTML playground button opens a runnable payload
   - no visible error bar or console errors in the playground

For the full rollout, spot-check every migrated page and fully verify the more
complex ones (`foreach`, `if`, components).

---

## Risks

- Hidden wrapper logic can drift from the documented render pattern if it is not
  kept in sync with the playground
- Over-shortening TSX examples can hide important compile-time scope rules
- Complex bindings may need a visible `view` variable for readability even if
  simple bindings do not
- Astro/Expressive Code caching can obscure plugin changes; force rebuilds may
  be needed during iteration

---

## Outcome

After this rollout:

- TSX examples read as the modern, concise path
- observables remain explicit and teach the compile-time scope rule
- setup ceremony stops dominating simple binding pages
- HTML examples remain fully available for legacy readers
- both tabs remain runnable through the playground

## AI Evidence
- Risk class: LOW
- Changes and steps: update `plugins/tsx-tabs.js` and `plugins/playground-button.js`, migrate binding example pages to reader-first TSX shape
- Tools/commands: `bun run build`, `bun x astro dev`, `playwright-cli` headless
- Validation: per-page verification — TSX tab, HTML tab, both playground buttons compile without errors
- Follow-up owner: TKO maintainers
