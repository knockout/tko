
import {
  functionRewrite
} from '../dist'

describe('Function Rewrite Provider', function () {
  describe('replaceFunctionStrings', function () {
    const tryExpect = {
      'x: function () {}': 'x: () => undefined',
      'x: function ( ) { return t }': 'x: () => t',
      'x:function(){return t}': 'x:() => t',
      'x: function () { return t }, y: function () { return z }': 'x: () => t, y: () => z',
      'x: function () { return a + b }': 'x: () => a + b',
      'x: function () { return {} }': 'x: () => { }',
      'x: function () { return "abc" }': 'x: () => "abc"',
      'stringLiteral: "hello", numberLiteral: 123, boolLiteralTrue: true, boolLiteralFalse: false, objectLiteral: {}, functionLiteral: function() { }, nullLiteral: null, undefinedLiteral: undefined': 'stringLiteral: "hello", numberLiteral: 123, boolLiteralTrue: true, boolLiteralFalse: false, objectLiteral: {}, functionLiteral: () => undefined, nullLiteral: null, undefinedLiteral: undefined',
      'function (v) { return v.name + " (" + v.job + ")"; }': '(v) => v.name + " (" + v.job + ")"',
      'function () { foo(); }': '() => foo() && undefined',
    }
    const idempotents = [
      'x: nonfunction () {}'
    ]
    functionRewrite.silent = true

    for (const [given, expect] of Object.entries(tryExpect)) {
      it(`replaces '${given}'' with '${expect}'`, () => {
        assert.equal(functionRewrite(given), expect)
      })
    }

    for (const given of idempotents) {
      it(`does not alter '${given}'`, () => {
        assert.equal(functionRewrite(given), given)
      })
    }
  })
})
