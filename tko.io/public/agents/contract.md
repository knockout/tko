# TKO Agent Contract

Use this file when deciding how to divide state, bindings, and DOM work in TKO examples and prototypes.

## Core Rule

- Keep app state in observables, observableArrays, and computeds.
- Let standard bindings and custom bindings carry that state to the DOM.
- Use DOM lookup only to find the mount root for `ko.applyBindings(viewModel, element)`.

## Replace X With Y

Replace ad-hoc DOM/event/state handling with bindings. Not about binding-syntax style.

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

## DOM Mutation Containment

DOM mutation and direct DOM-API calls belong inside a `BindingHandler` (a class that extends `LifeCycle` and is registered as a binding). They do not belong in component view models, utility modules, or arbitrary class methods.

Violations (do not do outside a `BindingHandler`):
- `document.createElement`, `document.body.appendChild` — bypasses the binding pipeline
- `element.querySelector` / `querySelectorAll` — except to find a mount root for `applyBindings`
- `element.style.*`, `element.classList.*` — use the `style` / `css` bindings
- `element.addEventListener` — use `click`, `event:{…}`, or a binding handler
- `appendChild` / `insertBefore` / `replaceWith` — use `foreach`, `if`, `template`
- `element.innerHTML = …` — use `text` or (when trusted markup is the point) `html`; also flag XSS if content is external
- `element.focus()` / `element.select()` — use `hasFocus` or a focus-orchestration binding
- `requestAnimationFrame` for DOM scheduling — move inside a binding that owns the frame loop
- Storing `HTMLElement` references as component view-model fields — the element belongs to the binding

Where these calls are safe:
- inside a class that extends `BindingHandler` (its `constructor`/`init`/`update` receive the owning element)
- reading observables whose values drive DOM updates via bindings — that is the whole point
- direct DOM reads in tests/verification code after bindings are active

Binding handlers are the prescribed escape hatch for imperative DOM work: they receive the exact element, participate in the lifecycle, and dispose cleanly. Mutating the DOM from elsewhere creates a second source of truth for DOM state and the reactive graph loses sight of it.

## Component Design: Binding Handlers and Component View Models

### Binding handlers — narrow scope, one DOM task

Each `BindingHandler` subclass should do one thing to its element. A handler that sanitizes HTML *and* walks the DOM for citations *and* renders diagrams *and* rewrites tables should be split into separate handlers, each composable on the same element.

Violations:
- a binding handler performing multiple unrelated DOM operations — split by concern
- using a binding handler where a component with JSX would suffice — prefer declarative JSX when the rendering can be expressed that way

Not a violation:
- a handler that is complex because its single DOM task is inherently complex (rich-text editor, canvas renderer, third-party widget bridge)

### Component view models — rendering only

A component view model (a class registered with `components.register(...)`, typically extending `ComponentABC`) should contain only code that produces its template output. Data transformation, parsing, business rules, and utilities belong in standalone `.ts` files the component imports.

Violations:
- template method exceeding ~80 lines of JSX without decomposition — extract nested child components
- manipulating the DOM directly from a component method — delegate to a binding handler
- non-rendering logic (parsing, domain rules, formatting of structured data) embedded in the component — move to utilities
- instantiating a child component with `params={{ ... }}` wrapping every prop (see "Component Params in JSX" in `/agents/guide.md`)

Not a violation:
- a component that is large because it composes many small child components
- simple inline computeds that only map data for the template (`const label = ko.pureComputed(() => format(value()))`)

## Component Communication via `subscribable`

When a component needs to trigger an imperative action inside a binding handler (for example "print this iframe", "scroll to top", "focus on demand"), pass a `ko.subscribable` owned by the component into the handler. The handler subscribes in its constructor and disposes the subscription in `dispose`.

Do not model the command as an `observable` holding a function (`observable<(() => void) | null>(null)`). Function-valued observables capture closures that may retain DOM references, muddle cleanup, and do not broadcast.

```js
// Component owns the channel and fires events
class PrintableCard extends ComponentABC {
  printChannel = new ko.subscribable()
  onPrintClick = () => this.printChannel.notifySubscribers(null, 'print')
}

// Binding handler subscribes and disposes with its lifecycle
class PrintIframe extends BindingHandler {
  constructor (params) {
    super(params)
    const channel = this.value
    this.addDisposable(channel.subscribe(() => this.$element.contentWindow.print(), null, 'print'))
  }
}
```

The element reference stays inside the binding handler, `dispose` cleans up naturally, and multiple elements can listen on the same channel without coordination.

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
