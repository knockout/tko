# TKO Agent Guide

Test-backed behavior summaries live under `/agents/verified-behaviors/`. Treat those files as the contract layer when prose docs and implementation need reconciliation.

## Setup

```html
<script src="https://tko.io/lib/tko.js"></script>
<script>const ko = globalThis.tko</script>
```

## Observables

```js
ko.observable(val)        // create; call with no args to read, with arg to write
ko.observableArray([])    // array with push/pop/remove/removeAll/splice/replace
ko.computed(() => expr)   // auto-tracks dependencies, re-evaluates on change
ko.pureComputed(() => expr) // same but releases subscriptions when unobserved (saves memory) — prefer this
ko.computed({ read: () => v, write: (v) => {} }) // writable computed
ko.when(predicate, callback) // run once when predicate becomes truthy
ko.when(predicate).then(fn)  // promise form
obs.subscribe(fn)         // manual subscription
```

`ko.when` accepts either an observable or a predicate function. It uses computed dependency tracking, runs once when the predicate becomes truthy, and supports both callback and promise forms.

```js
ko.when(viewModel.isReady, () => console.log('Ready'))
ko.when(() => viewModel.isReady() && viewModel.hasData()).then(() => console.log('Ready'))
```

## Bindings

Activate with `ko.applyBindings(viewModel, element)`.

Syntax: `data-bind="bindingName: expression"` on HTML elements.

text, html, visible, hidden, css:{class:bool}, style:{prop:val}, attr:{name:val},
click, event:{name:fn}, value, textInput, checked, enable, disable,
foreach, if, ifnot, with, template:{name:'id'}, component:{name:'n',params:{}}

Context variables inside foreach: $data, $parent, $root, $index (observable), $element.

Binding notes:
- `textInput` binds an `<input>` or `<textarea>` with immediate two-way updates as the user types, pastes, drags, or accepts autofill. Prefer it over `value` when the model must update continuously.

```html
<input data-bind="textInput: query">
<textarea data-bind="textInput: notes"></textarea>
```

## Example Discipline

When the goal is to demonstrate TKO itself, keep the state flow inside observables, computeds, and bindings.

- Prefer `text`, `css`, `attr`, `event`, `foreach`, and `pureComputed` over manual DOM writes.
- Avoid driving visible state with `textContent`, `innerHTML`, `classList`, or ad-hoc `addEventListener` when bindings can express the same behavior.
- Use custom `bindingHandlers` only for DOM-specific effects that do not belong in the state layer, such as animation, focus, canvas, SVG, or third-party widget integration.
- If an example contrasts reactive models, the counters and highlighted state should also be observable-driven so the example demonstrates the pattern instead of bypassing it.

## Classic data-bind parsing and CSP

Classic `data-bind` parsing is provider-driven. Use `DataBindProvider` when you need binding strings, and combine it with other providers through `MultiProvider` as needed.

The classic parser does not rely on `eval` or `new Function`, so `data-bind` markup works under stricter Content Security Policies than older Knockout-era parser approaches.

## TSX vs HTML Syntax

TKO supports two binding syntaxes. The documentation shows both side-by-side in tabbed code blocks.

### HTML (data-bind) — runtime bindings

```html
<span data-bind="text: message"></span>
<button data-bind="click: handler">Label</button>
<ul data-bind="foreach: items"><li data-bind="text: $data"></li></ul>
```

- Bindings are **strings** evaluated at runtime by `ko.applyBindings(viewModel, element)`
- Binding-context variables (`$data`, `$parent`, `$index`, `$root`) resolve at runtime
- No build step needed — works directly in the browser
- Playground: put HTML in the HTML editor, JS in the TSX editor, run

### TSX (ko-*) — compile-time JSX expressions

```tsx
<span ko-text={message} />
<button ko-click={handler}>Label</button>
<ul ko-foreach={items}><li ko-text="$data" /></ul>
```

- `ko-*` attribute values in `{}` are **JavaScript expressions** transformed by esbuild at build time, then evaluated at runtime
- Top-level variables (`message`, `handler`, `items`) must be defined in scope before the JSX
- Binding-context variables inside `ko-foreach` children (like `$data`, `$parent`) use **string** syntax: `ko-text="$data"` (not `ko-text={$data}`)
- Requires esbuild JSX transform + `tko.jsx.render()` to produce DOM nodes
- `ko.applyBindings({}, container)` then activates the `ko-*` bindings on the rendered DOM

### Key difference: compile-time vs runtime

In HTML, `data-bind="foreach: people"` is a string — TKO evaluates `people` in the view model at runtime.

In TSX, `ko-foreach={people}` is a JSX expression — esbuild transforms the JSX syntax, and `people` must exist as a JavaScript variable in scope when the code runs:

