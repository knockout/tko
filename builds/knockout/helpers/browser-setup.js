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

// Iframe focus-event polyfill.
//
// Each spec runs inside a hidden iframe spawned by
// `tko.io/src/pages/tests.astro` via `tests-frame.html`. Chromium
// refuses to grant programmatic `iframe.contentWindow.focus()`
// true system focus from a parent that already has focus — the
// iframe's window never passes `document.hasFocus() === true`, so
// the browser suppresses `focusin` / `focusout` events when specs
// call `element.focus()` / `element.blur()` inside. The
// `hasfocus` binding observes those events (not
// `document.activeElement`); 34 tests fail as a result, both
// under Playwright and under a real Chrome tab.
//
// Fix: wrap `HTMLElement.prototype.focus` and `.blur` to ALSO
// dispatch the `focus` / `focusin` / `blur` / `focusout` events
// synchronously after the native call. If the browser ALSO fires
// them (whenever it does regain system focus), observers see
// duplicates — harmless for the specs in this suite (they observe
// state, not call count). Scope-guarded to the iframe context
// (`window.parent !== window`) so the parent page is never
// patched.
//
// References:
//   - https://github.com/testing-library/user-event/issues/553
//     `.focus()` does not fire focus events if the window is not
//     focused. Confirmed across browsers; the same gate applies
//     to unfocused iframes.
//   - https://github.com/cypress-io/cypress/issues/8111
//     iframe elements that focus are blurred immediately when
//     they lack system focus.
//   - https://github.com/jsdom/jsdom/pull/2996
//     Reference implementation of synthetic focusin/focusout
//     dispatch in jsdom; same shape as the wrap below.
//   - https://html.spec.whatwg.org/multipage/interaction.html#focusing-elements
//     The spec allows `.focus()` to succeed programmatically even
//     when the owner isn't "being rendered"; event delivery,
//     however, is gated on system focus of the top-level browsing
//     context — that's the Chromium behaviour this patch bridges.
if (window.parent !== window) {
  const HE = HTMLElement.prototype
  const origFocus = HE.focus
  const origBlur = HE.blur
  HE.focus = function (...args) {
    const wasActive = this.ownerDocument.activeElement
    origFocus.apply(this, args)
    if (this.ownerDocument.activeElement === this && wasActive !== this) {
      this.dispatchEvent(new FocusEvent('focus', { bubbles: false, relatedTarget: wasActive }))
      this.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: wasActive }))
    }
  }
  HE.blur = function (...args) {
    const wasActive = this.ownerDocument.activeElement
    origBlur.apply(this, args)
    if (wasActive === this && this.ownerDocument.activeElement !== this) {
      this.dispatchEvent(new FocusEvent('blur', { bubbles: false, relatedTarget: this.ownerDocument.activeElement }))
      this.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: this.ownerDocument.activeElement }))
    }
  }
}

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
