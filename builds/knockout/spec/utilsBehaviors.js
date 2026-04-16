describe('unwrapObservable', function () {
  it('Should return the underlying value of observables', function () {
    var someObject = { abc: 123 },
      observablePrimitiveValue = ko.observable(123),
      observableObjectValue = ko.observable(someObject),
      observableNullValue = ko.observable(null),
      observableUndefinedValue = ko.observable(undefined),
      computedValue = ko.computed(function () {
        return observablePrimitiveValue() + 1
      })

    expect(ko.utils.unwrapObservable(observablePrimitiveValue)).to.equal(123)
    expect(ko.utils.unwrapObservable(observableObjectValue)).to.equal(someObject)
    expect(ko.utils.unwrapObservable(observableNullValue)).to.equal(null)
    expect(ko.utils.unwrapObservable(observableUndefinedValue)).to.equal(undefined)
    expect(ko.utils.unwrapObservable(computedValue)).to.equal(124)
  })

  it('Should return the supplied value for non-observables', function () {
    var someObject = { abc: 123 }

    expect(ko.utils.unwrapObservable(123)).to.equal(123)
    expect(ko.utils.unwrapObservable(someObject)).to.equal(someObject)
    expect(ko.utils.unwrapObservable(null)).to.equal(null)
    expect(ko.utils.unwrapObservable(undefined)).to.equal(undefined)
  })

  it('Should be aliased as ko.unwrap', function () {
    expect(ko.unwrap).to.equal(ko.utils.unwrapObservable)
    expect(ko.unwrap(ko.observable('some value'))).to.equal('some value')
  })
})

describe('arrayForEach', function () {
  it('Should go call the callback for each element of the array, in order', function () {
    var callback = sinon.stub()

    ko.utils.arrayForEach(['a', 'b', 'c'], callback)

    expect(callback.callCount).to.equal(3)
    expect(callback.getCalls()[0].args).to.deep.equal(['a', 0, ['a', 'b', 'c']])
    expect(callback.getCalls()[1].args).to.deep.equal(['b', 1, ['a', 'b', 'c']])
    expect(callback.getCalls()[2].args).to.deep.equal(['c', 2, ['a', 'b', 'c']])
  })

  it('Should do nothing with empty arrays', function () {
    var callback = sinon.stub()

    ko.utils.arrayForEach([], callback)

    expect(callback.called).to.equal(false)
  })

  it('Should alter "this" context when defined as an argument', function () {
    var expectedContext = {}
    var actualContext = null
    ko.utils.arrayForEach(
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
      ko.utils.arrayForEach(null, function () {})
    }).to.throw()
  })
})

describe('arrayIndexOf', function () {
  it('Should return the index if the element is found in the input array', function () {
    var result = ko.utils.arrayIndexOf(['a', 'b', 'c'], 'b')
    expect(result).to.equal(1)
  })

  it('Should return -1 for empty arrays', function () {
    var result = ko.utils.arrayIndexOf([], 'a')
    expect(result).to.equal(-1)
  })

  it('Should return -1 if the element is not found', function () {
    var result = ko.utils.arrayIndexOf(['a', 'b', 'c'], 'd')
    expect(result).to.equal(-1)
  })

  it('Should return the first index if the element is found twice', function () {
    var result = ko.utils.arrayIndexOf(['a', 'b', 'c', 'c'], 'c')
    expect(result).to.equal(2)
  })

  it('Should throw an error for a null array', function () {
    expect(function () {
      ko.utils.arrayIndexOf(null, 'a')
    }).to.throw()
  })
})

describe('arrayRemoveItem', function () {
  it('Should remove the matching element if found', function () {
    var input = ['a', 'b', 'c']
    ko.utils.arrayRemoveItem(input, 'a')
    expect(input).to.deep.equal(['b', 'c'])
  })

  it('Should do nothing for empty arrays', function () {
    var input = []
    ko.utils.arrayRemoveItem(input, 'a')
    expect(input).to.deep.equal([])
  })

  it('Should do nothing if no matching element is found', function () {
    var input = ['a', 'b', 'c']
    ko.utils.arrayRemoveItem(input, 'd')
    expect(input).to.deep.equal(['a', 'b', 'c'])
  })

  it('Should remove only the first matching element', function () {
    var input = ['a', 'b', 'b', 'c']
    ko.utils.arrayRemoveItem(input, 'b')
    expect(input).to.deep.equal(['a', 'b', 'c'])
  })

  it('Should throw an error for a null array', function () {
    expect(function () {
      ko.utils.arrayRemoteItem(null, 'a')
    }).to.throw()
  })
})

