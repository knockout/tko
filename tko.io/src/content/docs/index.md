---
title: Introduction
description: Choose the right TKO build and get started with modern Knockout.
---

<div class="landing-hero">
  <p class="landing-kicker">Modern Knockout, clarified</p>
  <h2>Pick the right build quickly, understand the migration path, and get to working bindings without reading the whole repo first.</h2>
  <p class="landing-lede">This site now prioritizes the practical questions a team has when evaluating TKO: what to install, what stays familiar, and what changed from Knockout 3.x.</p>
  <div class="landing-actions">
    <a class="landing-button landing-button--primary" href="/bindings/">Start with bindings</a>
    <a class="landing-button landing-button--secondary" href="/3to4/">Read the migration guide</a>
  </div>
</div>

## What is TKO?

TKO is the monorepo and documentation home for the modern Knockout builds.

It keeps the familiar Knockout model of observables, computed values, and declarative bindings, while publishing the runtime as modular packages instead of a single legacy distribution.

## Choose a build

Use this rule of thumb:

<div class="landing-grid">
  <a class="landing-card" href="/3to4/">
    <span class="landing-card__eyebrow">Recommended for migrations</span>
    <h3><code>@tko/build.knockout</code></h3>
    <p>Start here if you want the compatibility-focused build and the closest match to a traditional Knockout application.</p>
  </a>
  <a class="landing-card" href="/advanced/provider/">
    <span class="landing-card__eyebrow">Recommended for modular setups</span>
    <h3><code>@tko/build.reference</code></h3>
    <p>Use this if you want the leaner reference build and are comfortable composing a more modular setup yourself.</p>
  </a>
  <div class="landing-card landing-card--status">
    <span class="landing-card__eyebrow">Project status</span>
    <h3>4.x prerelease line</h3>
    <p>Pin the exact version you test with. The packages are usable, but the docs and example system are still being tightened up.</p>
  </div>
</div>

If you are upgrading an existing Knockout 3.x application, start with the [Knockout 3 to 4 Guide](/3to4/).

## Current status

> TKO packages are still published as 4.x prereleases. Pin the exact version you test with, and expect some docs and examples to keep evolving.

## Quick start

Install the compatibility-focused build:

```bash
npm install @tko/build.knockout
# or
yarn add @tko/build.knockout
# or
bun add @tko/build.knockout
```

If you want the modular reference build instead:

```bash
npm install @tko/build.reference
```

For a browser-global script tag, use the Knockout-compatible build:

```html
<script src="https://cdn.jsdelivr.net/npm/@tko/build.knockout/dist/browser.min.js"></script>
```

## First binding example

```html
<div id="app">
  <label>
    Name
    <input data-bind="textInput: name" />
  </label>
  <p>Hello, <strong data-bind="text: name"></strong>.</p>
</div>

<script src="https://cdn.jsdelivr.net/npm/@tko/build.knockout/dist/browser.min.js"></script>
<script>
  const viewModel = {
    name: ko.observable('TKO')
  };

  ko.applyBindings(viewModel, document.getElementById('app'));
</script>
```

## What stays familiar

- **Observables and computed values**
  The reactive model is still centered on `ko.observable`, `ko.observableArray`, and `ko.computed`.
- **Declarative bindings**
  Bind UI to state with the same `data-bind` style APIs used in classic Knockout.
- **Components and custom bindings**
  The component system and binding extensibility remain core parts of the framework.

## What to read next

<div class="landing-grid">
  <a class="landing-card" href="/bindings/">
    <span class="landing-card__eyebrow">Core docs</span>
    <h3>Bindings</h3>
    <p>Start with the behavior readers touch first: binding syntax, common bindings, and view updates.</p>
  </a>
  <a class="landing-card" href="/observables/">
    <span class="landing-card__eyebrow">State model</span>
    <h3>Observables</h3>
    <p>Review observables, observable arrays, extenders, and rate limiting before building larger flows.</p>
  </a>
  <a class="landing-card" href="/components/">
    <span class="landing-card__eyebrow">Composition</span>
    <h3>Components</h3>
    <p>Move on to reusable UI, loading strategies, and the edges where app architecture starts to matter.</p>
  </a>
</div>

## Community

Find Knockout online at:

- [GitHub issues](https://github.com/knockout/tko/issues)
- [Gitter knockout/tko](https://gitter.im/knockout/tko)
- [Gitter knockout/knockout](https://gitter.im/knockout/knockout)
- [Reddit /r/knockoutjs](https://www.reddit.com/r/knockoutjs/)
- [Google Groups](https://groups.google.com/forum/#!forum/knockoutjs)
- [StackOverflow [knockout.js]](http://stackoverflow.com/tags/knockout.js/info)
