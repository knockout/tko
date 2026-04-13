import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    include: ['packages/*/spec/**/*.ts', 'builds/reference/spec/**/*.js', 'builds/knockout/spec/**/*.js'],
    setupFiles: ['builds/knockout/helpers/vitest-setup.js'],
    browser: { enabled: true, provider: playwright(), headless: true, instances: [{ browser: 'chromium' }] },
    globals: true,
    testTimeout: 10000,
    dangerouslyIgnoreUnhandledErrors: true
  }
})