describe('arrayFirst', function () {
  var matchB, matchD

  beforeEach(function () {
    matchB = sinon.stub().callsFake(function (x) {
      return x.charAt(0) === 'b'
    })

    matchD = sinon.stub().callsFake(function (x) {
      return x.charAt(0) === 'd'
    })
  })

  it('Should return the first matching element from the input array', function () {
    var result = ko.utils.arrayFirst(['a', 'b', 'c', 'b2'], matchB)

    expect(result).to.equal('b')
  })

  it('Should return undefined with empty arrays, and not call the predicate', function () {
    var predicate = sinon.stub()

    var result = ko.utils.arrayFirst([], predicate)

    expect(result).to.equal(undefined)
    expect(predicate.called).to.equal(false)
  })

  it('Should test the predicate on every element before the first matching element', function () {
    ko.utils.arrayFirst(['a', 'b', 'c'], matchB)

    expect(matchB.callCount).to.equal(2)
    expect(matchB.getCalls()[0].args).to.deep.equal(['a', 0, ['a', 'b', 'c']])
    expect(matchB.getCalls()[1].args).to.deep.equal(['b', 1, ['a', 'b', 'c']])
  })

  it('Should return undefined if no element matches', function () {
    var result = ko.utils.arrayFirst(['a', 'b', 'c'], matchD)

    expect(result).to.equal(undefined)
  })

  it('Should test every element if no element matches', function () {
    ko.utils.arrayFirst(['a', 'b', 'c'], matchD)

    expect(matchD.callCount).to.equal(3)
    expect(matchD.getCalls()[0].args).to.deep.equal(['a', 0, ['a', 'b', 'c']])
    expect(matchD.getCalls()[1].args).to.deep.equal(['b', 1, ['a', 'b', 'c']])
    expect(matchD.getCalls()[2].args).to.deep.equal(['c', 2, ['a', 'b', 'c']])
  })

  it('Should throw an error for a null array', function () {
    expect(function () {
      ko.utils.arrayFirst(null, function () {})
    }).to.throw()
  })
})

describe('arrayGetDistinctValues', function () {
  it('Should remove duplicates from an array of non-unique values', function () {
    var result = ko.utils.arrayGetDistinctValues(['a', 'b', 'b', 'c', 'c'])
    expect(result).to.deep.equal(['a', 'b', 'c'])
  })

  it('Should do nothing with an empty array', function () {
    var result = ko.utils.arrayGetDistinctValues([])
    expect(result).to.deep.equal([])
  })

  it('Should do nothing with an array of unique values', function () {
    var result = ko.utils.arrayGetDistinctValues(['a', 'b', 'c'])
    expect(result).to.deep.equal(['a', 'b', 'c'])
  })

  it('Should copy the input array', function () {
    var input = ['a', 'b', 'c', 'c']
    var result = ko.utils.arrayGetDistinctValues(input)
    expect(result).not.to.equal(input)
  })

  it("Should copy the input array, even if it's unchanged", function () {
    var input = ['a', 'b', 'c']
    var result = ko.utils.arrayGetDistinctValues(input)
    expect(result).to.deep.equal(input)
    expect(result).not.to.equal(input)
  })

  it('Should return an empty array when called with a null array', function () {
    var result = ko.utils.arrayGetDistinctValues(null)
    expect(result).to.deep.equal([])
  })
})

describe('arrayMap', function () {
  it('Should return the array with every element transformed by the map function', function () {
    var appendIndex = function (x, i) {
      return x + i
    }

    var result = ko.utils.arrayMap(['a', 'b', 'c'], appendIndex)

    expect(result).to.deep.equal(['a0', 'b1', 'c2'])
  })

  it('Should return empty arrays for empty arrays, and not call the map function', function () {
    var mapFunction = sinon.stub()

    var result = ko.utils.arrayMap([], mapFunction)

    expect(result).to.deep.equal([])
    expect(mapFunction.called).to.equal(false)
  })

  it('Should copy the array before returning it', function () {
    var identityFunction = function (x) {
      return x
    }

    var input = ['a', 'b', 'c']
    var result = ko.utils.arrayMap(input, identityFunction)

    expect(result).to.deep.equal(input)
    expect(result).not.to.equal(input)
  })

  it('Should alter "this" context when defined as an argument', function () {
    var expectedContext = {}
    var actualContext = null
    var identityFunction = function (x) {
      actualContext = this
      return x
    }

    ko.utils.arrayMap(['a'], identityFunction, expectedContext)

    expect(actualContext).to.equal(expectedContext)
  })

  it('Should return an empty array when called with a null array', function () {
    var result = ko.utils.arrayMap(null, function () {})
    expect(result).to.deep.equal([])
  })
})

