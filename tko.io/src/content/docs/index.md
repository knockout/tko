---
title: Introduction
description: Choose the right TKO build and get started with modern Knockout.
---

# What is TKO?

TKO is the monorepo and documentation home for the modern Knockout builds.

It keeps the familiar Knockout model of observables, computed values, and declarative bindings, while publishing the runtime as modular packages instead of a single legacy distribution.

## Choose a build

Use this rule of thumb:

- **`@tko/build.knockout`**
  Start here if you want the compatibility-focused build and the closest match to a traditional Knockout application.
- **`@tko/build.reference`**
  Use this if you want the leaner reference build and are comfortable composing a more modular setup yourself.

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

- New to TKO: start with [Bindings](/bindings/), [Observables](/observables/), and [Computed](/computed/computedobservables/).
- Migrating from Knockout 3.x: read the [Knockout 3 to 4 Guide](/3to4/).
- Working on advanced integrations: review [Components](/components/) and [Advanced](/advanced/provider/).

## Community

Find Knockout online at:

- [GitHub issues](https://github.com/knockout/tko/issues)
- [Gitter knockout/tko](https://gitter.im/knockout/tko)
- [Gitter knockout/knockout](https://gitter.im/knockout/knockout)
- [Reddit /r/knockoutjs](https://www.reddit.com/r/knockoutjs/)
- [Google Groups](https://groups.google.com/forum/#!forum/knockoutjs)
- [StackOverflow [knockout.js]](http://stackoverflow.com/tags/knockout.js/info)
