import * as chai from 'chai'
import sinon from 'sinon'
import {
  isHappyDom,
  isRealBrowser,
  isNode,
  itBrowserOnly,
  describeBrowserOnly
} from '../../../packages/utils/helpers/test-env.ts'

// Set globals that builds/knockout specs and mocha-test-helpers.js expect
globalThis.chai = chai
globalThis.expect = chai.expect
globalThis.sinon = sinon

// Test environment detectors and env-scoped test wrappers — see test-env.ts.
// `itBrowserOnly(...)` / `describeBrowserOnly(...)` read as semantic labels
// and keep call-site indent identical to an unskipped `it(...)`.
globalThis.isHappyDom = isHappyDom
globalThis.isRealBrowser = isRealBrowser
globalThis.isNode = isNode
globalThis.itBrowserOnly = itBrowserOnly
globalThis.describeBrowserOnly = describeBrowserOnly

// Load the knockout build (sets globalThis.ko)
import '../dist/browser.min.js'

// Now import the helper — it needs chai, expect, ko, and beforeEach/afterEach as globals.
// beforeEach/afterEach come from vitest globals (globals: true in config).
import './mocha-test-helpers.js'
