import type { Runner, RunnerStatus } from './runner'

const DEFAULT_HTML = `<!doctype html>
<meta charset="utf-8" />
<title>TKO ESM</title>

<script type="importmap">
{
  "imports": {
    "@tko/build.reference": "https://esm.sh/@tko/build.reference"
  }
}
</script>

<style>
  body { font-family: system-ui, sans-serif; margin: 2rem; color: #1a1a1a; }
  button { cursor: pointer; padding: 0.35rem 0.75rem; }
</style>

<div id="root">
  <h1>Count: <span data-bind="text: count"></span></h1>
  <button data-bind="click: increment">Increment</button>
</div>

<script type="module">
  import ko from '@tko/build.reference'

  const vm = {
    count: ko.observable(0),
    increment() { vm.count(vm.count() + 1) }
  }

  ko.applyBindings(vm, document.getElementById('root'))
</script>
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
