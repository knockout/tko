import * as chai from 'chai'
import sinon from 'sinon'
import { isHappyDom } from '../../../packages/utils/helpers/test-env.ts'
import { flushJsxCleanNow } from '../../../packages/utils.jsx/src/jsxClean.ts'

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

// In happy-dom the global DOM is torn down between files. JsxObserver.detachAndDispose
// defers node cleanup through a 25ms setTimeout (packages/utils.jsx/src/jsxClean.ts);
// if that timer fires after teardown, `cleanNode` throws `ReferenceError: Element is
// not defined`. Drain the queue synchronously after each test to close the race.
if (isHappyDom()) {
  afterEach(() => {
    flushJsxCleanNow()
  })
}

// Load the knockout build (sets globalThis.ko)
import '../dist/browser.min.js'

// Now import the helper — it needs chai, expect, ko, and beforeEach/afterEach as globals.
// beforeEach/afterEach come from vitest globals (globals: true in config).
import './mocha-test-helpers.js'
