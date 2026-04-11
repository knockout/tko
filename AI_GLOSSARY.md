# AI_GLOSSARY.md — TKO Technical Knockout

Domain-specific terms for the TKO monorepo. Intended as a compact reference for
AI agents and contributors.

**Related context documents:**
- [tko.io/public/agent-guide.md](tko.io/public/agent-guide.md) — API reference,
  gotchas, runnable examples, and playground URL format for AI agents.
- [tko.io/public/agent-testing.md](tko.io/public/agent-testing.md) — how to run
  and verify TKO code without human interaction.
- [tko.io/public/llms.txt](tko.io/public/llms.txt) — discovery entry point for
  agent-facing documentation.

---

## Table of Contents

1. [Core Reactive Primitives](#core-reactive-primitives)
2. [Extenders](#extenders)
3. [Observable API Methods](#observable-api-methods)
4. [Dependency Tracking](#dependency-tracking)
5. [Binding System](#binding-system)
6. [Binding Context Variables](#binding-context-variables)
7. [Binding Handlers](#binding-handlers)
8. [Built-in Bindings — Core](#built-in-bindings--core)
9. [Built-in Bindings — Control Flow](#built-in-bindings--control-flow)
10. [Built-in Bindings — Components & Templates](#built-in-bindings--components--templates)
11. [Virtual Elements (Comment Bindings)](#virtual-elements-comment-bindings)
12. [Provider System](#provider-system)
13. [Component System](#component-system)
14. [JSX / TSX Path](#jsx--tsx-path)
15. [LifeCycle](#lifecycle)
16. [DOM Utilities](#dom-utilities)
17. [Tasks / Microtask Scheduler](#tasks--microtask-scheduler)
18. [MVVM Pattern Terms](#mvvm-pattern-terms)
19. [Build & Architecture Terms](#build--architecture-terms)
20. [Governance & Process Terms](#governance--process-terms)

---

## Core Reactive Primitives

### `observable`
**Package:** `@tko/observable` — [packages/observable/src/observable.ts](packages/observable/src/observable.ts)

A function that doubles as a value container. Calling it with no arguments reads
the current value; calling it with an argument writes a new value and notifies
all subscribers.

```js
const name = ko.observable('Bob')
name()          // read → 'Bob'
name('Mary')    // write → notifies all subscribers
```

- Internally stores the value under `observable[LATEST_VALUE]`.
- Write returns `this`, enabling chaining: `name('Mary').age(50)`.
- Duplicate primitive writes are silently ignored (via `equalityComparer`).
- Object writes always notify (object equality is never assumed).

---

### `observableArray`
**Package:** `@tko/observable` — [packages/observable/src/observableArray.ts](packages/observable/src/observableArray.ts)

An observable whose value is an array. Adds array-mutation methods that
automatically notify subscribers: `push`, `pop`, `shift`, `unshift`, `splice`,
`reverse`, `sort`, `replace`, `remove`, `removeAll`, `destroy`, `destroyAll`,
`reversed`, `sorted`, `indexOf`, `slice`.

- `remove(item)` — deletes from array.
- `destroy(item)` — sets `item._destroy = true` (soft delete; Rails-style server sync).
- `removeAll()` — empties array; `removeAll([a, b])` removes matching items.
- Supports fine-grained `arrayChange` diff tracking via the `trackArrayChanges` extender.

---

### `subscribable`
**Package:** `@tko/observable` — [packages/observable/src/subscribable.ts](packages/observable/src/subscribable.ts)

Base class for all reactive objects (`observable`, `observableArray`, `computed`).
Provides `subscribe`, `notifySubscribers`, `getSubscriptionsCount`, `getVersion`,
`hasChanged`, `updateVersion`, `isDifferent`, `once`, `when`, `yet`, `next`.
Implements the TC39 Observable proposal interface (`Symbol.observable`) and the
A+ Promise `thenable` interface.

---

### `Subscription`
**Package:** `@tko/observable` — [packages/observable/src/Subscription.ts](packages/observable/src/Subscription.ts)

The return value of `.subscribe()`. Call `.dispose()` to stop receiving
notifications. `disposeWhenNodeIsRemoved(node)` auto-disposes when a DOM node is
removed. Also exposes `unsubscribe()` and `closed` per the TC39 Observable API.

---

### `computed` (formerly `dependentObservable`)
**Package:** `@tko/computed` — [packages/computed/src/computed.ts](packages/computed/src/computed.ts)

A derived observable whose value comes from a `read` function. Automatically
tracks which observables are accessed during evaluation and re-evaluates when any
dependency changes.

```js
const full = ko.computed(() => firstName() + ' ' + lastName())
// writable form
const full = ko.computed({ read: () => ..., write: v => ... })
```

Key options: `read`, `write`, `owner`, `pure`, `deferEvaluation`,
`disposeWhenNodeIsRemoved`, `disposeWhen`.

Internal state flags: `isStale`, `isDirty`, `isSleeping`, `isDisposed`,
`isBeingEvaluated`.

---

### `pureComputed` / pure computed
**Package:** `@tko/computed` — [packages/computed/src/computed.ts](packages/computed/src/computed.ts)

A computed that **sleeps** (disposes all dependency subscriptions) when it has no
active subscribers. Wakes and re-subscribes when a subscriber is added. Preferred
over `ko.computed` in almost all cases. Equivalent to
`ko.computed({ pure: true })`.

- Must follow pure-function rules: no side effects, value derived only from
  observable dependencies.
- Do not use for side-effect computeds (use a plain `ko.computed` there).

```js
const full = ko.pureComputed(() => firstName() + ' ' + lastName())
```

---

### `when`
**Package:** `@tko/computed` — [packages/computed/src/when.ts](packages/computed/src/when.ts)

Runs a callback (or returns a Promise) the first time a predicate becomes truthy.
Uses `pureComputed` internally.

```js
ko.when(viewModel.isReady, () => console.log('Ready'))
ko.when(() => obs() > 5).then(v => console.log('Got:', v))
```

---

## Extenders

### `extend`
**Package:** `@tko/observable` — [packages/observable/src/extenders.ts](packages/observable/src/extenders.ts)

Modifies the behaviour of an observable or computed by wrapping or augmenting it.
Applied via `.extend({ extenderName: options })`. Built-in extenders: `notify`,
`rateLimit`, `deferred`, `throttle`, `trackArrayChanges`.

---

### `notify` extender
Changes when notifications are published. `'always'` sets `equalityComparer` to
`null` so the observable always fires even when the value has not changed.

```js
obs.extend({ notify: 'always' })
```

---

### `rateLimit` extender
**Package:** `@tko/observable` — [packages/observable/src/extenders.ts](packages/observable/src/extenders.ts)

Limits how frequently change notifications are issued. Accepts a number (timeout
in ms) or `{ timeout, method }`. `method: 'notifyWhenChangesStop'` uses debounce;
default uses throttle.

```js
obs.extend({ rateLimit: { timeout: 500, method: 'notifyWhenChangesStop' } })
```

---

### `deferred` extender / `deferUpdates`
**Package:** `@tko/observable` — [packages/observable/src/defer.ts](packages/observable/src/defer.ts)

Schedules notifications via `ko.tasks` (microtask queue) rather than
synchronously. Only accepts `true`. Once enabled, cannot be disabled. When
`ko.options.deferUpdates = true` the flag applies to all observables and
computeds globally.

```js
obs.extend({ deferred: true })
```

---

### `throttle` extender
**Package:** `@tko/computed` — [packages/computed/src/throttleExtender.ts](packages/computed/src/throttleExtender.ts)

Legacy extender. For computed observables throttles re-evaluation; for writable
observables throttles writes. Superseded by the `rateLimit` extender.

---

### `trackArrayChanges` extender
**Package:** `@tko/observable` — [packages/observable/src/observableArray.changeTracking.ts](packages/observable/src/observableArray.changeTracking.ts)

Enables fine-grained change notifications on `observableArray` via the
`arrayChange` event. Each notification value is an array of
`{ status: 'added'|'deleted'|'moved', value, index }` objects. Used internally
by `foreach` to make DOM updates O(changes) rather than O(array length).

---

## Observable API Methods

### `peek()`
Reads the current value without registering a dependency. Essential inside
computeds when a value is needed without making it a tracked dependency.

```js
obs.peek() // read without dependency tracking
```

---

### `valueHasMutated()` / `valueWillMutate()`
Manually trigger `change` / `beforeChange` events. Use when an observable's
value has been mutated in-place (e.g., a direct array element write) without the
observable knowing about it.

---

### `modify(fn, peek?)`
Update the value via a transformation function. `fn` receives the current value
and returns the new value.

```js
count.modify(v => v + 1)
```

---

### `subscribe(callback, target?, event?)`
Register a subscriber function. Returns a `Subscription`. Supported events:
`'change'` (default), `'beforeChange'`, `'spectate'`, `'dirty'`, `'arrayChange'`.
Also accepts a TC39 Observer object `{ next: fn }`.

---

### `once(cb)`
Subscribe for exactly one notification then auto-dispose.

---

### `next()`
Returns a Promise that resolves on the next value change.

---

### `when(testFnOrValue)` / `yet(testFnOrValue)`
Instance methods on `subscribable`. `when` resolves when the value matches the
predicate; `yet` resolves when it does **not** match.

---

### `ko.toJS(object)` / `ko.toJSON(object)`
**Package:** `@tko/observable` — [packages/observable/src/mappingHelpers.ts](packages/observable/src/mappingHelpers.ts)

Recursively unwrap all observables in an object graph to plain JS values
(`toJS`) or a JSON string (`toJSON`).

---

### `proxy(object)`
**Package:** `@tko/computed` — [packages/computed/src/proxy.ts](packages/computed/src/proxy.ts)

An ES `Proxy` wrapper that automatically promotes plain object properties to
observables, observableArrays, or pureComputeds. Functions become deferred pure
computeds; arrays become observableArrays; plain values become observables.
Getting/setting a property transparently proxies through the underlying
observable.

---

## Dependency Tracking

### `dependencyDetection` / dependency tracking
**Package:** `@tko/observable` — [packages/observable/src/dependencyDetection.ts](packages/observable/src/dependencyDetection.ts)

The internal mechanism that records which observables a `computed` depends on.
Uses a frame stack (`outerFrames` / `currentFrame`). When a computed evaluates it
opens a frame; any observable read calls `registerDependency`. After evaluation
the frame closes.

Key functions:
- `begin(options)` — push a tracking frame.
- `end()` — pop the tracking frame.
- `registerDependency(subscribable)` — record a dependency in the current frame.
- `ignore(fn)` — execute `fn` without tracking (a.k.a. `ignoreDependencies`).
- `getDependenciesCount()` — count active dependencies in current frame.
- `isInitial()` — `true` during a computed's first evaluation.

Also exposed as `computedContext` for compatibility with KO 3.x code.

---

### `LATEST_VALUE`
**Package:** `@tko/observable` — [packages/observable/src/subscribable.ts](packages/observable/src/subscribable.ts)

`Symbol('Knockout latest value')`. The property key on observable instances where
the current value is stored. TC39-style observers receive this value immediately
on subscription.

---

### `equalityComparer`
**Package:** `@tko/observable` — [packages/observable/src/observable.ts](packages/observable/src/observable.ts)

A function `(oldValue, newValue) => boolean` on observables and computeds that
decides whether a change notification should be suppressed. Default:
`valuesArePrimitiveAndEqual` (strict equality for primitives, always unequal for
objects). Set to `null` to always notify regardless of value. Can be replaced via
the `notify` extender.

---

## Binding System

### `data-bind` attribute
HTML attribute specifying one or more bindings for an element. Parsed at runtime
by the active binding provider.

```html
<span data-bind="text: message, css: { active: isActive }"></span>
```

---

### `ko.applyBindings(viewModel, element?)`
**Package:** `@tko/bind` — [packages/bind/src/applyBindings.ts](packages/bind/src/applyBindings.ts)

Activates the TKO binding system on an element (default: `document.body`).
Creates a root `bindingContext` and walks the DOM tree, applying bindings from
the provider. Returns a `BindingResult`. Cannot be called twice on the same node.

```js
ko.applyBindings(viewModel)
ko.applyBindings(viewModel, document.getElementById('app'))
```

---

### `ko.dataFor(element)` / `ko.contextFor(element)`
Return the view-model data or `bindingContext` object associated with a given DOM
node. Useful in event handlers or third-party libraries that need to retrieve
associated data.

---

### `bindingContext`
**Package:** `@tko/bind` — [packages/bind/src/bindingContext.ts](packages/bind/src/bindingContext.ts)

The scope object passed to every binding handler. Carries `$data`, `$root`,
`$parent`, `$parents`, `$rawData`, `$index` (inside `foreach`),
`$parentContext`, `$component`, and `ko`.

Key methods:
- `createChildContext(dataOrAccessor, alias?, extendCb?)` — create a child scope
  (used by `with`, `foreach`).
- `createStaticChildContext(data, alias)` — non-reactive child context.
- `extend(properties | fn)` — merge extra properties into the context (used by
  `let`).
- `lookup(token, globals, node)` — resolve a token: checks `$data`, context,
  globals; throws if not found.

---

### `BindingResult`
**Package:** `@tko/bind` — [packages/bind/src/BindingResult.ts](packages/bind/src/BindingResult.ts)

Returned by `applyBindings`. Properties: `isSync`, `isComplete`,
`completionPromise`, `rootNode`, `bindingContext`. Allows callers to await full
async binding completion.

---

## Binding Context Variables

| Variable | Meaning |
|---|---|
| `$data` | Current view model in the current context |
| `$root` | The topmost view model passed to `applyBindings` |
| `$parent` | The view model one level up in the binding context hierarchy |
| `$parents` | Array of all ancestor view models; `$parents[0]` === `$parent` |
| `$parentContext` | The binding context object at the parent level (not just the data) |
| `$index` | Zero-based observable index of the current item inside `foreach` |
| `$rawData` | The raw (possibly observable) view model; `$data` is the unwrapped value |
| `$context` | The current binding context object itself |
| `$element` | The bound DOM node (or comment node for virtual elements) |
| `$component` | The component's view model (inside component templates) |
| `$componentTemplateNodes` | Original child nodes passed into a component |
| `$componentTemplateSlotNodes` | Named slot nodes keyed by `slot` attribute |

---

## Binding Handlers

### `BindingHandler`
**Package:** `@tko/bind` — [packages/bind/src/BindingHandler.ts](packages/bind/src/BindingHandler.ts)

A class extending `LifeCycle` that defines how a named binding interacts with the
DOM. The class-based API supersedes the legacy `{ init, update }` object API.

Class-based properties:
- `$element` — the DOM element.
- `$context` — the binding context.
- `$data` — the current view model.
- `valueAccessor` — function returning the binding's value.
- `allBindings` — accessor for all bindings on this element.
- `get controlsDescendants()` — return `true` if this binding manages child
  bindings itself.
- `static allowVirtualElements` — `true` if the handler works in comment nodes.
- `static isBindingHandlerClass` — always `true` for class-based handlers.
- `bindingCompleted` — `Promise<boolean>` or `boolean`; for async
  / descendant-controlling bindings.

Legacy object form (still supported):
```js
ko.bindingHandlers.myBinding = {
  init(element, valueAccessor, allBindings, viewModel, bindingContext) {},
  update(element, valueAccessor, allBindings, viewModel, bindingContext) {}
}
```

---

### `allBindings`
Passed to binding handlers. A function and object with `.get(name)` and
`.has(name)` to access other bindings on the same element. Used for
inter-binding communication (e.g., `checked` reads `checkedValue` and `value`;
`options` reads `optionsCaption`).

---

### `controlsDescendantBindings`
Flag returned from a legacy binding handler's `init` function (or returned by
`get controlsDescendants()` in the class form). When `true`, TKO will not
automatically apply bindings to descendant elements — the handler takes full
responsibility. Required for: `if`, `with`, `foreach`, `component`, `template`,
`let`, `using`.

---

### `DescendantBindingHandler`
**Package:** `@tko/bind` — [packages/bind/src/DescendantBindingHandler.ts](packages/bind/src/DescendantBindingHandler.ts)

Abstract base for bindings that control their own descendants (e.g., `component`,
`foreach`, `template`). Extends `AsyncBindingHandler`.

---

### `AsyncBindingHandler`
**Package:** `@tko/bind` — [packages/bind/src/BindingHandler.ts](packages/bind/src/BindingHandler.ts)

Binding handler base class supporting asynchronous initialisation (e.g., waiting
for a component to load). Uses a `completeBinding` callback pattern.

---

### `LegacyBindingHandler`
**Package:** `@tko/bind` — [packages/bind/src/LegacyBindingHandler.ts](packages/bind/src/LegacyBindingHandler.ts)

Wraps old-style `{ init, update }` objects into the `BindingHandler` class
interface so TKO can treat them uniformly.

---

### `bindingEvent`
**Package:** `@tko/bind` — [packages/bind/src/bindingEvent.ts](packages/bind/src/bindingEvent.ts)

Event system for binding lifecycle notifications on DOM nodes.

Events:
- `childrenComplete` — all direct children have finished binding.
- `descendantsComplete` — all descendants (including async) have finished binding.

Used to coordinate async component loading and server-side pre-rendering.

---

## Built-in Bindings — Core

### `text`
**Package:** `@tko/binding.core`  
Sets the text content of an element. Works on virtual elements.

```html
<span data-bind="text: message"></span>
```

---

### `html`
**Package:** `@tko/binding.core`  
Sets the `innerHTML` of an element. Configure `ko.options.sanitizeHtmlTemplate`
(e.g., with DOMPurify) to mitigate XSS.

---

### `visible` / `hidden`
**Package:** `@tko/binding.core`  
Toggles `display:none` based on a truthy/falsy value. `hidden` is the inverse.
Unlike `if`, the element stays in the DOM.

---

### `css` (alias: `class`)
**Package:** `@tko/binding.core`  
Adds/removes CSS classes. Object form: `{ className: boolObservable }`. String
form: sets the class string directly.

```html
<div data-bind="css: { active: isActive, error: hasError }"></div>
```

---

### `style`
**Package:** `@tko/binding.core`  
Sets inline CSS styles from an object. Keys are camelCase or CSS property names.

```html
<div data-bind="style: { color: colorObs, fontWeight: 'bold' }"></div>
```

---

### `attr`
**Package:** `@tko/binding.core`  
Sets/removes HTML attributes dynamically. Supports XML namespace prefixes (e.g.,
`svg:href`). Value of `false`, `null`, or `undefined` removes the attribute.

```html
<a data-bind="attr: { href: url, title: tooltip }"></a>
```

---

### `value`
**Package:** `@tko/binding.core`  
Two-way binding to form control values (`<input>`, `<select>`, `<textarea>`).
Updates on `change` event by default. Use `valueUpdate: 'input'` for real-time
updates. Has `valueAllowUnset` option for `<select>`.

---

### `textInput`
**Package:** `@tko/binding.core`  
Two-way binding that updates on every keystroke, paste, drag, and autofill.
Preferred over `value` when the model must stay in continuous sync with user input.

---

### `checked`
**Package:** `@tko/binding.core`  
Two-way binding for checkbox and radio-button state. Works with boolean
observables, or arrays for multi-select checkboxes. Reads `checkedValue` (or
`value`) for the value to add/remove from an array.

---

### `click`
**Package:** `@tko/binding.core`  
Shorthand for `event: { click: handler }`. Handler receives `(viewModel, event)`.

---

### `event`
**Package:** `@tko/binding.core`  
Maps DOM events to handler functions. Supports `passive`, `capture`, `once` DOM
event options plus `debounce` and `throttle`. Return `false` from the handler to
`preventDefault`; return `true` to allow the default. Has `bubble` option to
control propagation.

```html
<button data-bind="event: { mouseenter: showTooltip, mouseleave: hideTooltip }"></button>
```

---

### `submit`
**Package:** `@tko/binding.core`  
Binds a function to a `<form>`'s `submit` event, preventing default form
submission.

---

### `enable` / `disable`
**Package:** `@tko/binding.core`  
Controls the `disabled` attribute of form controls. `enable` enables when truthy;
`disable` disables when truthy.

---

### `hasFocus`
**Package:** `@tko/binding.core`  
Two-way binding tracking whether an element has focus. Writing `true` sets focus;
writing `false` blurs. Uses `document.activeElement` for accurate cross-tab
tracking.

---

### `options`
**Package:** `@tko/binding.core`  
Populates `<select>` option elements from an array. Related parameters:
`optionsText`, `optionsValue`, `optionsCaption`, `optionsIncludeDestroyed`,
`valueAllowUnset`. Works with `value` and `selectedOptions`.

---

### `selectedOptions`
**Package:** `@tko/binding.core`  
Two-way binding for multi-select `<select>`. Reads/writes an array of selected
values. Must run after `options` and `foreach`.

---

### `uniqueName`
**Package:** `@tko/binding.core`  
Generates a unique `name` attribute for form elements when none is provided.
Required for grouped radio buttons in some scenarios.

---

### `let`
**Package:** `@tko/binding.core`  
Injects extra variables into the binding context for descendants. Extends (does
not replace) the current context.

```html
<div data-bind="let: { fullName: firstName() + ' ' + lastName() }">
  <span data-bind="text: fullName"></span>
</div>
```

---

### `using`
**Package:** `@tko/binding.core`  
Creates a child binding context from a given value (like `with`) but does not
conditionally render based on truthiness.

---

### `descendantsComplete`
**Package:** `@tko/binding.core`  
Callback binding. The provided function is called when all descendant bindings
(including async ones) have completed.

---

## Built-in Bindings — Control Flow

### `if` / `ifnot`
**Package:** `@tko/binding.if`  
Conditionally renders or removes DOM content. `if` renders when truthy; `ifnot`
renders when falsy. Unlike `visible`, actually adds/removes nodes from the DOM.
Supports an `<!-- else -->` comment sibling pattern.

```html
<!-- ko if: isLoggedIn -->
  <div data-bind="text: username"></div>
<!-- /ko -->
<!-- else -->
  <div>Please log in</div>
<!-- /ko -->
```

---

### `with`
**Package:** `@tko/binding.if`  
Creates a child binding context (changing `$data`) for descendants. Also
conditionally renders: if the value is falsy, the block is hidden. Supports the
`as` alias parameter.

```html
<div data-bind="with: customer">
  <span data-bind="text: name"></span>  <!-- customer.name -->
</div>
```

---

### `else` (comment binding)
**Package:** `@tko/binding.if`  
Used as a sibling of `if` or `foreach`. When the preceding conditional binding's
condition is false, or the array is empty, renders this block.
Written as `<!-- else -->`.

---

### `foreach`
**Package:** `@tko/binding.foreach`  
Renders a template once for each item in an array. For `observableArray`,
efficiently adds/removes/moves DOM nodes as the array changes (via `arrayChange`
diff). Exposes `$index` as an observable in the child context.

Options object form: `{ data: array, as: 'item', afterAdd, beforeRemove,
afterQueueFlush, beforeQueueFlush, templateNode, name }`.

```html
<ul data-bind="foreach: people">
  <li data-bind="text: name"></li>
</ul>
```

---

## Built-in Bindings — Components & Templates

### `template`
**Package:** `@tko/binding.template`  
Renders a named template (by element `id`) or an inline anonymous template
against a data object. The **native template** mechanism (used internally by
`foreach`, `if`, `with`) clones and re-renders the element's own inner markup.
String-based templating is the legacy path for third-party template engines.

---

### `component`
**Package:** `@tko/binding.component`  
Injects a registered component. Accepts a string (component name) or
`{ name, params }` object.

```html
<div data-bind="component: { name: 'my-comp', params: { x: value } }"></div>
```

Looks up the name in the component registry, clones the template into the
element, creates the view model, and builds a child binding context with
`$component`, `$componentTemplateNodes`, `$componentTemplateSlotNodes`.

---

### `slot` (component slots)
**Package:** `@tko/binding.component`  
Nodes passed to a component element with a `slot="name"` attribute are captured
into `$componentTemplateSlotNodes`. The `slot` binding inside the component
template renders the named slot.

---

## Virtual Elements (Comment Bindings)

### Virtual Elements / Comment Bindings
**Package:** `@tko/utils` — [packages/utils/src/dom/virtualElements.ts](packages/utils/src/dom/virtualElements.ts)

Bindings on HTML comments instead of real elements, enabling containerless
templates. Pattern: `<!-- ko bindingName: expression -->…<!-- /ko -->`.

```html
<!-- ko foreach: items -->
  <span data-bind="text: $data"></span>
<!-- /ko -->
```

`allowedBindings` controls which handlers may be used on virtual elements:
`text`, `foreach`, `if`, `ifnot`, `with`, `let`, `using`, `template`,
`component`.

TKO treats paired comment nodes as a virtual parent with
"virtual children" — the nodes between `<!-- ko -->` and `<!-- /ko -->`.
`virtualElements.childNodes()`, `firstChild()`, `nextSibling()`,
`setDomNodeChildren()` all understand both real and virtual element boundaries.

---

## Provider System

### Provider
**Package:** `@tko/provider` — [packages/provider/src/Provider.ts](packages/provider/src/Provider.ts)

Abstract base class that maps DOM nodes to binding accessors. Responsible for
deciding **which nodes have bindings** and **what those bindings are**.

| Property / Method | Purpose |
|---|---|
| `FOR_NODE_TYPES` | Array of `Node.*_NODE` integers this provider handles |
| `nodeHasBindings(node, context?)` | Returns `true` if this provider has bindings for the node |
| `getBindingAccessors(node, context?)` | Returns `{ bindingName: valueAccessorFn }` |
| `preprocessNode(node)` | Pre-processing hook to rewrite/expand nodes before binding |
| `preemptive` | If `true`, stops other providers from processing the same node |

---

### `DataBindProvider`
**Package:** `@tko/provider.databind`  
Reads the `data-bind` attribute from element nodes and parses it as a binding
string. The standard HTML binding syntax provider; only handles `ELEMENT_NODE`.

---

### `MultiProvider`
**Package:** `@tko/provider.multi`  
Composes multiple providers together, delegating to each in order. If a provider
is `preemptive`, it stops further processing of that node. Used to combine
`DataBindProvider`, `VirtualProvider`, `ComponentProvider`, mustache providers,
`NativeProvider`, etc.

---

### `NativeProvider`
**Package:** `@tko/provider.native`  
Reads bindings stored as `ko-*` properties on a DOM node's `NATIVE_BINDINGS`
symbol property (set by `tko.jsx.render()`). Is `preemptive`. The bridge between
the JSX/TSX compilation path and the binding engine. Handles `ELEMENT_NODE` and
`TEXT_NODE`.

---

### `TextMustacheProvider` / `AttributeMustacheProvider`
**Package:** `@tko/provider.mustache`  
Supports `{{ expression }}` interpolation syntax in text nodes and attribute
values (Knockout Punches style).

---

### `VirtualProvider`
Handles `<!-- ko binding: expr --><!-- /ko -->` comment-node syntax.

---

### `ComponentProvider` / `AttributeProvider`
Providers for custom element syntax (`<my-component>`) and `ko-*` attribute
syntax on non-JSX HTML nodes.

---

### Provider chain / `bindingProviderInstance`
`ko.options.bindingProviderInstance` holds the active provider. Typically a
`MultiProvider` combining several sub-providers. Configure it before calling
`ko.applyBindings`.

---

### `BindingStringProvider` / binding string
**Package:** `@tko/provider.bindingstring`  
Base class for providers that parse "binding strings" — the `data-bind` value
format such as `"text: name, css: { active: isActive }"`. Parsing is performed by
`@tko/utils.parser` (`Parser`), which does **not** use `eval` or `new Function`,
making it compatible with strict Content Security Policies (CSP).

---

## Component System

### `ko.components.register(name, config)`
**Package:** `@tko/utils.component` — [packages/utils.component/src/registry.ts](packages/utils.component/src/registry.ts)

Registers a component. `name` should be lowercase dash-separated (valid custom
element name). `config`: `{ viewModel, template, synchronous? }`.

```js
ko.components.register('my-widget', {
  viewModel: function(params) { this.x = ko.observable(params.x || 0) },
  template: '<span data-bind="text: x"></span>'
})
```

---

### `ko.components.get(name, callback)`
Consults all registered component loaders in sequence to find the first that can
supply the named component's definition.

---

### `ComponentABC`
**Package:** `@tko/utils.component` — [packages/utils.component/src/ComponentABC.ts](packages/utils.component/src/ComponentABC.ts)

Abstract base class for components that also extends `LifeCycle`. Provides
`static get elementName`, `static get element`, `static register()`. Converts
the class name to kebab-case for the custom element name automatically.

---

### Custom Elements
After registering a component, it can be used with the WebComponents-style
element syntax:

```html
<my-widget params="x: value"></my-widget>
```

TKO detects custom element names and activates the `component` binding
internally.

---

### Component Loaders
Custom lookup strategies for resolving component definitions. Implement
`getConfig`, `loadComponent`, `loadTemplate`, `loadViewModel`. Registered in
`ko.components.loaders` array. Enables AMD/RequireJS integration, file-based
loading, and naming-convention patterns.

---

### `createViewModel` factory
A function `(params, componentInfo) => viewModel` used in component registration.
`componentInfo.element` is the host element;
`componentInfo.templateNodes` is the array of original child nodes (useful for
transclusion/slot patterns).

---

### `synchronous` (component option)
If `true` on a component's config, the component loads and renders synchronously
instead of via the task queue.

---

## JSX / TSX Path

### TSX / `ko-*` attributes
**Package:** `@tko/utils.jsx`, `@tko/provider.native`

A compile-time JSX syntax. JSX is transformed by esbuild using
`tko.jsx.createElement` as the factory. At runtime, `tko.jsx.render()` converts
the virtual DOM tree to actual DOM nodes, attaching binding values as
`NATIVE_BINDINGS` on each node. `NativeProvider` then activates them when
`ko.applyBindings` runs.

```tsx
const view = <span ko-text={message} />
```

Inside `ko-foreach` children, binding-context variables must use string syntax
(`ko-text="$data"` not `ko-text={$data}`) because those variables do not exist
in JS scope at compile time.

---

### `tko.jsx.createElement(elementName, attributes, ...children)`
**Package:** `@tko/utils.jsx` — [packages/utils.jsx/src/jsx.ts](packages/utils.jsx/src/jsx.ts)

The JSX factory (analogous to React's `createElement`). Produces virtual DOM
objects: `{ elementName, attributes, children }`. Configure in esbuild via
`jsxFactory: 'tko.jsx.createElement'`.

---

### `tko.jsx.Fragment`
A Symbol representing a JSX Fragment (`<>…</>`). Children of a Fragment are
returned as a flat array.

---

### `tko.jsx.render(jsxOrObservable)`
Converts a JSX virtual DOM tree to actual DOM nodes. Returns `{ node, dispose }`.
Observable JSX values are tracked reactively — DOM is updated when the observable
changes.

---

### `JsxObserver`
**Package:** `@tko/utils.jsx` — [packages/utils.jsx/src/JsxObserver.ts](packages/utils.jsx/src/JsxObserver.ts)

Reactive observer for JSX values. Extends `LifeCycle`. Handles observables
containing JSX, arrays of JSX, and nested JSX structures. Updates the DOM when
observable values change. Used internally by `render()` and the component
binding's JSX template path.

---

### `maybeJsx(value)`
Heuristic test for whether a value is a JSX object (has `elementName`), an array
of JSX, or an observable containing JSX.

---

### `NATIVE_BINDINGS` symbol
**Package:** `@tko/provider.native`  
`Symbol('Knockout native bindings')`. The property key under which
`NativeProvider.addValueToNode` stores `ko-*` binding values on DOM nodes.
Communication channel between `tko.jsx.render()` and `NativeProvider`.

---

## LifeCycle

### `LifeCycle`
**Package:** `@tko/lifecycle` — [packages/lifecycle/src/LifeCycle.ts](packages/lifecycle/src/LifeCycle.ts)

Base class (or mixin via `LifeCycle.mixInto`) for objects that own subscriptions,
computeds, and event listeners. Automatically disposes all owned resources when
the lifecycle ends. All built-in `BindingHandler` subclasses extend `LifeCycle`.

Methods: `computed(params)`, `subscribe(obs, action)`,
`addEventListener(node, type, handler)`, `anchorTo(node)`, `addDisposable(obj)`,
`dispose()`.

`anchorTo(node)` — auto-disposes the lifecycle when the DOM node is cleaned.

---

### `dispose()`
Stops all subscriptions, computeds, and event listeners owned by a `LifeCycle`.
After disposal, reading a computed returns its last cached value but no longer
tracks dependencies.

---

## DOM Utilities

### `domData`
**Package:** `@tko/utils` — [packages/utils/src/dom/data.ts](packages/utils/src/dom/data.ts)

Stores arbitrary data on DOM nodes using a Symbol property (`dataStoreSymbol`).
Avoids cross-window issues with `WeakMap`. Includes prototype-pollution protection
(rejects `__proto__`, `constructor`, `prototype` keys). Functions: `get`, `set`,
`getOrSet`, `clear`, `nextKey()`.

---

### `cleanNode(node)`
**Package:** `@tko/utils` — [packages/utils/src/dom/disposal.ts](packages/utils/src/dom/disposal.ts)

Runs all dispose callbacks registered for a node and its descendants, then erases
all `domData`. Called when removing nodes to prevent memory leaks.

---

### `removeNode(node)`
Calls `cleanNode` then removes the node from its parent.

---

### `addDisposeCallback(node, callback)` / `removeDisposeCallback`
**Package:** `@tko/utils` — [packages/utils/src/dom/disposal.ts](packages/utils/src/dom/disposal.ts)

Register / deregister a cleanup function to run when a DOM node is cleaned. Used
by `LifeCycle.anchorTo`, `Subscription.disposeWhenNodeIsRemoved`, and the
computed's `disposeWhenNodeIsRemoved` option.

---

### `disposeWhenNodeIsRemoved`
Option on `computed()` and `Subscription`. Automatically disposes the
computed/subscription when the given DOM node is cleaned.

---

## Tasks / Microtask Scheduler

### `ko.tasks` / `tasks`
**Package:** `@tko/utils` — [packages/utils/src/tasks.ts](packages/utils/src/tasks.ts)

A microtask queue backed by `MutationObserver` (Chrome 27+, Firefox 14+, IE 11+)
with a `setTimeout(fn, 0)` fallback. Used by the `deferred` extender and deferred
computeds to batch and coalesce updates.

Functions:
- `tasks.schedule(fn)` — enqueue a task; returns a handle.
- `tasks.cancel(handle)` — remove a queued task.
- `tasks.runEarly()` — flush the queue immediately (useful in tests).

---

## MVVM Pattern Terms

### MVVM (Model-View-View Model)
The design pattern that TKO implements:

| Layer | Responsibility |
|---|---|
| **Model** | App data (server-fetched, domain objects) |
| **View Model** | Pure-JS representation of data and operations for a UI screen; contains observables |
| **View** | HTML with `data-bind` declarations linking to the view model |

---

### View Model
A plain JavaScript object or class instance with observable properties. The
object passed to `ko.applyBindings()`. Has no knowledge of HTML.

---

### Declarative Bindings
The `data-bind="…"` attribute syntax. Describes *what* the UI should show/do,
not *how* DOM updates happen. TKO evaluates binding expressions at runtime.

---

## Build & Architecture Terms

### `@tko/build.knockout`
The backwards-compatible distribution that mirrors the classic Knockout.js 3.x
API surface. Use for projects migrating from Knockout 3.x.

---

### `@tko/build.reference`
The modern recommended distribution. Includes TSX, the full provider chain,
`ko-*` attribute syntax, and all modern TKO features.

---

### `ko.options` (Options class)
**Package:** `@tko/utils` — [packages/utils/src/options.ts](packages/utils/src/options.ts)

Global TKO configuration object. Key settings:

| Option | Purpose |
|---|---|
| `deferUpdates` | Defer all observable updates via `ko.tasks` |
| `bindingProviderInstance` | Set to a `MultiProvider` or custom provider |
| `bindingGlobals` | Object of globals accessible from all binding expressions |
| `defaultBindingAttribute` | Default `'data-bind'`; can be changed |
| `allowVirtualElements` | Toggle `<!-- ko -->` comment bindings |
| `sanitizeHtmlTemplate(html)` | Configure DOMPurify or similar for the `html` binding |
| `allowScriptTagsInTemplates` | Default `false` (security hardening) |
| `Promise` | Injectable Promise constructor |
| `knockoutInstance` | Reference to the active `ko` object (exported as `self.ko`) |

---

### `unwrap(valueOrObservable)`
If the argument is an observable, calls it and returns the value; otherwise
returns the argument unchanged. Equivalent to `ko.unwrap`.

---

### `isObservable(value)` / `isWriteableObservable` / `isComputed` / `isSubscribable`
Type-check utilities. `isSubscribable` tests for the `SUBSCRIBABLE_SYM` symbol.

---

### AMD / RequireJS
Legacy module loading format. TKO components can be registered with AMD-style
`{ require: 'module/path' }` template and viewmodel configs, resolved by the
component loader registry.

---

### CSP (Content Security Policy)
TKO's `data-bind` parser (`@tko/utils.parser`) does not use `eval` or
`new Function`, making it compatible with strict CSP headers that block
`unsafe-eval`. This is a deliberate design advantage over Knockout 3.x.

---

### Knockout Punches / Mustache syntax
The `{{ expression }}` interpolation syntax for text nodes and attribute values,
provided by `@tko/provider.mustache`. Inspired by the "Knockout Punches"
third-party plugin for classic Knockout.

---

### `memoization`
**Package:** `@tko/utils` — [packages/utils/src/memoization.ts](packages/utils/src/memoization.ts)

Internal mechanism used to avoid re-binding already-bound template nodes.
`memoization.unmemoizeDomNodeAndDescendants` activates bindings that were
deferred during template rewriting.

---

### `filter.punches`
**Package:** `@tko/filter.punches`  
Binding string preprocessing filters. Transforms shorthand filter syntax in
binding strings before the `@tko/utils.parser` processes them.

---

## Governance & Process Terms

### Verified Behaviors
**File:** [packages/*/verified-behaviors.json](packages/)  
Package-scoped, unit-test-backed behaviour contracts documenting exactly what TKO
guarantees for each feature. A canonical reference for AI agents and contributors.

---

### `plans/`
Directory of design plan documents for significant changes. Each plan documents:
objective, risk class, planned changes and steps, tooling used, validation
evidence, and follow-up owner. Plans should be created before implementation
begins for any substantial change.

---

### AI_COMPLIANCE.md
Normative policy baseline for all AI-assisted work in this repository. Takes
precedence over `AGENTS.md` when guidance conflicts.

---

### AGENTS.md
Operational context and repository-specific workflows for AI coding agents.
Should be read at the start of every AI agent session.

---

*Generated from source and docs — last updated April 2026.*
