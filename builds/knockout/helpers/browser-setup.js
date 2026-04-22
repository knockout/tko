// Setup for running TKO specs in a real browser under Mocha.
// Counterpart to vitest-setup.js. Loaded as the first import of
// the test bundle (tko.io/scripts/bundle-tests.mjs).
//
// Assumes `mocha.setup('bdd')` already ran (so `before` / `after`
// / `beforeEach` / `afterEach` are global) and `globalThis.ko`
// was set by the bundled IIFE in /tests/source/setup.js, which
// this module is imported from.

import * as chai from 'chai'
import sinon from 'sinon'
// Register punctuation filters on shared `@tko/utils` options so
// specs that construct Parsers directly (`new Parser().parse('x | tail')`)
// can resolve them. The builder registers the same filters at page
// startup but on a module-local options reference — not this one.
import { filters as punctuationFilters } from '@tko/filter.punches'
import { options as sharedOptions } from '@tko/utils'

globalThis.chai = chai
globalThis.expect = chai.expect
globalThis.sinon = sinon
globalThis.isHappyDom = () => false

sharedOptions.filters = Object.assign(sharedOptions.filters || {}, punctuationFilters)

// mocha-test-helpers wires root beforeEach/afterEach hooks, so it
// must be imported after `mocha.setup('bdd')` ran.
import './mocha-test-helpers.js'

// Disable the 25ms JSX cleanup timer so it can't race test teardown.
before(() => {
  if (globalThis.ko?.options) {
    globalThis.ko.options.jsxCleanBatchSize = 0
  }
})

// Iframe focus-event polyfill.
//
// Chromium refuses to grant programmatic `iframe.contentWindow.focus()`
// true system focus from a parent that already holds focus — the
// iframe never passes `document.hasFocus() === true`, so `focusin`
// / `focusout` are suppressed when specs call `element.focus()`
// inside. The `hasfocus` binding observes those events (not
// `document.activeElement`), so without this patch those specs
// fail under both Playwright and a real Chrome tab.
//
// Wrap `focus`/`blur` to dispatch the missing events synchronously
// after the native call. If the browser DOES regain system focus
// and fires them too, observers see duplicates — harmless for
// these specs (state-checking, not call-count).
//
// Scope-guarded to iframes (`window.parent !== window`) so the
// parent page is never patched.
//
// Refs: https://github.com/jsdom/jsdom/pull/2996 (same shape as
// this wrap), https://html.spec.whatwg.org/multipage/interaction.html#focusing-elements.
if (window.parent !== window && !HTMLElement.prototype.__tkoFocusPatched) {
  const HE = HTMLElement.prototype
  HE.__tkoFocusPatched = true
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

// Unscoped sinon fakes (`sinon.spy(obj,'m')`, `sinon.useFakeTimers()`)
// leak across specs if not restored, producing bogus call-count
// diffs or "Can't install fake timers twice". `sinon.restore()` is
// a no-op for sandbox-scoped fakes. Vitest isolates per-file so
// doesn't need this hook.
afterEach(() => {
  if (globalThis.sinon?.restore) globalThis.sinon.restore()
})

// Vitest-style context-arg shim.
//
// Specs written `function (ctx) { if (isHappyDom()) return ctx.skip(…) }`
// look like Mocha done-callback specs (`fn.length === 1`) and time
// out after ~10s because they never call done. Wrap `it` to detect
// the ctx shape (uses `.skip(...)` and never calls `done(`) and
// invoke with a synthetic `{ skip }` while hiding arity from Mocha.
{
  const wrap = orig =>
    function (name, fn) {
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
