import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    include: [
      'packages/*/spec/**/*.ts',
      'builds/reference/spec/**/*.js'
    ],
    // builds/knockout excluded — its helper registers beforeEach/afterEach
    // at module scope which requires Karma's global loading model.
    // TODO: refactor helper to work with Vitest, then add builds/knockout/spec/**/*.js
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [
        { browser: 'chromium' }
      ]
    },
    globals: true,
    testTimeout: 10000
  }
})
