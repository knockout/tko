import type { Runner, RunnerStatus } from './runner'

const DEFAULT_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Hello, TKO</title>
    <script type="importmap">
      { "imports": { "@tko/build.reference": "https://esm.sh/@tko/build.reference" } }
    </script>
  </head>
  <body>
    <div id="app">
      <input data-bind="textInput: name" />
      <p>Hello, <strong data-bind="text: name"></strong>.</p>
    </div>

    <script type="module">
      import ko from '@tko/build.reference'
      ko.applyBindings({ name: ko.observable('TKO') }, document.getElementById('app'))
    </script>
  </body>
</html>
`

const CONSOLE_FORWARD = `<script>
;['log','warn','error','info'].forEach(m => {
  const orig = console[m];
  console[m] = (...args) => {
    window.parent.postMessage({ type: 'console', method: m, args: args.map(a => {
      try { return typeof a === 'object' ? JSON.stringify(a) : String(a) } catch { return String(a) }
    }) }, '*');
    orig.apply(console, args);
  };
});
window.onerror = (msg) => {
  window.parent.postMessage({ type: 'error', message: String(msg) }, '*');
};
window.onunhandledrejection = (e) => {
  window.parent.postMessage({ type: 'error', message: String(e.reason) }, '*');
};
</script>
`

function injectConsoleForward(html: string): string {
  const headClose = /<\/head>/i
  if (headClose.test(html)) return html.replace(headClose, `${CONSOLE_FORWARD}</head>`)
  const bodyOpen = /<body[^>]*>/i
  if (bodyOpen.test(html)) return html.replace(bodyOpen, (m) => `${m}${CONSOLE_FORWARD}`)
  return CONSOLE_FORWARD + html
}

export function createEsmRunner(): Runner {
  return {
    title: 'Playground (ESM)',
    tabs: [{ id: 'html', label: 'index.html', lang: 'html', default: DEFAULT_HTML }],

    async init(onStatus: (s: RunnerStatus) => void) {
      onStatus({ state: 'ready', label: 'ESM (no build step)' })
    },

    async buildSrcdoc(files) {
      const start = performance.now()
      const code = injectConsoleForward(files.html)
      return { code, elapsedMs: performance.now() - start }
    },
  }
}
