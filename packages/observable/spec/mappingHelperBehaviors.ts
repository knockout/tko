import { expect } from 'chai'

import { toJS, toJSON, isObservable, observable, observableArray } from '../dist'

describe('Mapping helpers', function () {
  it('toJS should require a parameter', function () {
    expect(function () {
      toJS()
    }).to.throw()
  })

  it('toJS should unwrap observable values', function () {
    const atomicValues = ['hello', 123, true, null, undefined, { a: 1 }]
    for (let i = 0; i < atomicValues.length; i++) {
      const data = observable(atomicValues[i])
      const result = toJS(data)
      expect(isObservable(result)).to.equal(false)
      expect(result).to.deep.equal(atomicValues[i])
    }
  })

  it('toJS should recursively unwrap observables whose values are themselves observable', function () {
    const weirdlyNestedObservable = observable(observable(observable(observable('Hello'))))
    const result = toJS(weirdlyNestedObservable)
    expect(result).to.equal('Hello')
  })

  it('toJS should unwrap observable properties, including nested ones', function () {
    const data = { a: observable(123), b: { b1: observable(456), b2: [789, observable('X')] } }
    const result = toJS(data)
    expect(result.a).to.equal(123)
    expect(result.b.b1).to.equal(456)
    expect(result.b.b2[0]).to.equal(789)
    expect(result.b.b2[1]).to.equal('X')
  })

  it('toJS should unwrap observable arrays and things inside them', function () {
    const data = observableArray(['a', 1, { someProp: observable('Hey') }])
    const result = toJS(data)
    expect(result.length).to.equal(3)
    expect(result[0]).to.equal('a')
    expect(result[1]).to.equal(1)
    expect(result[2].someProp).to.equal('Hey')
  })

  it('toJS should resolve reference cycles', function () {
    const obj: any = {}
    obj.someProp = { owner: observable(obj) }
    const result = toJS(obj)
    expect(result.someProp.owner).to.equal(result)
  })

  it('toJS should treat RegExp, Date, Number, String and Boolean instances as primitives (and not walk their subproperties)', function () {
    const regExp = new RegExp('')
    const date = new Date()
    const string = new String()
    const number = new Number()
    const booleanValue = new Boolean()

    const result = toJS({
      regExp: observable(regExp),
      due: observable(date),
      string: observable(string),
      number: observable(number),
      booleanValue: observable(booleanValue)
    })

    expect(result.regExp instanceof RegExp).to.equal(true)
    expect(result.regExp).to.equal(regExp)

    expect(result.due instanceof Date).to.equal(true)
    expect(result.due).to.equal(date)

    expect(result.string instanceof String).to.equal(true)
    expect(result.string).to.equal(string)

    expect(result.number instanceof Number).to.equal(true)
    expect(result.number).to.equal(number)

    expect(result.booleanValue instanceof Boolean).to.equal(true)
    expect(result.booleanValue).to.equal(booleanValue)
  })

  it('toJS should serialize functions', function () {
    const obj = { include: observable('test'), exclude: function () {} }

    const result = toJS(obj)
    expect(result.include).to.equal('test')
    expect(result.exclude).to.equal(obj.exclude)
  })

  it('toJSON should unwrap everything and then stringify', function () {
    const data = observableArray(['a', 1, { someProp: observable('Hey') }])
    const result = toJSON(data)

    expect(typeof result).to.equal('string')
    const parsedResult = JSON.parse(result)
    expect(parsedResult.length).to.equal(3)
    expect(parsedResult[0]).to.equal('a')
    expect(parsedResult[1]).to.equal(1)
    expect(parsedResult[2].someProp).to.equal('Hey')
  })

  it('toJSON should respect .toJSON functions on objects', function () {
    const data: { a: any; b: observable } = { a: { one: 'one', two: 'two' }, b: observable({ one: 'one', two: 'two' }) }
    data.a.toJSON = function () {
      return 'a-mapped'
    }
    data.b().toJSON = function () {
      return 'b-mapped'
    }
    const result = toJSON(data)

    expect(typeof result).to.equal('string')
    const parsedResult = JSON.parse(result)
    expect(parsedResult).to.deep.equal({ a: 'a-mapped', b: 'b-mapped' })
  })

  it('toJSON should respect .toJSON functions on arrays', function () {
    const data: { a: any; b: observableArray } = { a: [1, 2], b: observableArray([3, 4]) }
    data.a.toJSON = function () {
      return 'a-mapped'
    }
    data.b().toJSON = function () {
      return 'b-mapped'
    }
    const result = toJSON(data)

    expect(typeof result).to.equal('string')
    const parsedResult = JSON.parse(result)
    expect(parsedResult).to.deep.equal({ a: 'a-mapped', b: 'b-mapped' })
  })

  it('toJSON should respect replacer/space options', function () {
    const data = { a: 1 }

    expect(toJSON(data)).to.equal('{"a":1}')

    function myReplacer(x, obj) {
      expect(obj).to.deep.equal(data)
      return 'my replacement'
    }
    expect(toJSON(data, myReplacer)).to.equal('"my replacement"')

    expect(toJSON(data, undefined, '    ')).to.equal('{\n    "a": 1\n}')
  })
})
