import { expect } from 'chai'

import { parseJson } from '../dist'

describe('parseJson', function () {
  it('parses a valid JSON string into an object', function () {
    expect(parseJson('{"a":1,"b":"two"}')).to.deep.equal({ a: 1, b: 'two' })
  })

  it('parses primitives and arrays', function () {
    expect(parseJson('42')).to.equal(42)
    expect(parseJson('"hello"')).to.equal('hello')
    expect(parseJson('true')).to.equal(true)
    expect(parseJson('null')).to.equal(null)
    expect(parseJson('[1,2,3]')).to.deep.equal([1, 2, 3])
  })

  it('trims surrounding whitespace before parsing', function () {
    expect(parseJson('   {"x":10}   ')).to.deep.equal({ x: 10 })
  })

  it('returns null for an empty string', function () {
    expect(parseJson('')).to.equal(null)
  })

  it('returns null for a whitespace-only string', function () {
    expect(parseJson('   \n\t  ')).to.equal(null)
  })

  it('returns null when the input is not a string', function () {
    // Inputs whose runtime type is not 'string' must short-circuit to null,
    // not be coerced or thrown on. The signature is typed `string` but the
    // function is callable from data-bind expressions where the runtime
    // value can be anything.
    expect(parseJson(undefined as unknown as string)).to.equal(null)
    expect(parseJson(null as unknown as string)).to.equal(null)
    expect(parseJson(42 as unknown as string)).to.equal(null)
    expect(parseJson({} as unknown as string)).to.equal(null)
  })

  it('throws when the input is a non-empty malformed JSON string', function () {
    // parseJson does not swallow JSON.parse errors — callers that want to
    // tolerate bad input must wrap the call themselves. Pinning this
    // behavior so a future "be helpful and return null" change is caught.
    expect(() => parseJson('{not json')).to.throw()
    expect(() => parseJson('undefined')).to.throw()
  })
})
