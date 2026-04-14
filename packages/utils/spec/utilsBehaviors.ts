import { expect } from 'chai'
import sinon from 'sinon'

import * as utils from '../dist'
import type { KnockoutInstance } from '@tko/builder'
import { prepareTestNode } from '../helpers/mocha-test-helpers'

const ko: KnockoutInstance = globalThis.ko || {}

ko.utils = utils
ko.tasks = utils.tasks

describe('arrayForEach', function () {
  it('Should go call the callback for each element of the array, in order', function () {
    const callback = sinon.spy()

    ko.utils.arrayForEach(['a', 'b', 'c'], callback)

    sinon.assert.callCount(callback, 3)
    expect(callback.getCall(0).args).to.deep.equal(['a', 0, ['a', 'b', 'c']])
    expect(callback.getCall(1).args).to.deep.equal(['b', 1, ['a', 'b', 'c']])
    expect(callback.getCall(2).args).to.deep.equal(['c', 2, ['a', 'b', 'c']])
  })

  it('Should do nothing with empty arrays', function () {
    const callback = sinon.spy()

    ko.utils.arrayForEach([], callback)

    sinon.assert.notCalled(callback)
  })

  it('Should alter "this" context when defined as an argument', function () {
    const expectedContext = {}
    let actualContext = null
    utils.arrayForEach(
      ['a'],
      function () {
        actualContext = this
      },
      expectedContext
    )
    expect(actualContext).to.equal(expectedContext)
  })

  it('Should throw an error for a null array', function () {
    expect(function () {
      const nullArray: Array<any> = null as unknown as Array<any>
      ko.utils.arrayForEach(nullArray, function () {})
    }).to.throw()
  })
})

describe('arrayIndexOf', function () {
  it('Should return the index if the element is found in the input array', function () {
    const result = ko.utils.arrayIndexOf(['a', 'b', 'c'], 'b')
    expect(result).to.equal(1)
  })

  it('Should return -1 for empty arrays', function () {
    const result = ko.utils.arrayIndexOf([], 'a')
    expect(result).to.equal(-1)
  })

  it('Should return -1 if the element is not found', function () {
    const result = ko.utils.arrayIndexOf(['a', 'b', 'c'], 'd')
    expect(result).to.equal(-1)
  })

  it('Should return the first index if the element is found twice', function () {
    const result = ko.utils.arrayIndexOf(['a', 'b', 'c', 'c'], 'c')
    expect(result).to.equal(2)
  })

  it('Should throw an error for a null array', function () {
    expect(function () {
      const nullArray: Array<string> = null as unknown as Array<string>
      ko.utils.arrayIndexOf(nullArray, 'a')
    }).to.throw()
  })
})

describe('arrayRemoveItem', function () {
  it('Should remove the matching element if found', function () {
    const input = ['a', 'b', 'c']
    ko.utils.arrayRemoveItem(input, 'a')
    expect(input).to.deep.equal(['b', 'c'])
  })

  it('Should do nothing for empty arrays', function () {
    const input = new Array()
    ko.utils.arrayRemoveItem(input, 'a')
    expect(input).to.deep.equal([])
  })

  it('Should do nothing if no matching element is found', function () {
    const input = ['a', 'b', 'c']
    ko.utils.arrayRemoveItem(input, 'd')
    expect(input).to.deep.equal(['a', 'b', 'c'])
  })

  it('Should remove only the first matching element', function () {
    const input = ['a', 'b', 'b', 'c']
    ko.utils.arrayRemoveItem(input, 'b')
    expect(input).to.deep.equal(['a', 'b', 'c'])
  })

  it('Should throw an error for a null array', function () {
    expect(function () {
      const nullArray: Array<string> = null as unknown as Array<string>
      ko.utils.arrayRemoveItem(nullArray, 'a')
    }).to.throw()
  })
})

describe('arrayFirst', function () {
  let matchB, matchD

  beforeEach(function () {
    matchB = sinon.spy(function (x: string) {
      return x.charAt(0) === 'b'
    })

    matchD = sinon.spy(function (x: string) {
      return x.charAt(0) === 'd'
    })
  })

  it('Should return the first matching element from the input array', function () {
    const result = ko.utils.arrayFirst(['a', 'b', 'c', 'b2'], matchB)

    expect(result).to.equal('b')
  })

  it('Should return undefined with empty arrays, and not call the predicate', function () {
    const predicate = sinon.spy()

    const result = ko.utils.arrayFirst([], predicate)

    expect(result).to.equal(undefined)
    sinon.assert.notCalled(predicate)
  })

  it('Should test the predicate on every element before the first matching element', function () {
    ko.utils.arrayFirst(['a', 'b', 'c'], matchB)

    sinon.assert.callCount(matchB, 2)
    expect(matchB.getCall(0).args).to.deep.equal(['a', 0, ['a', 'b', 'c']])
    expect(matchB.getCall(1).args).to.deep.equal(['b', 1, ['a', 'b', 'c']])
  })

  it('Should return undefined if no element matches', function () {
    const result = ko.utils.arrayFirst(['a', 'b', 'c'], matchD)
    expect(result).to.equal(undefined)
  })

  it('Should test every element if no element matches', function () {
    ko.utils.arrayFirst(['a', 'b', 'c'], matchD)

    sinon.assert.callCount(matchD, 3)
    expect(matchD.getCall(0).args).to.deep.equal(['a', 0, ['a', 'b', 'c']])
    expect(matchD.getCall(1).args).to.deep.equal(['b', 1, ['a', 'b', 'c']])
    expect(matchD.getCall(2).args).to.deep.equal(['c', 2, ['a', 'b', 'c']])
  })

  it('Should throw an error for a null array', function () {
    expect(function () {
      const nullArray: Array<any> = null as unknown as Array<any>
      ko.utils.arrayFirst(nullArray, function () {
        return false
      })
    }).to.throw()
  })
})

