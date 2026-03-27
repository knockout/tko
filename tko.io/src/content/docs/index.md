---
title: Introduction
description: Choose the right TKO build and get started with modern Knockout.
---

<div class="landing-hero">
  <p class="landing-kicker">Velocity-first UI with observables</p>
  <h2>Build interactive UI with direct DOM bindings and granular updates.</h2>
  <p class="landing-lede">Choose the right TKO build, understand the compatibility path, and move from overview to working bindings without digging through the repo first.</p>
  <div class="landing-actions">
    <a class="landing-button landing-button--primary" href="/bindings/">Start with bindings</a>
    <a class="landing-button landing-button--secondary" href="/3to4/">Read the migration guide</a>
    <a class="landing-button landing-button--secondary" href="/playground">Try the Playground</a>
  </div>
</div>

## What is TKO?

TKO is a velocity-first UI framework built around observables and direct DOM bindings.

It keeps the familiar Knockout model of observables, computed values, and declarative bindings while delivering granular DOM updates through modular packages instead of a single legacy distribution.

New examples in this docs set show both classic HTML `data-bind` and modern TSX `ko-*` authoring. Use the TSX examples when you are writing new UI with `@tko/build.reference`, and use the HTML examples when you need to mirror existing markup or compare against older code with `@tko/build.knockout`.

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
    <p>Use this if you want the TSX and `ko-*` path shown in this docs set, plus a more modular setup with JSX, native bindings, and provider composition.</p>
  </a>
  <div class="landing-card landing-card--status">
    <span class="landing-card__eyebrow">Project status</span>
    <h3>4.x prerelease line</h3>
    <p>Pin the exact version you test with. The packages are usable, but the docs and example system are still being tightened up.</p>
  </div>
</div>

If you are upgrading an existing Knockout 3.x application, start with the [Knockout 3 to 4 Guide](/3to4/).

If you are following the TSX examples in this docs set, install `@tko/build.reference`.

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

If you want the TSX / `ko-*` path instead:

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
