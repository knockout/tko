// Setup for running TKO specs in a real browser under Mocha.
// Counterpart to vitest-setup.js — same concerns, different host.
//
// Loaded as the first import of the test bundle (see
// tko.io/scripts/bundle-tests.mjs). When this module runs, it
// assumes:
//
//   - mocha.setup('bdd') has already been called on the page,
//     so `before` / `after` / `beforeEach` / `afterEach` are
//     global Mocha hooks.
//   - window.ko was set by loading /lib/ko.js via a <script>
//     tag before the bundle.
//
// Responsibilities:
//   - Expose `chai`, `expect`, `sinon` as the globals the specs
//     and mocha-test-helpers.js expect.
//   - `isHappyDom` is never true here (real browser).
//   - Force `ko.options.jsxCleanBatchSize = 0` before the suite
//     runs so the 25ms JSX cleanup timer does not race test
//     teardown.

import * as chai from 'chai'
import sinon from 'sinon'

globalThis.chai = chai
globalThis.expect = chai.expect
globalThis.sinon = sinon

// A real browser is never happy-dom — specs that skip under
// happy-dom run here.
globalThis.isHappyDom = () => false

before(() => {
  if (globalThis.ko?.options) {
    globalThis.ko.options.jsxCleanBatchSize = 0
  }
})
