import { injectConsoleForward } from './console-forward'
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
    <!-- Reusable markup. Native ko- bindings; no data-bind needed. -->
    <template id="ko-greeting-template">
      <input ko-textInput="name" />
      <p>Hello, <strong ko-text="name"></strong>.</p>
    </template>

    <!-- Mount one or many — each instance gets its own state. -->
    <ko-greeting></ko-greeting>

    <script type="module">
      import ko from '@tko/build.reference'

      // Component class — extends ko.Component, auto-registers as <ko-greeting>
      // (kebab-case derived from class name).
      class KoGreeting extends ko.Component {
        // Where TKO finds the markup for this component.
        static get template () { return { element: 'ko-greeting-template' } }

        name = ko.observable('TKO')
      }
      KoGreeting.register()

      ko.applyBindings({}, document.body)
    </script>
  </body>
</html>
`

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
