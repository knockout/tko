# TKO Agent Contract

Use this file when deciding how state, bindings, and DOM work should be divided in TKO examples and prototypes.

## Core Rule

- Keep app state in observables, observableArrays, and computeds.
- Let standard bindings and custom bindings carry that state to the DOM.
- Use DOM lookup only to find the mount root for `ko.applyBindings(viewModel, element)`.

## Replace X With Y

- This section is about replacing ad-hoc DOM/event/state handling with bindings, not about binding-syntax style.
- If you are about to do `element.textContent = value`, use the `text` binding.
- If you are about to do `element.innerHTML = markup`, first ask whether the content should be plain text instead; prefer the `text` binding by default. Use `html` only when rendering trusted HTML is truly the point.
- If you are about to manually create, replace, or reconcile a repeated set of child nodes, use `foreach`.
- If you are about to toggle classes with `classList`, use `css`.
- If you are about to set attributes manually, use `attr`.
- If you are about to set inline styles from state, use `style`.
- If you are about to wire ordinary UI events with imperative listeners, use `click`, `event:{...}`, `value`, `textInput`, `checked`, or related built-in bindings.
- If you are about to call `focus()` or manage focus from state, use `hasFocus` when it fits.
- If you are about to mirror user input into plain mutable objects, store that input in observables instead.
- If you are about to keep counters, highlights, or explanatory UI state outside observables, move them into observables/computeds so the example demonstrates TKO rather than bypassing it.

## When Custom Bindings Are The Right Tool

Use a custom `bindingHandler` when the work is inherently DOM-specific and does not belong in the state layer.

Typical good fits:
- canvas drawing
- WebGL rendering
- SVG-specific effects
- animation
- resize / measurement
- focus orchestration when `hasFocus` is not enough
- third-party widget integration

In those cases:
- let observables remain the source of truth
- let the custom binding read observables and update the DOM
- avoid making the custom binding the authoritative owner of app state

## Security Preference

- Prefer `text` over `html`.
- Treat `html` as an exception for trusted markup, not the default way to render content.
- If the content originates from users, external services, or mixed trust levels, do not pass it through `html` unless it has been explicitly sanitized for that purpose.

## Mounting Is Allowed

These are normal:

```js
const root = document.getElementById('app')
ko.applyBindings(viewModel, root)
```

```js
const root = container.querySelector('[data-app-root]')
ko.applyBindings(viewModel, root)
```

The contract is not “never touch `document`”.
The contract is “do not let ad-hoc DOM mutation become your reactive state system”.

## Binding Syntax Preference

- `ko-*` and `data-bind` are both valid binding surfaces.
- The choice between them is primarily stylistic / authoring-oriented unless you specifically need classic provider-driven strings or are teaching the classic syntax directly.

## Render Loops

Render loops are acceptable when they belong to rendering:
- `requestAnimationFrame`
- canvas redraws
- WebGL frame submission
- resize observers

Prefer this split:
- state object: observables + domain actions
- renderer / custom binding: DOM, canvas, WebGL, RAF

## Tests

Direct DOM reads are fine in tests and verification code.
Example:

```js
ko.applyBindings(vm, document.getElementById('app'))
console.assert(document.querySelector('#app span').textContent === 'Hello')
```

That is verification code, not the app’s state/update architecture.
