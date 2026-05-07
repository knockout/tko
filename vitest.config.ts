import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

const browsers = ((globalThis as any).process?.env?.VITEST_BROWSERS || 'chromium')
  .split(',')
  .map((b: string) => ({ browser: b.trim() }))

const ALL_SPECS = ['packages/*/spec/**/*.ts', 'builds/reference/spec/**/*.js', 'builds/knockout/spec/**/*.js']

export default defineConfig({
  test: {
    testTimeout: 10000,
    globals: true,
    coverage: {
      // V8 coverage runs against the `browser` project (Playwright Chromium,
      // V8 runtime). Firefox/WebKit are not covered — JavaScriptCore and
      // SpiderMonkey don't expose V8's coverage protocol. The authoritative
      // real-browser matrix is unaffected; coverage is opt-in via
      // `bun run test:coverage`.
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov', 'json-summary'],
      reportsDirectory: 'coverage',
      // Tests load each `@tko/*` package via its `exports` (compiled `dist/`).
      // We include both `dist/` (so v8 picks up execution) and `src/` (so
      // source-map remapping can surface the original TS files in the report).
      // builds/*/dist/browser.min.js is what tests actually load
      // (vitest-setup imports it as the IIFE entry); v8 instruments
      // it and source-map remap surfaces builds/*/src/index.ts in the
      // report. Other dist files (browser.js, index.cjs/mjs, common.js)
      // are alternate output formats not exercised by the test runner,
      // so we exclude them to avoid 0% rows.
      include: [
        'packages/*/src/**/*.ts',
        'packages/*/dist/**/*.js',
        'builds/*/src/**/*.ts',
        'builds/*/dist/browser.min.js'
      ],
      // `packages/*/index.ts` are 1-line re-export barrels — exclude them.
      // `builds/*/src/index.ts` is the only real source file in each build,
      // so we anchor the index-exclude to packages/ only.
      exclude: [
        '**/spec/**',
        '**/helpers/**',
        '**/types/**',
        '**/*.d.ts',
        '**/*.cjs',
        'packages/*/index.ts',
        'packages/*/index.js'
      ],
      clean: true
    },
    projects: [
      // Authoritative real-browser matrix — UNCHANGED. Always runs every spec.
      {
        test: {
          name: 'browser',
          include: ALL_SPECS,
          setupFiles: ['builds/knockout/helpers/vitest-setup.js'],
          browser: { enabled: true, provider: playwright(), headless: true, instances: browsers },
          globals: true,
          testTimeout: 10000
        }
      },
      // Additive CLI coverage — happy-dom.
      // Intent: prove the binding engine works in a JS DOM (SSR, headless, TUI adapters).
      {
        test: {
          name: 'cli-happy-dom',
          include: ALL_SPECS,
          environment: 'happy-dom',
          setupFiles: ['builds/knockout/helpers/vitest-setup.js'],
          globals: true
        }
      }
    ]
  }
})
