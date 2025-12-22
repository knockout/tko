import * as utils from '../dist'
import '../helpers/jasmine-13-helper'
import type { KnockoutInstance } from '@tko/builder'

const ko: KnockoutInstance = globalThis.ko || {}

ko.utils = utils
ko.tasks = utils.tasks

describe('arrayForEach', function () {
  it('Should go call the callback for each element of the array, in order', function () {
    const callback = jasmine.createSpy('callback')

    ko.utils.arrayForEach(['a', 'b', 'c'], callback)

    expect(callback.calls.length).toBe(3)
    expect(callback.calls[0].args).toEqual(['a', 0, ['a', 'b', 'c']])
    expect(callback.calls[1].args).toEqual(['b', 1, ['a', 'b', 'c']])
    expect(callback.calls[2].args).toEqual(['c', 2, ['a', 'b', 'c']])
  })

  it('Should do nothing with empty arrays', function () {
    const callback = jasmine.createSpy('callback')

    ko.utils.arrayForEach([], callback)

    expect(callback).not.toHaveBeenCalled()
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
    expect(actualContext).toBe(expectedContext)
  })

  it('Should throw an error for a null array', function () {
    expect(function () {
      const nullArray: Array<any> = null as unknown as Array<any>
      ko.utils.arrayForEach(nullArray, function () {})
    }).toThrow()
  })
})

describe('arrayIndexOf', function () {
  it('Should return the index if the element is found in the input array', function () {
    const result = ko.utils.arrayIndexOf(['a', 'b', 'c'], 'b')
    expect(result).toBe(1)
  })

  it('Should return -1 for empty arrays', function () {
    const result = ko.utils.arrayIndexOf([], 'a')
    expect(result).toBe(-1)
  })

  it('Should return -1 if the element is not found', function () {
    const result = ko.utils.arrayIndexOf(['a', 'b', 'c'], 'd')
    expect(result).toBe(-1)
  })

  it('Should return the first index if the element is found twice', function () {
    const result = ko.utils.arrayIndexOf(['a', 'b', 'c', 'c'], 'c')
    expect(result).toBe(2)
  })

  it('Should throw an error for a null array', function () {
    expect(function () {
      const nullArray: Array<string> = null as unknown as Array<string>
      ko.utils.arrayIndexOf(nullArray, 'a')
    }).toThrow()
  })
})

describe('arrayRemoveItem', function () {
  it('Should remove the matching element if found', function () {
    const input = ['a', 'b', 'c']
    ko.utils.arrayRemoveItem(input, 'a')
    expect(input).toEqual(['b', 'c'])
  })

  it('Should do nothing for empty arrays', function () {
    const input = new Array()
    ko.utils.arrayRemoveItem(input, 'a')
    expect(input).toEqual([])
  })

  it('Should do nothing if no matching element is found', function () {
    const input = ['a', 'b', 'c']
    ko.utils.arrayRemoveItem(input, 'd')
    expect(input).toEqual(['a', 'b', 'c'])
  })

  it('Should remove only the first matching element', function () {
    const input = ['a', 'b', 'b', 'c']
    ko.utils.arrayRemoveItem(input, 'b')
    expect(input).toEqual(['a', 'b', 'c'])
  })

  it('Should throw an error for a null array', function () {
    expect(function () {
      const nullArray: Array<string> = null as unknown as Array<string>
      ko.utils.arrayRemoveItem(nullArray, 'a')
    }).toThrow()
  })
})

describe('arrayFirst', function () {
  let matchB, matchD

  beforeEach(function () {
    matchB = jasmine.createSpy('matchB').andCallFake(function (x) {
      return x.charAt(0) === 'b'
    })

    matchD = jasmine.createSpy('matchD').andCallFake(function (x) {
      return x.charAt(0) === 'd'
    })
  })

  it('Should return the first matching element from the input array', function () {
    const result = ko.utils.arrayFirst(['a', 'b', 'c', 'b2'], matchB)

    expect(result).toBe('b')
  })

  it('Should return undefined with empty arrays, and not call the predicate', function () {
    const predicate = jasmine.createSpy('predicate')

    const result = ko.utils.arrayFirst([], predicate)

    expect(result).toBe(undefined)
    expect(predicate).not.toHaveBeenCalled()
  })

  it('Should test the predicate on every element before the first matching element', function () {
    ko.utils.arrayFirst(['a', 'b', 'c'], matchB)

    expect(matchB.calls.length).toBe(2)
    expect(matchB.calls[0].args).toEqual(['a', 0, ['a', 'b', 'c']])
    expect(matchB.calls[1].args).toEqual(['b', 1, ['a', 'b', 'c']])
  })

  it('Should return undefined if no element matches', function () {
    const result = ko.utils.arrayFirst(['a', 'b', 'c'], matchD)
    expect(result).toBe(undefined)
  })

  it('Should test every element if no element matches', function () {
    ko.utils.arrayFirst(['a', 'b', 'c'], matchD)

    expect(matchD.calls.length).toBe(3)
    expect(matchD.calls[0].args).toEqual(['a', 0, ['a', 'b', 'c']])
    expect(matchD.calls[1].args).toEqual(['b', 1, ['a', 'b', 'c']])
    expect(matchD.calls[2].args).toEqual(['c', 2, ['a', 'b', 'c']])
  })

  it('Should throw an error for a null array', function () {
    expect(function () {
      const nullArray: Array<any> = null as unknown as Array<any>
      ko.utils.arrayFirst(nullArray, function () {
        return false
      })
    }).toThrow()
  })
})

