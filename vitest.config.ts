import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

const browsers = ((globalThis as any).process?.env?.VITEST_BROWSERS || 'chromium')
  .split(',')
  .map((b: string) => ({ browser: b.trim() }))

export default defineConfig({
  test: {
    include: ['packages/*/spec/**/*.ts', 'builds/reference/spec/**/*.js', 'builds/knockout/spec/**/*.js'],
    setupFiles: ['builds/knockout/helpers/vitest-setup.js'],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: browsers
    },
    globals: true,
    testTimeout: 10000
  }
})
