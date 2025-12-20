//
// Test Mapping Behavior
//

import {
    toJS, toJSON, isObservable, observable, observableArray
} from '../dist'

describe('Mapping helpers', function () {
  it('toJS should require a parameter', function () {
    expect(function () {
      toJS()
    }).toThrow()
  })

  it('toJS should unwrap observable values', function () {
    let atomicValues = ['hello', 123, true, null, undefined, { a: 1 }]
    for (let i = 0; i < atomicValues.length; i++) {
      let data = observable(atomicValues[i])
      let result = toJS(data)
      expect(isObservable(result)).toEqual(false)
      expect(result).toEqual(atomicValues[i])
    }
  })

  it('toJS should recursively unwrap observables whose values are themselves observable', function () {
    let weirdlyNestedObservable = observable(
            observable(
                observable(
                    observable('Hello')
                )
            )
        )
    let result = toJS(weirdlyNestedObservable)
    expect(result).toEqual('Hello')
  })

  it('toJS should unwrap observable properties, including nested ones', function () {
    let data = {
      a: observable(123),
      b: {
        b1: observable(456),
        b2: [789, observable('X')]
      }
    }
    let result = toJS(data)
    expect(result.a).toEqual(123)
    expect(result.b.b1).toEqual(456)
    expect(result.b.b2[0]).toEqual(789)
    expect(result.b.b2[1]).toEqual('X')
  })

  it('toJS should unwrap observable arrays and things inside them', function () {
    let data = observableArray(['a', 1, { someProp: observable('Hey') }])
    let result = toJS(data)
    expect(result.length).toEqual(3)
    expect(result[0]).toEqual('a')
    expect(result[1]).toEqual(1)
    expect(result[2].someProp).toEqual('Hey')
  })

  it('toJS should resolve reference cycles', function () {
    let obj: any = {}
    obj.someProp = { owner: observable(obj) }
    let result = toJS(obj)
    expect(result.someProp.owner).toEqual(result)
  })

  it('toJS should treat RegExp, Date, Number, String and Boolean instances as primitives (and not walk their subproperties)', function () {
    let regExp = new RegExp('')
    let date = new Date()
    let string = new String()
    let number = new Number()
    let booleanValue = new Boolean() // 'boolean' is a resever word in Javascript

    let result = toJS({
      regExp: observable(regExp),
      due: observable(date),
      string: observable(string),
      number: observable(number),
      booleanValue: observable(booleanValue)
    })

    expect(result.regExp instanceof RegExp).toEqual(true)
    expect(result.regExp).toEqual(regExp)

    expect(result.due instanceof Date).toEqual(true)
    expect(result.due).toEqual(date)

    expect(result.string instanceof String).toEqual(true)
    expect(result.string).toEqual(string)

    expect(result.number instanceof Number).toEqual(true)
    expect(result.number).toEqual(number)

    expect(result.booleanValue instanceof Boolean).toEqual(true)
    expect(result.booleanValue).toEqual(booleanValue)
  })

  it('toJS should serialize functions', function () {
    let obj = {
      include: observable('test'),
      exclude: function () {}
    }

    let result = toJS(obj)
    expect(result.include).toEqual('test')
    expect(result.exclude).toEqual(obj.exclude)
  })

  it('toJSON should unwrap everything and then stringify', function () {
    let data = observableArray(['a', 1, { someProp: observable('Hey') }])
    let result = toJSON(data)

        // Check via parsing so the specs are independent of browser-specific JSON string formatting
    expect(typeof result).toEqual('string')
    let parsedResult = JSON.parse(result)
    expect(parsedResult.length).toEqual(3)
    expect(parsedResult[0]).toEqual('a')
    expect(parsedResult[1]).toEqual(1)
    expect(parsedResult[2].someProp).toEqual('Hey')
  })

  it('toJSON should respect .toJSON functions on objects', function () {
    let data: {a: any, b: observable} = {
      a: { one: 'one', two: 'two'},
      b: observable({ one: 'one', two: 'two' })
    }
    data.a.toJSON = function () { return 'a-mapped' }
    data.b().toJSON = function () { return 'b-mapped' }
    let result = toJSON(data)

        // Check via parsing so the specs are independent of browser-specific JSON string formatting
    expect(typeof result).toEqual('string')
    let parsedResult = JSON.parse(result)
    expect(parsedResult).toEqual({ a: 'a-mapped', b: 'b-mapped' })
  })

  it('toJSON should respect .toJSON functions on arrays', function () {
    let data: {a: any, b: observableArray} = {
      a: [1, 2],
      b: observableArray([3, 4])
    }
    data.a.toJSON = function () { return 'a-mapped' }
    data.b().toJSON = function () { return 'b-mapped' }
    let result = toJSON(data)

        // Check via parsing so the specs are independent of browser-specific JSON string formatting
    expect(typeof result).toEqual('string')
    let parsedResult = JSON.parse(result)
    expect(parsedResult).toEqual({ a: 'a-mapped', b: 'b-mapped' })
  })

  it('toJSON should respect replacer/space options', function () {
    let data = { a: 1 }

        // Without any options
    expect(toJSON(data)).toEqual('{"a":1}')

        // With a replacer
    function myReplacer (x, obj) {
      expect(obj).toEqual(data)
      return 'my replacement'
    }
    expect(toJSON(data, myReplacer)).toEqual('"my replacement"')

        // With spacer
    expect(toJSON(data, undefined, '    ')).toEqual('{\n    "a": 1\n}')
  })
})