describe('arrayGetDistinctValues', function () {
  it('Should remove duplicates from an array of non-unique values', function () {
    const result = ko.utils.arrayGetDistinctValues(['a', 'b', 'b', 'c', 'c'])
    expect(result).to.deep.equal(['a', 'b', 'c'])
  })

  it('Should do nothing with an empty array', function () {
    const result = ko.utils.arrayGetDistinctValues([])
    expect(result).to.deep.equal([])
  })

  it('Should do nothing with an array of unique values', function () {
    const result = ko.utils.arrayGetDistinctValues(['a', 'b', 'c'])
    expect(result).to.deep.equal(['a', 'b', 'c'])
  })

  it('Should copy the input array', function () {
    const input = ['a', 'b', 'c', 'c']
    const result = ko.utils.arrayGetDistinctValues(input)
    expect(result).to.not.equal(input)
  })

  it("Should copy the input array, even if it's unchanged", function () {
    const input = ['a', 'b', 'c']
    const result = ko.utils.arrayGetDistinctValues(input)
    expect(result).to.deep.equal(input)
    expect(result).to.not.equal(input)
  })

  it('Should return an empty array when called with a null array', function () {
    const nullArray: Array<any> = null as unknown as Array<any>
    const result = ko.utils.arrayGetDistinctValues(nullArray)
    expect(result).to.deep.equal([])
  })
})

describe('arrayMap', function () {
  it('Should return the array with every element transformed by the map function', function () {
    const appendIndex = function (x, i) {
      return x + i
    }

    const result = ko.utils.arrayMap(['a', 'b', 'c'], appendIndex)

    expect(result).to.deep.equal(['a0', 'b1', 'c2'])
  })

  it('Should return empty arrays for empty arrays, and not call the map function', function () {
    const mapFunction = sinon.spy()

    const result = ko.utils.arrayMap([], mapFunction)

    expect(result).to.deep.equal([])
    sinon.assert.notCalled(mapFunction)
  })

  it('Should copy the array before returning it', function () {
    const identityFunction = function (x) {
      return x
    }

    const input = ['a', 'b', 'c']
    const result = ko.utils.arrayMap(input, identityFunction)

    expect(result).to.deep.equal(input)
    expect(result).to.not.equal(input)
  })

  it('Should alter "this" context when defined as an argument', function () {
    const expectedContext = {}
    let actualContext = null
    const identityFunction = function (x) {
      actualContext = this
      return x
    }

    utils.arrayMap(['a'], identityFunction, expectedContext)

    expect(actualContext).to.equal(expectedContext)
  })

  it('Should return an empty array when called with a null array', function () {
    const nullArray: Array<any> = null as unknown as Array<any>
    const result = ko.utils.arrayMap(nullArray, function () {})
    expect(result).to.deep.equal([])
  })
})

describe('arrayFilter', function () {
  it('Should filter the array to only show matching members', function () {
    const evenOnly = function (x, i) {
      return i % 2 == 0
    }

    const result = ko.utils.arrayFilter(['a', 'b', 'c', 'd'], evenOnly)

    expect(result).to.deep.equal(['a', 'c'])
  })

  it('Should return empty arrays for empty arrays, and not call the filter function', function () {
    const filterFunction = sinon.spy()

    const result = ko.utils.arrayFilter([], filterFunction)

    expect(result).to.deep.equal([])
    sinon.assert.notCalled(filterFunction)
  })

  it('Should copy the array before returning it', function () {
    const alwaysTrue = function () {
      return true
    }

    const input = ['a', 'b', 'c']
    const result = ko.utils.arrayFilter(input, alwaysTrue)

    expect(result).to.deep.equal(input)
    expect(result).to.not.equal(input)
  })

  it('Should alter "this" context when defined as an argument', function () {
    const expectedContext = {}
    let actualContext = null
    const identityFunction = function (x) {
      actualContext = this
      return x
    }

    const result = utils.arrayFilter(['a'], identityFunction, expectedContext)

    expect(actualContext).to.equal(expectedContext)
  })

  it('Should return an empty array when called with a null array', function () {
    const nullArray: Array<any> = null as unknown as Array<any>
    const result = ko.utils.arrayFilter(nullArray, function () {
      return true
    })
    expect(result).to.deep.equal([])
  })
})

