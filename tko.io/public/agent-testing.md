# TKO Agent Testing Guide

How to run and verify TKO code without human interaction.

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

This is the fastest option — no esbuild, no network dependency on the playground. Works for all `data-bind` code.

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

## Which option to use

| Scenario | Option |
|----------|--------|
| `data-bind` bindings, no JSX | **Option 1** — static HTML file, fastest |
| JSX/TSX code | **Option 2** — playground has esbuild-wasm |
| Quick observable/computed logic test | **Option 1** — no DOM needed, just script |
| Sharing a runnable example with a human | **Option 2** — give them the playground URL |
