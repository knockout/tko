---
layout: base.njk
title: Introduction
---

# What is TKO?

TKO is a Javascript web framework, and the foundation for Knockout 4.

Knockout helps you create rich, responsive, maintainable applications built on a clean underlying data model.

- **Simple data-html bindings**
  Easily associate DOM elements with model data using a concise, readable syntax, like this: `<input data-bind='textInput: value'/>`
- **Two-way observables**
  Data model and DOM stay in sync, updating the UI whenever the data changes.
- **Computed dependencies**
  Create chains of calculated variables dependencies.
- **Templating**
  Create reusable components and sophisticated web applications.
- **Extensible**
  Implement custom behaviors and compartmentalized code.

TKO has a comprehensive suite of tests that ensure its correct functioning and allow easy verification on different Javascript browsers and platforms.

## Sponsors

Support Knockout [via Patreon to Brian M Hunt](https://patreon.com/brianmhunt)

## First Example

```jsx
// Simple observable example
const viewModel = {
  firstName: ko.observable('John'),
  lastName: ko.observable('Doe')
};

viewModel.fullName = ko.computed(() => {
  return viewModel.firstName() + ' ' + viewModel.lastName();
});

ko.applyBindings(viewModel);
```

```html
<div>
  <p>First name: <input data-bind="textInput: firstName" /></p>
  <p>Last name: <input data-bind="textInput: lastName" /></p>
  <h2>Hello, <span data-bind="text: fullName"></span>!</h2>
</div>
```

## Supported Platforms

TKO & Knockout should work on all modern browsers, as well as Javascript engines such as Node.js.

## Getting started

Include the latest version with this `<script>`:

```html
<script src="https://unpkg.com/tko@4.0.0/dist/ko.js" crossorigin="anonymous"></script>
```

or install it locally with:

```bash
npm install tko
# or
yarn add tko
# or
bun add tko
```

Clone the code with:

```bash
git clone git@github.com:knockout/tko
```

## Community

Find Knockout online at:

- [Gitter knockout/tko](https://gitter.im/knockout/tko)
- [Gitter knockout/knockout](https://gitter.im/knockout/knockout)
- [Reddit /r/knockoutjs](https://www.reddit.com/r/knockoutjs/)
- [Google Groups](https://groups.google.com/forum/#!forum/knockoutjs)
- [StackOverflow [knockout.js]](http://stackoverflow.com/tags/knockout.js/info)