describe('arrayFilter', function () {
  it('Should filter the array to only show matching members', function () {
    var evenOnly = function (x, i) {
      return i % 2 == 0
    }

    var result = ko.utils.arrayFilter(['a', 'b', 'c', 'd'], evenOnly)

    expect(result).to.deep.equal(['a', 'c'])
  })

  it('Should return empty arrays for empty arrays, and not call the filter function', function () {
    var filterFunction = sinon.stub()

    var result = ko.utils.arrayFilter([], filterFunction)

    expect(result).to.deep.equal([])
    expect(filterFunction.called).to.equal(false)
  })

  it('Should copy the array before returning it', function () {
    var alwaysTrue = function (x) {
      return true
    }

    var input = ['a', 'b', 'c']
    var result = ko.utils.arrayFilter(input, alwaysTrue)

    expect(result).to.deep.equal(input)
    expect(result).not.to.equal(input)
  })

  it('Should alter "this" context when defined as an argument', function () {
    var expectedContext = {}
    var actualContext = null
    var identityFunction = function (x) {
      actualContext = this
      return x
    }

    var result = ko.utils.arrayFilter(['a'], identityFunction, expectedContext)

    expect(expectedContext).to.deep.equal(actualContext)
  })

  it('Should return an empty array when called with a null array', function () {
    var result = ko.utils.arrayFilter(null, function () {})
    expect(result).to.deep.equal([])
  })
})

describe('arrayPushAll', function () {
  it('appends the second array elements to the first array', function () {
    var targetArray = [1, 2, 3]
    var extraArray = ['a', 'b', 'c']

    ko.utils.arrayPushAll(targetArray, extraArray)

    expect(targetArray).to.deep.equal([1, 2, 3, 'a', 'b', 'c'])
  })

  it('does nothing if the second array is empty', function () {
    var targetArray = [1, 2, 3]
    ko.utils.arrayPushAll(targetArray, [])
    expect(targetArray).to.deep.equal([1, 2, 3])
  })

  it('Should throw an error for a null first array', function () {
    expect(function () {
      ko.utils.arrayPushAll(null, [])
    }).to.throw()
  })

  it('Should throw an error for a null second array', function () {
    expect(function () {
      ko.utils.arrayPushAll([], null)
    }).to.throw()
  })
})

describe('Function.bind', function () {
  // In most browsers, this will be testing the native implementation
  // Adapted from Lo-Dash (https://github.com/lodash/lodash)
  function fn() {
    var result = [this]
    result.push.apply(result, arguments)
    return result
  }

  it('should bind a function to an object', function () {
    var object = {},
      bound = fn.bind(object)

    expect(bound('a')).to.deep.equal([object, 'a'])
  })

  it('should accept a falsy `thisArg` argument', function () {
    ko.utils.arrayForEach(['', 0, false, NaN], function (value) {
      var bound = fn.bind(value)
      expect(bound()[0].constructor).to.deep.equal(Object(value).constructor)
    })
  })

  it('should bind a function to `null` or `undefined`', function () {
    var bound = fn.bind(null),
      actual = bound('a'),
      global = window

    expect(actual[0]).to.be.oneOf([null, global])
    expect(actual[1]).to.deep.equal('a')

    bound = fn.bind(undefined)
    actual = bound('b')

    expect(actual[0]).to.be.oneOf([undefined, global])
    expect(actual[1]).to.deep.equal('b')

    bound = fn.bind()
    actual = bound('b')

    expect(actual[0]).to.be.oneOf([undefined, global])
    expect(actual[1]).to.deep.equal('b')
  })

  it('should partially apply arguments', function () {
    var object = {},
      bound = fn.bind(object, 'a')

    expect(bound()).to.deep.equal([object, 'a'])

    bound = fn.bind(object, 'a')
    expect(bound('b')).to.deep.equal([object, 'a', 'b'])

    bound = fn.bind(object, 'a', 'b')
    expect(bound()).to.deep.equal([object, 'a', 'b'])
    expect(bound('c', 'd')).to.deep.equal([object, 'a', 'b', 'c', 'd'])
  })

  it('should append array arguments to partially applied arguments', function () {
    var object = {},
      bound = fn.bind(object, 'a')

    expect(bound(['b'], 'c')).to.deep.equal([object, 'a', ['b'], 'c'])
  })

  it('should rebind functions correctly', function () {
    var object1 = {},
      object2 = {},
      object3 = {}

    var bound1 = fn.bind(object1),
      bound2 = bound1.bind(object2, 'a'),
      bound3 = bound1.bind(object3, 'b')

    expect(bound1()).to.deep.equal([object1])
    expect(bound2()).to.deep.equal([object1, 'a'])
    expect(bound3()).to.deep.equal([object1, 'b'])
  })
})

describe('objectMap', function () {
  it('Should alter "this" context when defined as an argument', function () {
    var expectedContext = {}
    var actualContext = null
    var identityFunction = function (obj) {
      actualContext = this
      return { x: obj.x }
    }

    var result = ko.utils.objectMap({ x: 1 }, identityFunction, expectedContext)

    expect(expectedContext).to.deep.equal(actualContext)
  })
})
