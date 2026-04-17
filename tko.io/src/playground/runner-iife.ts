import { escapeScriptBody, injectConsoleForward } from './console-forward'
import type { Runner, RunnerStatus } from './runner'

const DEFAULT_HTML = `<div id="root"></div>`

const DEFAULT_TSX = `const count = tko.observable(0)

const view = (
  <div>
    <h1>Count: {count}</h1>
    <button ko-click={() => count(count() + 1)}>
      Increment
    </button>
  </div>
)

const root = document.getElementById('root')
const { node } = tko.jsx.render(view)
root.appendChild(node)
tko.applyBindings({}, root)
`

function renderSrcdoc(html: string, compiledJs: string): string {
  const doc = `<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 16px; font-family: 'Inter', system-ui, sans-serif; color: #1a1a1a; }
  * { box-sizing: border-box; }
  button { cursor: pointer; }
</style>
</head>
<body>
${html}
<script src="/lib/tko.js"><\/script>
<script>
window.ko = window.tko;
setTimeout(() => {
  try {
    ${escapeScriptBody(compiledJs)}
  } catch (e) {
    console.error(e.message || e);
  }
}, 0);
<\/script>
</body>
</html>`
  return injectConsoleForward(doc)
}

export function createIifeRunner(esbuild: any): Runner {
  return {
    title: 'Playground',
    tabs: [
      { id: 'html', label: 'index.html', lang: 'html', default: DEFAULT_HTML },
      { id: 'js', label: 'app.tsx', lang: 'tsx', default: DEFAULT_TSX },
    ],

    async init(onStatus: (s: RunnerStatus) => void) {
      onStatus({ state: 'loading', label: 'Loading esbuild...' })
      await esbuild.initialize({
        wasmURL: 'https://cdn.jsdelivr.net/npm/esbuild-wasm@0.27.4/esbuild.wasm',
      })
      onStatus({ state: 'ready', label: 'esbuild ready' })
    },

    async buildSrcdoc(files) {
      const start = performance.now()
      const result = await esbuild.transform(files.js, {
        loader: 'tsx',
        jsx: 'transform',
        jsxFactory: 'tko.jsx.createElement',
        jsxFragment: 'tko.jsx.Fragment',
      })
      const elapsedMs = performance.now() - start
      return {
        code: renderSrcdoc(files.html, result.code),
        elapsedMs,
      }
    },
  }
}
