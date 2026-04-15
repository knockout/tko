import { expect } from 'chai'

import { options } from '@tko/utils'
import { Parser } from '../dist'

function ctxStub(ctx?) {
  return {
    lookup(v) {
      return ctx?.[v]
    },
    $data: ctx
  }
}

function evaluate(expr: string, vars: object = {}) {
  const bindings = new Parser().parse(`r: ${expr}`, ctxStub(vars))
  return bindings.r()
}

describe('options.strictEquality', function () {
  afterEach(function () {
    options.strictEquality = false
  })

  it('defaults to loose equality (==)', function () {
    expect(options.strictEquality).to.equal(false)
    // 0 == '' is true with loose equality
    expect(evaluate('x == y', { x: 0, y: '' })).to.equal(true)
    // null == undefined is true with loose equality
    expect(evaluate('x == y', { x: null, y: undefined })).to.equal(true)
  })

  it('switches to strict equality when enabled', function () {
    options.strictEquality = true
    // 0 === '' is false with strict equality
    expect(evaluate('x == y', { x: 0, y: '' })).to.equal(false)
    // 0 === 0 is true
    expect(evaluate('x == y', { x: 0, y: 0 })).to.equal(true)
    // null === undefined is false
    expect(evaluate('x == y', { x: null, y: undefined })).to.equal(false)
  })

  it('defaults to loose inequality (!=)', function () {
    // 0 != '' is false with loose equality (both are falsy)
    expect(evaluate('x != y', { x: 0, y: '' })).to.equal(false)
  })

  it('switches to strict inequality when enabled', function () {
    options.strictEquality = true
    // 0 !== '' is true with strict equality
    expect(evaluate('x != y', { x: 0, y: '' })).to.equal(true)
  })

  it('can be toggled back to loose', function () {
    options.strictEquality = true
    expect(evaluate('x == y', { x: 0, y: '' })).to.equal(false) // strict

    options.strictEquality = false
    expect(evaluate('x == y', { x: 0, y: '' })).to.equal(true) // loose again
  })

  // Regression tests for #290: == and != must have correct precedence
  // so they work in compound expressions (the original bug was a parser
  // error when precedence was missing)
  it('parses == with && (precedence)', function () {
    // == (prec 10) binds tighter than && (prec 6)
    expect(evaluate('x && y == z', { x: true, y: 1, z: 1 })).to.equal(true)
    expect(evaluate('x && y == z', { x: true, y: 1, z: 2 })).to.equal(false)
    expect(evaluate('x && y == z', { x: false, y: 1, z: 1 })).to.equal(false)
  })

  it('parses != with || (precedence)', function () {
    // != (prec 10) binds tighter than || (prec 5)
    expect(evaluate('x != y || z', { x: 1, y: 1, z: false })).to.equal(false)
    expect(evaluate('x != y || z', { x: 1, y: 2, z: false })).to.equal(true)
    expect(evaluate('x != y || z', { x: 1, y: 1, z: true })).to.equal(true)
  })

  it('parses mixed == and != with logical operators', function () {
    expect(evaluate('x == y && z != w', { x: 1, y: 1, z: 2, w: 3 })).to.equal(true)
    expect(evaluate('x == y && z != w', { x: 1, y: 2, z: 2, w: 3 })).to.equal(false)
    expect(evaluate('x == y && z != w', { x: 1, y: 1, z: 3, w: 3 })).to.equal(false)
  })

  it('parses == and != in strict mode with logical operators', function () {
    options.strictEquality = true
    // strict: 0 == '' is false, so && short-circuits
    expect(evaluate('x == y && z', { x: 0, y: '', z: true })).to.equal(false)
    // strict: 0 != '' is true
    expect(evaluate('x != y || z', { x: 0, y: '', z: false })).to.equal(true)
  })

  it('parses dvHuett reproduction: if: value != null (#290)', function () {
    expect(evaluate('x != null', { x: 'hello' })).to.equal(true)
    expect(evaluate('x != null', { x: null })).to.equal(false)
    expect(evaluate('x != null', { x: 0 })).to.equal(true)
  })

  it('does not affect === and !== operators', function () {
    expect(evaluate('x === y', { x: 0, y: 0 })).to.equal(true)
    expect(evaluate('x === y', { x: 0, y: '' })).to.equal(false)
    expect(evaluate('x !== y', { x: 0, y: '' })).to.equal(true)

    options.strictEquality = true
    // === and !== should behave the same regardless of the setting
    expect(evaluate('x === y', { x: 0, y: 0 })).to.equal(true)
    expect(evaluate('x === y', { x: 0, y: '' })).to.equal(false)
    expect(evaluate('x !== y', { x: 0, y: '' })).to.equal(true)
  })
})
