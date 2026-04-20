import * as chai from 'chai'
import sinon from 'sinon'
import { options } from '@tko/utils'
import { isHappyDom } from '../../../packages/utils/helpers/test-env.ts'

// Set globals that builds/knockout specs and mocha-test-helpers.js expect
globalThis.chai = chai
globalThis.expect = chai.expect
globalThis.sinon = sinon

// Test environment detector — used inside test bodies like:
//   it('name', function (ctx) {
//     if (isHappyDom()) return ctx.skip('happy-dom: reason')
//     // ...
//   })
globalThis.isHappyDom = isHappyDom

// Load the knockout build (sets globalThis.ko)
import '../dist/browser.min.js'

// Now import the helper — it needs chai, expect, ko, and beforeEach/afterEach as globals.
// beforeEach/afterEach come from vitest globals (globals: true in config).
import './mocha-test-helpers.js'

// Run JSX cleanup synchronously in tests. In happy-dom the 25ms batch
// timer can fire after the DOM globals are torn down, throwing from
// `cleanNode`. browser.min.js bundles its own Options instance, so mirror.
beforeAll(() => {
  options.jsxCleanBatchSize = 0
  globalThis.ko.options.jsxCleanBatchSize = 0
})
