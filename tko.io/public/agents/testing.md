# TKO Agent Testing Guide

Use `/llms.txt` as the index for the full agent docs set. This file explains how to run and verify TKO code without human interaction.

## Option 1: Static HTML file (data-bind, no JSX)

Write a self-contained HTML file, open it in a browser (Playwright, puppeteer, etc.), and check the DOM.

```html
<!DOCTYPE html>
<html>
<body>
  <div id="app">
    <span data-bind="text: message"></span>
  </div>
  <script src="https://tko.io/lib/tko.js"></script>
  <script>
    window.ko = window.tko
    const vm = { message: ko.observable('Hello') }
    ko.applyBindings(vm, document.getElementById('app'))

    // verify
    vm.message('Updated')
    document.title = document.querySelector('#app span').textContent
  </script>
</body>
</html>
```

Workflow:
1. Write HTML file to disk (e.g. `/tmp/tko-test.html`)
2. Serve it locally — `file://` URLs are blocked by most Playwright configs. Use a local HTTP server:
   - `python3 -m http.server 8765` from the file's directory, or
   - any static file server
3. Navigate Playwright to `http://localhost:8765/tko-test.html`
4. Read `document.title` or snapshot the DOM to verify

This is the fastest option — no esbuild and no network dependency on the playground, though Option 1 still fetches `https://tko.io/lib/tko.js` unless you vendor that file locally. Works for all `data-bind` code.

## Option 2: Playground via Playwright (JSX/TSX)

Use the TKO playground when you need JSX/TSX (esbuild-wasm is already wired up there).

1. Construct the playground URL:

```js
const hash = btoa(encodeURIComponent(JSON.stringify({ html, js })))
const url = `https://tko.io/playground#${hash}`
```

2. Navigate Playwright to the URL
3. Wait for the text "esbuild ready" to appear (esbuild-wasm takes a few seconds to initialize)
4. The code auto-compiles and runs in the preview iframe
5. Read the iframe content or console output to verify

The playground forwards console messages from the iframe to the parent page — look for `#console-messages` in the DOM for console.log/error output.

### Checking results

The preview iframe is `#preview`. To read its content:

```js
const iframe = document.querySelector('#preview')
const body = iframe.contentDocument.body
```

Console output appears in `#console-messages` as child elements.

### Timing

esbuild-wasm takes a few seconds to initialize on first load. The playground shows "esbuild ready" in `#esbuild-status` when it's ready. Code auto-runs after compilation.

## Option 3: Testing doc page examples

The TKO docs at tko.io show code examples as paired HTML + JavaScript blocks. Each pair has:
- **TSX/HTML tabs** on the HTML block (showing both `ko-*` and `data-bind` syntax)
- **"Open in Playground" button** on both tabs (opens the example in the playground)

### Testing an HTML example from the docs

Extract the HTML and JS from the code blocks and use Option 1 (static HTML file):

```html
<!DOCTYPE html>
<html><body>
  <!-- paste the HTML code block here -->
  <script src="https://tko.io/lib/tko.js"></script>
  <script>
    window.ko = window.tko
    // paste the JS code block here
  </script>
</body></html>
```

### Testing a TSX example from the docs

TSX examples use `ko-*` attributes which require JSX compilation. Use Option 2 (playground).

Important: `ko-*` attribute values in `{braces}` are JavaScript expressions transformed by esbuild at build time and evaluated at runtime, not runtime binding strings. Variables referenced in `ko-*={expr}` must be defined in the TSX scope before the JSX expression. Binding-context variables inside `ko-foreach` children should use **string syntax**: `ko-text="name"` not `ko-text={name}`.

```tsx
// 1. Define variables that ko-* attributes reference
const people = ko.observableArray([...])

// 2. JSX template using ko-* attributes
const view = (
  <ul ko-foreach={people}>
    <li ko-text="$data" />
  </ul>
)

// 3. Render and activate bindings
const root = document.getElementById('root')
const { node } = tko.jsx.render(view)
root.appendChild(node)
ko.applyBindings({}, root)
```

### Verifying playground links from doc pages

Each "Open in Playground" button encodes `{ html, js }` in the URL hash. To verify:

1. Navigate to the doc page (e.g., `http://localhost:4321/bindings/foreach-binding/`)
2. Click "Open in Playground" on the HTML tab
3. The playground should show the HTML in the HTML editor, JS in the TSX editor
4. Wait for "esbuild ready", then the preview should render the example
5. For TSX tab links: the playground currently receives TSX-style HTML — this requires manual restructuring to run (defining variables, wrapping in JSX, using `tko.jsx.render()`)

## Which option to use

| Scenario | Option |
|----------|--------|
| `data-bind` bindings, no JSX | **Option 1** — static HTML file, fastest |
| JSX/TSX code | **Option 2** — playground has esbuild-wasm |
| Quick observable/computed logic test | **Option 1** — no DOM needed, just script |
| Sharing a runnable example with a human | **Option 2** — give them the playground URL |
| Verifying doc page examples work | **Option 1** for HTML tab, **Option 2** for TSX tab |
