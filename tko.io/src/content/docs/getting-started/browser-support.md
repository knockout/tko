---
title: Browser Support
---

TKO targets modern browsers — any browser that supports ES2020 and `<script type="module">`.

## Supported engines

| Engine | Browsers | Tested in CI |
|--------|----------|:---:|
| Chromium | Chrome, Edge, Opera, Brave, Arc | Yes |
| WebKit | Safari (macOS, iOS) | Yes |
| Gecko | Firefox | Yes |

These three engines cover effectively all modern browsers.

## How TKO is tested

Every pull request runs the full test suite (2700+ tests) across all three engines using [Vitest](https://vitest.dev) browser mode with [Playwright](https://playwright.dev). The three engines run as parallel CI jobs.

## Loading TKO

The recommended way to load TKO is as an ES module:

```html
<script type="module">
  import ko from 'https://esm.run/@tko/build.reference'
</script>
```

An IIFE build is also available for classic `<script>` tag loading:

```html
<script src="https://cdn.jsdelivr.net/npm/@tko/build.reference/dist/browser.min.js"></script>
<script>
  const ko = globalThis.tko
</script>
```

## Server-side / Node.js

TKO's observable and computed primitives have no DOM dependencies and can run in Node.js, Bun, or Deno. Binding and template features require a DOM environment.
