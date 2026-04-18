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
