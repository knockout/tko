import * as chai from 'chai'
import sinon from 'sinon'

// Set globals that builds/knockout specs and mocha-test-helpers.js expect
globalThis.chai = chai
globalThis.expect = chai.expect
globalThis.sinon = sinon

// Load the knockout build (sets globalThis.ko)
import '../dist/browser.min.js'

// Now import the helper — it needs chai, expect, ko, and beforeEach/afterEach as globals.
// beforeEach/afterEach come from vitest globals (globals: true in config).
// The helper is an IIFE that reads these from the global scope.
import './mocha-test-helpers.js'