describe('arrayPushAll', function () {
  it('appends the second array elements to the first array', function () {
    const targetArray = [1, 2, 3]
    //var extraArray = ['a', 'b', 'c']
    const extraArray = [4, 5, 6]

    ko.utils.arrayPushAll(targetArray, extraArray)

    expect(targetArray).to.deep.equal([1, 2, 3, 4, 5, 6])
  })

  it('does nothing if the second array is empty', function () {
    const targetArray = [1, 2, 3]
    ko.utils.arrayPushAll(targetArray, [])
    expect(targetArray).to.deep.equal([1, 2, 3])
  })

  it('Should throw an error for a null first array', function () {
    expect(function () {
      const nullArray: Array<never> = null as unknown as Array<never>
      ko.utils.arrayPushAll(nullArray, [])
    }).to.throw()
  })

  it('Should throw an error for a null second array', function () {
    expect(function () {
      const nullArray: Array<never> = null as unknown as Array<never>
      ko.utils.arrayPushAll([], nullArray)
    }).to.throw()
  })
})

describe('Function.bind', function () {
  // In most browsers, this will be testing the native implementation
  // Adapted from Lo-Dash (https://github.com/lodash/lodash)
  function fn(...args) {
    const result = [this]
    result.push.apply(result, args)
    return result
  }

  it('should bind a function to an object', function () {
    const object = {},
      bound = fn.bind(object) as any

    expect(bound('a')).to.deep.equal([object, 'a'])
  })

  it('should accept a falsy `thisArg` argument', function () {
    ko.utils.arrayForEach(['', 0, false, NaN], function (value) {
      const bound = fn.bind(value)
      expect(bound()[0].constructor).to.equal(Object(value).constructor)
    })
  })

  it('should bind a function to `null` or `undefined`', function () {
    let bound = fn.bind(null) as any,
      actual = bound('a'),
      global = globalThis

    expect([null, undefined, global]).to.contain(actual[0])
    expect(actual[1]).to.equal('a')

    bound = fn.bind(undefined)
    actual = bound('b')

    expect([null, undefined, global]).to.contain(actual[0])
    expect(actual[1]).to.equal('b')

    bound = fn.bind(null)
    actual = bound('b')

    expect([null, undefined, global]).to.contain(actual[0])
    expect(actual[1]).to.equal('b')
  })

  it('should partially apply arguments', function () {
    let object = {}
    let bound = fn.bind(object, 'a') as any

    expect(bound()).to.deep.equal([object, 'a'])

    bound = fn.bind(object, 'a')
    expect(bound('b')).to.deep.equal([object, 'a', 'b'])

    bound = fn.bind(object, 'a', 'b')
    expect(bound()).to.deep.equal([object, 'a', 'b'])
    expect(bound('c', 'd')).to.deep.equal([object, 'a', 'b', 'c', 'd'])
  })

  it('should append array arguments to partially applied arguments', function () {
    const object = {},
      bound = fn.bind(object, 'a') as any

    expect(bound(['b'], 'c')).to.deep.equal([object, 'a', ['b'], 'c'])
  })

  it('should rebind functions correctly', function () {
    const object1 = {},
      object2 = {},
      object3 = {}

    const bound1 = fn.bind(object1),
      bound2 = bound1.bind(object2, 'a'),
      bound3 = bound1.bind(object3, 'b')

    expect(bound1()).to.deep.equal([object1])
    expect(bound2()).to.deep.equal([object1, 'a'])
    expect(bound3()).to.deep.equal([object1, 'b'])
  })
})

describe('objectMap', function () {
  it('Should alter "this" context when defined as an argument', function () {
    const expectedContext = {}
    let actualContext = null
    const identityFunction = function (obj) {
      actualContext = this
      return { x: obj.x }
    }

    ko.utils.objectMap({ x: 1 }, identityFunction, expectedContext)

    expect(actualContext).to.equal(expectedContext)
  })
})

describe('cloneNodes', function () {
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = prepareTestNode()
  })

  it('should return clones', function () {
    const newNodes = ko.utils.cloneNodes([testNode])
    const isClone = !testNode.isSameNode(newNodes[0]) && testNode.isEqualNode(newNodes[0])
    expect(isClone).to.equal(true)
  })

  it('should clone deeply', function () {
    const child = document.createElement('DIV')
    testNode.appendChild(child)

    const newNodes = ko.utils.cloneNodes([testNode])
    const newChild = newNodes[0].children[0]

    const childIsClone = !child.isSameNode(newChild) && child.isEqualNode(newChild)

    expect(childIsClone).to.equal(true)
  })

  describe('safeStringfy', () => {
    const { safeStringify } = utils

    it('stringifies plain objects', () => {
      expect(safeStringify({})).to.equal('{}')
    })

    it('stringifies recursive objects', () => {
      type Recursive = { b: number; c: number; a?: Recursive }
      const recursive: Recursive = { b: 1, c: 1 }
      recursive.a = recursive

      const expectObj = { b: 1, c: 1, a: '...' }
      expect(JSON.parse(safeStringify(recursive))).to.deep.equal(expectObj)
    })
  })
})
