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

// Run JSX node cleanup synchronously in tests. The default 25ms batch
// (packages/utils.jsx/src/jsxClean.ts) can otherwise fire a timer after a
// vitest environment (e.g. happy-dom) tears down DOM globals, surfacing as
// `ReferenceError: Element is not defined` from `cleanNode`. `0` runs
// cleanup synchronously on detach. Using beforeAll so it runs after the
// defining package's module-load side effects, independent of import order.
beforeAll(() => {
  options.jsxCleanBatchSize = 0
  // browser.min.js bundles its own Options instance.
  globalThis.ko.options.jsxCleanBatchSize = 0
})