```tsx
// Variables must be defined before the JSX expression
const people = ko.observableArray([...])

const view = (
  <ul ko-foreach={people}>
    <li ko-text="name" />   {/* string — resolved by knockout at runtime */}
  </ul>
)

const { node } = tko.jsx.render(view)
root.appendChild(node)
ko.applyBindings({}, root)
```

### Render pattern (required for ko-* bindings)

```tsx
const { node, dispose } = tko.jsx.render(<Component />)
container.appendChild(node)
tko.applyBindings({}, container) // activates ko-* bindings on the DOM
```

## Browser TSX transform (esbuild-wasm)

```js
import * as esbuild from 'https://cdn.jsdelivr.net/npm/esbuild-wasm@0.27.4/esm/browser.min.js'
await esbuild.initialize({ wasmURL: 'https://cdn.jsdelivr.net/npm/esbuild-wasm@0.27.4/esbuild.wasm' })
const result = await esbuild.transform(code, {
  loader: 'tsx',
  jsxFactory: 'tko.jsx.createElement',
  jsxFragment: 'tko.jsx.Fragment'
})
// result.code is ready to run as a JavaScript module
```

## Playground URLs

https://tko.io/playground accepts code via URL hash.

```js
// Encode
btoa(encodeURIComponent(JSON.stringify({ html, js })))
// Decode
JSON.parse(decodeURIComponent(atob(hash)))
```

Full URL: `https://tko.io/playground#${btoa(encodeURIComponent(JSON.stringify({ html, js })))}` 

## Example: Counter

HTML: `<div id="root"></div>`

```jsx
const count = ko.observable(0)
const Counter = () => (
  <div>
    <h2>Count: <span ko-text={count} /></h2>
    <button ko-click={() => count(count() + 1)}>+</button>
    <button ko-click={() => count(count() - 1)}>-</button>
    <button ko-click={() => count(0)}>Reset</button>
  </div>
)
const root = document.getElementById('root')
const { node } = tko.jsx.render(<Counter />)
root.appendChild(node)
tko.applyBindings({}, root)
```

## Example: Todo List

HTML: `<div id="root"></div>`

```jsx
const newTodo = ko.observable('')
const todos = ko.observableArray([])
const remaining = ko.pureComputed(() => todos().filter(t => !t.done()).length)

function addTodo() {
  const text = newTodo().trim()
  if (text) { todos.push({ text: ko.observable(text), done: ko.observable(false) }); newTodo('') }
}

const App = () => (
  <div>
    <h2>Todos (<span ko-text={remaining} /> left)</h2>
    <input ko-value={newTodo} placeholder="New todo..." />
    <button ko-click={addTodo}>Add</button>
    <ul ko-foreach={todos}>
      <li>
        <input type="checkbox" ko-checked="done" />
        <span ko-text="text" />
        <button ko-click="$parent.removeTodo($data)">x</button>
      </li>
    </ul>
  </div>
)
const root = document.getElementById('root')
const { node } = tko.jsx.render(<App />)
root.appendChild(node)
tko.applyBindings({ removeTodo: t => todos.remove(t) }, root)
```

## Gotchas

- **Async computeds are dangerous.** Dependency tracking runs synchronously — it records which observables are read during the evaluator, then stops. An `async` evaluator returns a Promise at the first `await`, so any observable reads after that are outside the tracking window and never registered as dependencies. The computed cannot know when the async function finishes (halting problem). If you must use async computeds, read all observable dependencies *before* the first `await`.
- **Don't create computeds/subscriptions inside computeds.** A computed re-evaluates every time a dependency changes. If the evaluator creates a new `computed()` or `subscribe()` each run, those pile up and never get disposed — memory and CPU explode. Create subscriptions once outside, or dispose the previous one before creating a new one.
- **Duplicate primitive writes are ignored.** `obs('A'); obs('A')` sends no notification. Object writes always notify.
- **`obs.peek()`** reads without creating a dependency (useful inside computed).
- **`observable()` with no arg** starts as `undefined`, not null.
- **`remove()` vs `destroy()`**: remove deletes from array; destroy sets `_destroy: true` (for server sync patterns).
- **Observable children in JSX** are reactive — when an observable's value changes, the DOM updates. If it becomes `undefined`, a placeholder comment is rendered.
- **Cannot apply bindings twice** to the same DOM node — throws error.
- **`dispose()` on computed/subscriptions** stops updates. After disposal, reading returns last cached value.

## Testing

Observable writes update DOM synchronously — assert immediately after setting:

Direct DOM reads are appropriate here because this is verification code, not the UI update path itself.

```js
const vm = { msg: ko.observable('Hello') }
ko.applyBindings(vm, document.getElementById('app'))
console.assert(document.querySelector('#app span').textContent === 'Hello')
vm.msg('Updated')
console.assert(document.querySelector('#app span').textContent === 'Updated')
```
