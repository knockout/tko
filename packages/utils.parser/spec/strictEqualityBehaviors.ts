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