describe('arrayGetDistinctValues', function () {
  it('Should remove duplicates from an array of non-unique values', function () {
    const result = ko.utils.arrayGetDistinctValues(['a', 'b', 'b', 'c', 'c'])
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('Should do nothing with an empty array', function () {
    const result = ko.utils.arrayGetDistinctValues([])
    expect(result).toEqual([])
  })

  it('Should do nothing with an array of unique values', function () {
    const result = ko.utils.arrayGetDistinctValues(['a', 'b', 'c'])
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('Should copy the input array', function () {
    const input = ['a', 'b', 'c', 'c']
    const result = ko.utils.arrayGetDistinctValues(input)
    expect(result).not.toBe(input)
  })

  it("Should copy the input array, even if it's unchanged", function () {
    const input = ['a', 'b', 'c']
    const result = ko.utils.arrayGetDistinctValues(input)
    expect(result).toEqual(input)
    expect(result).not.toBe(input)
  })

  it('Should return an empty array when called with a null array', function () {
    const nullArray: Array<any> = null as unknown as Array<any>
    const result = ko.utils.arrayGetDistinctValues(nullArray)
    expect(result).toEqual([])
  })
})

describe('arrayMap', function () {
  it('Should return the array with every element transformed by the map function', function () {
    const appendIndex = function (x, i) {
      return x + i
    }

    const result = ko.utils.arrayMap(['a', 'b', 'c'], appendIndex)

    expect(result).toEqual(['a0', 'b1', 'c2'])
  })

  it('Should return empty arrays for empty arrays, and not call the map function', function () {
    const mapFunction = jasmine.createSpy('mapFunction')

    const result = ko.utils.arrayMap([], mapFunction)

    expect(result).toEqual([])
    expect(mapFunction).not.toHaveBeenCalled()
  })

  it('Should copy the array before returning it', function () {
    const identityFunction = function (x) {
      return x
    }

    const input = ['a', 'b', 'c']
    const result = ko.utils.arrayMap(input, identityFunction)

    expect(result).toEqual(input)
    expect(result).not.toBe(input)
  })

  it('Should alter "this" context when defined as an argument', function () {
    const expectedContext = {}
    let actualContext = null
    const identityFunction = function (x) {
      actualContext = this
      return x
    }

    utils.arrayMap(['a'], identityFunction, expectedContext)

    expect(actualContext).toBe(expectedContext)
  })

  it('Should return an empty array when called with a null array', function () {
    const nullArray: Array<any> = null as unknown as Array<any>
    const result = ko.utils.arrayMap(nullArray, function () {})
    expect(result).toEqual([])
  })
})

describe('arrayFilter', function () {
  it('Should filter the array to only show matching members', function () {
    const evenOnly = function (x, i) {
      return i % 2 == 0
    }

    const result = ko.utils.arrayFilter(['a', 'b', 'c', 'd'], evenOnly)

    expect(result).toEqual(['a', 'c'])
  })

  it('Should return empty arrays for empty arrays, and not call the filter function', function () {
    const filterFunction = jasmine.createSpy('filterFunction')

    const result = ko.utils.arrayFilter([], filterFunction)

    expect(result).toEqual([])
    expect(filterFunction).not.toHaveBeenCalled()
  })

  it('Should copy the array before returning it', function () {
    const alwaysTrue = function () {
      return true
    }

    const input = ['a', 'b', 'c']
    const result = ko.utils.arrayFilter(input, alwaysTrue)

    expect(result).toEqual(input)
    expect(result).not.toBe(input)
  })

  it('Should alter "this" context when defined as an argument', function () {
    const expectedContext = {}
    let actualContext = null
    const identityFunction = function (x) {
      actualContext = this
      return x
    }

    const result = utils.arrayFilter(['a'], identityFunction, expectedContext)

    expect(expectedContext).toEqual(actualContext)
  })

  it('Should return an empty array when called with a null array', function () {
    const nullArray: Array<any> = null as unknown as Array<any>
    const result = ko.utils.arrayFilter(nullArray, function () {
      return true
    })
    expect(result).toEqual([])
  })
})

describe('arrayPushAll', function () {
  it('appends the second array elements to the first array', function () {
    const targetArray = [1, 2, 3]
    //var extraArray = ['a', 'b', 'c']
    const extraArray = [4, 5, 6]

    ko.utils.arrayPushAll(targetArray, extraArray)

    expect(targetArray).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('does nothing if the second array is empty', function () {
    const targetArray = [1, 2, 3]
    ko.utils.arrayPushAll(targetArray, [])
    expect(targetArray).toEqual([1, 2, 3])
  })

  it('Should throw an error for a null first array', function () {
    expect(function () {
      const nullArray: Array<never> = null as unknown as Array<never>
      ko.utils.arrayPushAll(nullArray, [])
    }).toThrow()
  })

  it('Should throw an error for a null second array', function () {
    expect(function () {
      const nullArray: Array<never> = null as unknown as Array<never>
      ko.utils.arrayPushAll([], nullArray)
    }).toThrow()
  })
})

describe('Function.bind', function () {
  // In most browsers, this will be testing the native implementation
  // Adapted from Lo-Dash (https://github.com/lodash/lodash)
  function fn() {
    const result = [this]
    result.push.apply(result, arguments)
    return result
  }

  it('should bind a function to an object', function () {
    const object = {},
      bound = fn.bind(object)

    expect(bound('a')).toEqual([object, 'a'])
  })

  it('should accept a falsy `thisArg` argument', function () {
    ko.utils.arrayForEach(['', 0, false, NaN], function (value) {
      const bound = fn.bind(value)
      expect(bound()[0].constructor).toEqual(Object(value).constructor)
    })
  })

  it('should bind a function to `null` or `undefined`', function () {
    let bound = fn.bind(null),
      actual = bound('a'),
      global = jasmine.getGlobal()

    expect(actual[0]).toEqualOneOf([null, global])
    expect(actual[1]).toEqual('a')

    bound = fn.bind(undefined)
    actual = bound('b')

    expect(actual[0]).toEqualOneOf([undefined, global])
    expect(actual[1]).toEqual('b')

    bound = fn.bind(null)
    actual = bound('b')

    expect(actual[0]).toEqualOneOf([undefined, global])
    expect(actual[1]).toEqual('b')
  })

  it('should partially apply arguments', function () {
    let object = {},
      bound = fn.bind(object, 'a')

    expect(bound()).toEqual([object, 'a'])

    bound = fn.bind(object, 'a')
    expect(bound('b')).toEqual([object, 'a', 'b'])

    bound = fn.bind(object, 'a', 'b')
    expect(bound()).toEqual([object, 'a', 'b'])
    expect(bound('c', 'd')).toEqual([object, 'a', 'b', 'c', 'd'])
  })

  it('should append array arguments to partially applied arguments', function () {
    const object = {},
      bound = fn.bind(object, 'a')

    expect(bound(['b'], 'c')).toEqual([object, 'a', ['b'], 'c'])
  })

  it('should rebind functions correctly', function () {
    const object1 = {},
      object2 = {},
      object3 = {}

    const bound1 = fn.bind(object1),
      bound2 = bound1.bind(object2, 'a'),
      bound3 = bound1.bind(object3, 'b')

    expect(bound1()).toEqual([object1])
    expect(bound2()).toEqual([object1, 'a'])
    expect(bound3()).toEqual([object1, 'b'])
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

    expect(expectedContext).toEqual(actualContext)
  })
})

describe('cloneNodes', function () {
  let testNode: HTMLElement
  beforeEach(function () {
    testNode = jasmine.prepareTestNode()
  })

  it('should return clones', function () {
    const newNodes = ko.utils.cloneNodes([testNode])
    const isClone = !testNode.isSameNode(newNodes[0]) && testNode.isEqualNode(newNodes[0])
    expect(isClone).toBe(true)
  })

  it('should clone deeply', function () {
    const child = document.createElement('DIV')
    testNode.appendChild(child)

    const newNodes = ko.utils.cloneNodes([testNode])
    const newChild = newNodes[0].children[0]

    const childIsClone = !child.isSameNode(newChild) && child.isEqualNode(newChild)

    expect(childIsClone).toBe(true)
  })

  describe('safeStringfy', () => {
    const { safeStringify } = utils

    it('stringifies plain objects', () => {
      expect(safeStringify({})).toEqual('{}')
    })

    it('stringifies recursive objects', () => {
      type Recursive = { b: number; c: number; a?: Recursive }
      const recursive: Recursive = { b: 1, c: 1 }
      recursive.a = recursive

      const expectObj = { b: 1, c: 1, a: '...' }
      expect(JSON.parse(safeStringify(recursive))).toEqual(expectObj)
    })
  })
})
