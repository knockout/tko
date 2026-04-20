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

// Load the knockout build (sets globalThis.ko)
import '../dist/browser.min.js'

// Now import the helper — it needs chai, expect, ko, and beforeEach/afterEach as globals.
// beforeEach/afterEach come from vitest globals (globals: true in config).
// Registers its own afterEach for per-test `_cleanups` (tests register via `after(fn)`).
import './mocha-test-helpers.js'

// Drain the JSX clean queue AFTER mocha-helpers' afterEach so any cleanup the
// test's `after(fn)` hooks enqueue (e.g. via ko.cleanNode) is flushed before
// the next test begins. Vitest runs same-scope afterEach hooks in registration
// order, so this must be the last-registered afterEach at module scope.
//
// JsxObserver.detachAndDispose defers node cleanup through a 25ms setTimeout
// (packages/utils.jsx/src/jsxClean.ts). In environments that tear down DOM
// globals between files (e.g. happy-dom), a timer still pending at teardown
// fires against a dead global and throws `ReferenceError: Element is not
// defined`. Unconditional — no-op when the queue is empty.
afterEach(() => {
  flushJsxCleanNow()
})
