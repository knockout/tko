import { describe, expect, it } from 'bun:test'

import { functionRewrite } from '../src'

describe('Function Rewrite Provider', () => {
  describe('replaceFunctionStrings', () => {
    const tryExpect = {
      'x: function () {}': 'x: () => undefined',
      'x: function ( ) { return t }': 'x: () => t',
      'x:function(){return t}': 'x:() => t',
      'x: function () { return t }, y: function () { return z }': 'x: () => t, y: () => z',
      'x: function () { return a + b }': 'x: () => a + b',
      'x: function () { return {} }': 'x: () => { }',
      'x: function () { return "abc" }': 'x: () => "abc"',
      'stringLiteral: "hello", numberLiteral: 123, boolLiteralTrue: true, boolLiteralFalse: false, objectLiteral: {}, functionLiteral: function() { }, nullLiteral: null, undefinedLiteral: undefined':
        'stringLiteral: "hello", numberLiteral: 123, boolLiteralTrue: true, boolLiteralFalse: false, objectLiteral: {}, functionLiteral: () => undefined, nullLiteral: null, undefinedLiteral: undefined',
      'function (v) { return v.name + " (" + v.job + ")"; }': '(v) => v.name + " (" + v.job + ")"',
      'function () { foo(); }': '() => foo() && undefined'
    }
    const idempotents = ['x: nonfunction () {}']
    functionRewrite.silent = true

    for (const [given, expected] of Object.entries(tryExpect)) {
      it(`replaces '${given}'' with '${expected}'`, () => {
        expect(functionRewrite(given)).toBe(expected)
      })
    }

    for (const given of idempotents) {
      it(`does not alter '${given}'`, () => {
        expect(functionRewrite(given)).toBe(given)
      })
    }
  })
})
