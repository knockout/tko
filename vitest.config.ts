import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

const browsers = ((globalThis as any).process?.env?.VITEST_BROWSERS || 'chromium')
  .split(',')
  .map((b: string) => ({ browser: b.trim() }))

// Packages whose specs need a real browser (MutationObserver timing, JSX
// observer lifecycles, async DOM reflow, form-control event ordering, etc.).
// Everything else runs in happy-dom for ~5× faster startup.
const BROWSER_PACKAGE_SPECS = [
  'packages/bind/spec/**/*.ts',
  'packages/binding.component/spec/**/*.ts',
  'packages/binding.core/spec/**/*.ts',
  'packages/binding.foreach/spec/**/*.ts',
  'packages/binding.if/spec/**/*.ts',
  'packages/binding.template/spec/**/*.ts',
  'packages/builder/spec/**/*.ts',
  'packages/provider.component/spec/**/*.ts',
  'packages/utils.component/spec/**/*.ts',
  'packages/utils.jsx/spec/**/*.ts',
  'packages/utils/spec/utilsDomBehaviors.ts'
]

export default defineConfig({
  test: {
    testTimeout: 10000,
    globals: true,
    projects: [
      {
        test: {
          name: 'unit',
          include: ['packages/*/spec/**/*.ts'],
          exclude: BROWSER_PACKAGE_SPECS,
          environment: 'happy-dom',
          globals: true
        }
      },
      {
        test: {
          name: 'browser',
          include: [...BROWSER_PACKAGE_SPECS, 'builds/reference/spec/**/*.js', 'builds/knockout/spec/**/*.js'],
          setupFiles: ['builds/knockout/helpers/vitest-setup.js'],
          browser: { enabled: true, provider: playwright(), headless: true, instances: browsers },
          globals: true,
          testTimeout: 10000
        }
      }
    ]
  }
})
