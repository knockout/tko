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
      // V8 coverage works against the cli-happy-dom project (Node runtime).
      // The authoritative real-browser matrix is unaffected.
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov', 'json-summary'],
      reportsDirectory: 'coverage',
      // Tests load each `@tko/*` package via its `exports` (compiled `dist/`).
      // We include both `dist/` (so v8 picks up execution) and `src/` (so
      // source-map remapping can surface the original TS files in the report).
      include: ['packages/*/src/**/*.ts', 'packages/*/dist/**/*.js', 'builds/*/src/**/*.ts'],
      exclude: ['**/spec/**', '**/helpers/**', '**/types/**', '**/*.d.ts', '**/*.cjs', '**/index.ts', '**/index.js'],
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
