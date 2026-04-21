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
// Register punctuation filters (`uppercase`, `lowercase`, `tail`, …)
// on the shared `@tko/utils` options so `Parser` instances created
// ad-hoc by specs (`new Parser().parse("x | tail")`) can resolve
// them. The knockout builder ALSO registers these via
// `builder.create({ filters })` at page startup, but it assigns to
// a module-local `knockout.options` — not the same reference that
// Parser reads from. Writing to the shared `options.filters` here
// is safe: it's the same object the Builder later augments, and
// earlier writes are idempotent for the punctuation set.
import { filters as punctuationFilters } from '@tko/filter.punches'
import { options as sharedOptions } from '@tko/utils'

globalThis.chai = chai
globalThis.expect = chai.expect
globalThis.sinon = sinon

sharedOptions.filters = Object.assign(sharedOptions.filters || {}, punctuationFilters)

// A real browser is never happy-dom — specs that skip under
// happy-dom run here.
globalThis.isHappyDom = () => false

// Specs depend on helpers registered as globals by
// mocha-test-helpers.js — `prepareTestNode`, `restoreAfter`,
// `expectContainHtml`, etc. That module also overrides
// `globalThis.after` to a cleanup-stack pusher (not a Mocha
// suite hook) and wires root `beforeEach` / `afterEach` hooks
// that flush the cleanup stack. Must be imported after Mocha's
// `bdd` UI has been set up (the HTML page does
// `mocha.setup('bdd')` before loading the bundle), otherwise
// its `beforeEach(function () { … })` at module top throws.
import './mocha-test-helpers.js'

before(() => {
  if (globalThis.ko?.options) {
    globalThis.ko.options.jsxCleanBatchSize = 0
  }
})

// Spies, stubs, and fake timers installed via the non-sandboxed
// `sinon.spy(obj, 'method')` / `sinon.stub(...)` / `sinon.useFakeTimers()`
// APIs remain wrapped on their targets until explicitly restored.
// Specs that forget to restore (or whose `this.after(...)` cleanup
// entry ran out of order) leak state into the next test, producing
// `+0 to deeply equal N` on call-count assertions or
// `Can't install fake timers twice` when the next spec re-installs.
// `sinon.restore()` is a no-op for sandbox-scoped fakes, so scoped
// specs are unaffected — only the pathological globals get reset.
// This hook lives only in the browser runner; Vitest's
// per-file module isolation shields it from the problem.
afterEach(() => {
  if (globalThis.sinon?.restore) globalThis.sinon.restore()
})

// Vitest-style context-arg shim.
//
// Some specs are written for Vitest and take the test context as a
// single arg, e.g. `function (ctx: any) { if (isHappyDom()) return
// ctx.skip('...') }`. Mocha inspects `fn.length` to decide whether
// the test expects a `done` callback; a 1-arg function is treated as
// async-with-done, and since these specs never call done(), Mocha
// times them out (~10s each).
//
// Fix: wrap `it` so that 1-arg specs that look like ctx-style (use
// `.skip(...)` and never call `done(...)`) are invoked with a fake
// ctx `{ skip }` and the wrapper's arity is hidden from Mocha.
// Genuine Mocha done-callback specs (identified by a `done(` call
// in the source) pass through unchanged.
{
  const wrap = orig => function (name, fn) {
    if (typeof fn === 'function' && fn.length === 1) {
      const src = fn.toString()
      const ctxStyle = /\.skip\s*\(/.test(src) && !/\bdone\s*\(/.test(src)
      if (ctxStyle) {
        const wrapped = function () {
          return fn.call(this, { skip: reason => this.skip(reason) })
        }
        Object.defineProperty(wrapped, 'length', { value: 0 })
        return orig.call(this, name, wrapped)
      }
    }
    return orig.apply(this, arguments)
  }
  const origIt = globalThis.it
  const wrappedIt = wrap(origIt)
  wrappedIt.only = wrap(origIt.only)
  wrappedIt.skip = origIt.skip
  globalThis.it = wrappedIt
}
