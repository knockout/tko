import { expect } from 'chai'

import { observableArray, isObservableArray, observable, isObservable, subscribable } from '../dist'

const browserSupportsProtoAssignment = typeof Object.setPrototypeOf === 'function'

describe('Observable Array', function () {
  let testObservableArray, notifiedValues, beforeNotifiedValues

  beforeEach(function () {
    testObservableArray = observableArray([1, 2, 3])
    notifiedValues = new Array()
    testObservableArray.subscribe(function (value) {
      notifiedValues.push(value ? value.slice(0) : value)
    })
    beforeNotifiedValues = new Array()
    testObservableArray.subscribe(
      function (value) {
        beforeNotifiedValues.push(value ? value.slice(0) : value)
      },
      null,
      'beforeChange'
    )
  })

  it('Should be observable', function () {
    expect(isObservable(testObservableArray)).to.equal(true)
  })

  it('Should advertise as observable array', function () {
    expect(isObservableArray(observableArray())).to.equal(true)
  })

  it('isObservableArray should return false for non-observable array values', function () {
    const types = [undefined, null, 'x', {}, function () {}, observable([])]

    types.forEach(value => expect(isObservableArray(value)).to.equal(false))
  })

  it('should be iterable', function () {
    expect(Array.from(testObservableArray)).to.deep.equal([1, 2, 3])
  })

  it('Should initialize to empty array if you pass no args to constructor', function () {
    const instance = observableArray()
    expect(instance().length).to.equal(0)
  })

  it('Should require constructor arg, if given, to be array-like or null or undefined', function () {
    // Try non-array-like args
    expect(function () {
      observableArray(1)
    }).to.throw()
    expect(function () {
      observableArray({})
    }).to.throw()

    // Try allowed args
    expect(observableArray([1, 2, 3])().length).to.equal(3)
    expect(observableArray(null)().length).to.equal(0)
    expect(observableArray(undefined)().length).to.equal(0)
  })

  it('Should be able to write values to it', function () {
    testObservableArray(['X', 'Y'])
    expect(notifiedValues.length).to.equal(1)
    expect(notifiedValues[0][0]).to.equal('X')
    expect(notifiedValues[0][1]).to.equal('Y')
  })

  interface MyModel {
    _destroy: any
  }

  it('Should be able to mark single items as destroyed', function () {
    const x: MyModel = { _destroy: null }
    const y: MyModel = { _destroy: null }
    testObservableArray([x, y])
    testObservableArray.destroy(y)
    expect(testObservableArray().length).to.equal(2)
    expect(x._destroy).to.equal(null)
    expect(y._destroy).to.equal(true)
  })

  it('Should be able to mark multiple items as destroyed', function () {
    const x: MyModel = { _destroy: null }
    const y: MyModel = { _destroy: null }
    const z: MyModel = { _destroy: null }

    testObservableArray([x, y, z])
    testObservableArray.destroyAll([x, z])
    expect(testObservableArray().length).to.equal(3)
    expect(x._destroy).to.equal(true)
    expect(y._destroy).to.equal(null)
    expect(z._destroy).to.equal(true)
  })

  it('Should be able to mark observable items as destroyed', function () {
    const x = observable(),
      y = observable()
    testObservableArray([x, y])
    testObservableArray.destroy(y)
    expect(testObservableArray().length).to.equal(2)
    expect(x._destroy).to.equal(undefined)
    expect(y._destroy).to.equal(true)
  })

  it('Should be able to mark all items as destroyed by passing no args to destroyAll()', function () {
    const x: MyModel = { _destroy: null }
    const y: MyModel = { _destroy: null }
    const z: MyModel = { _destroy: null }

    testObservableArray([x, y, z])
    testObservableArray.destroyAll()
    expect(testObservableArray().length).to.equal(3)
    expect(x._destroy).to.equal(true)
    expect(y._destroy).to.equal(true)
    expect(z._destroy).to.equal(true)
  })

  it('Should notify subscribers on push', function () {
    testObservableArray.push('Some new value')
    expect(notifiedValues).to.deep.equal([[1, 2, 3, 'Some new value']])
  })

  it('Should notify "beforeChange" subscribers before push', function () {
    testObservableArray.push('Some new value')
    expect(beforeNotifiedValues).to.deep.equal([[1, 2, 3]])
  })

  it('Should notify subscribers on pop', function () {
    const popped = testObservableArray.pop()
    expect(popped).to.equal(3)
    expect(notifiedValues).to.deep.equal([[1, 2]])
  })

  it('Should notify "beforeChange" subscribers before pop', function () {
    const popped = testObservableArray.pop()
    expect(popped).to.equal(3)
    expect(beforeNotifiedValues).to.deep.equal([[1, 2, 3]])
  })

  it('Should notify subscribers on splice', function () {
    const spliced = testObservableArray.splice(1, 1)
    expect(spliced).to.deep.equal([2])
    expect(notifiedValues).to.deep.equal([[1, 3]])
  })

  it('Should notify "beforeChange" subscribers before splice', function () {
    const spliced = testObservableArray.splice(1, 1)
    expect(spliced).to.deep.equal([2])
    expect(beforeNotifiedValues).to.deep.equal([[1, 2, 3]])
  })

  it('Should notify subscribers on remove by value', function () {
    testObservableArray(['Alpha', 'Beta', 'Gamma'])
    notifiedValues = new Array()
    const removed = testObservableArray.remove('Beta')
    expect(removed).to.deep.equal(['Beta'])
    expect(notifiedValues).to.deep.equal([['Alpha', 'Gamma']])
  })

  it('Should notify subscribers on remove by predicate', function () {
    testObservableArray(['Alpha', 'Beta', 'Gamma'])
    notifiedValues = new Array()
    const removed = testObservableArray.remove(function (value) {
      return value == 'Beta'
    })
    expect(removed).to.deep.equal(['Beta'])
    expect(notifiedValues).to.deep.equal([['Alpha', 'Gamma']])
  })

  it('Should notify subscribers on remove multiple by value', function () {
    testObservableArray(['Alpha', 'Beta', 'Gamma'])
    notifiedValues = new Array()
    const removed = testObservableArray.removeAll(['Gamma', 'Alpha'])
    expect(removed).to.deep.equal(['Alpha', 'Gamma'])
    expect(notifiedValues).to.deep.equal([['Beta']])
  })

  it('Should clear observable array entirely if you pass no args to removeAll()', function () {
    testObservableArray(['Alpha', 'Beta', 'Gamma'])
    notifiedValues = new Array()
    const removed = testObservableArray.removeAll()
    expect(removed).to.deep.equal(['Alpha', 'Beta', 'Gamma'])
    expect(notifiedValues).to.deep.equal([[]])
  })

  it('Should notify "beforeChange" subscribers before remove', function () {
    testObservableArray(['Alpha', 'Beta', 'Gamma'])
    beforeNotifiedValues = new Array()
    const removed = testObservableArray.remove('Beta')
    expect(removed).to.deep.equal(['Beta'])
    expect(beforeNotifiedValues).to.deep.equal([['Alpha', 'Beta', 'Gamma']])
  })

  it('Should not notify subscribers on remove by value with no match', function () {
    testObservableArray(['Alpha', 'Beta', 'Gamma'])
    notifiedValues = new Array()
    const removed = testObservableArray.remove('Delta')
    expect(removed).to.deep.equal([])
    expect(notifiedValues).to.deep.equal([])
  })

  it('Should not notify "beforeChange" subscribers before remove by value with no match', function () {
    testObservableArray(['Alpha', 'Beta', 'Gamma'])
    beforeNotifiedValues = new Array()
    const removed = testObservableArray.remove('Delta')
    expect(removed).to.deep.equal([])
    expect(beforeNotifiedValues).to.deep.equal([])
  })

  it('Should modify original array on remove', function () {
    const originalArray = ['Alpha', 'Beta', 'Gamma']
    testObservableArray(originalArray)
    notifiedValues = new Array()
    testObservableArray.remove('Beta')
    expect(originalArray).to.deep.equal(['Alpha', 'Gamma'])
  })

  it('Should modify original array on removeAll', function () {
    const originalArray = ['Alpha', 'Beta', 'Gamma']
    testObservableArray(originalArray)
    notifiedValues = new Array()
    testObservableArray.removeAll()
    expect(originalArray).to.deep.equal([])
  })

  it('Should remove matching observable items', function () {
    const x = observable(),
      y = observable()
    testObservableArray([x, y])
    notifiedValues = new Array()
    const removed = testObservableArray.remove(y)
    expect(testObservableArray()).to.deep.equal([x])
    expect(removed).to.deep.equal([y])
    expect(notifiedValues).to.deep.equal([[x]])
  })

  it('Should throw an exception if matching array item moved or removed during "remove"', function () {
    testObservableArray(['Alpha', 'Beta', 'Gamma'])
    notifiedValues = new Array()
    expect(function () {
      testObservableArray.remove(function (value) {
        if (value === 'Beta') {
          testObservableArray.splice(0, 1)
          return true
        }
        return false
      })
    }).to.throw()
    expect(testObservableArray()).to.deep.equal(['Beta', 'Gamma'])
  })

  it('Should notify subscribers on replace', function () {
    testObservableArray(['Alpha', 'Beta', 'Gamma'])
    notifiedValues = new Array()
    testObservableArray.replace('Beta', 'Delta')
    expect(notifiedValues).to.deep.equal([['Alpha', 'Delta', 'Gamma']])
  })

  it('Should notify "beforeChange" subscribers before replace', function () {
    testObservableArray(['Alpha', 'Beta', 'Gamma'])
    beforeNotifiedValues = new Array()
    testObservableArray.replace('Beta', 'Delta')
    expect(beforeNotifiedValues).to.deep.equal([['Alpha', 'Beta', 'Gamma']])
  })

  it('Should notify subscribers after marking items as destroyed', function () {
    const x: MyModel = { _destroy: null }
    const y: MyModel = { _destroy: null }
    let didNotify = false

    testObservableArray([x, y])
    testObservableArray.subscribe(function (/* value */) {
      expect(x._destroy).to.equal(null)
      expect(y._destroy).to.equal(true)
      didNotify = true
    })
    testObservableArray.destroy(y)
    expect(didNotify).to.equal(true)
  })

  it('Should notify "beforeChange" subscribers before marking items as destroyed', function () {
    const x: MyModel = { _destroy: null }
    const y: MyModel = { _destroy: null }
    let didNotify = false

    testObservableArray([x, y])
    testObservableArray.subscribe(
      function (/* value */) {
        expect(x._destroy).to.equal(null)
        expect(y._destroy).to.equal(null)
        didNotify = true
      },
      null,
      'beforeChange'
    )
    testObservableArray.destroy(y)
    expect(didNotify).to.equal(true)
  })

  it('Should be able to return first index of item', function () {
    testObservableArray(['Alpha', 'Beta', 'Gamma'])
    expect(testObservableArray.indexOf('Beta')).to.equal(1)
    expect(testObservableArray.indexOf('Gamma')).to.equal(2)
    expect(testObservableArray.indexOf('Alpha')).to.equal(0)
    expect(testObservableArray.indexOf('fake')).to.equal(-1)
  })

  it('Should return the correct myArray.length, and via myArray().length', function () {
    testObservableArray(['Alpha', 'Beta', 'Gamma'])
    expect(testObservableArray.length).to.equal(3)
    expect(testObservableArray().length).to.equal(3)
  })

  it('Should return the observableArray reference from "sort" and "reverse"', function () {
    expect(testObservableArray.reverse()).to.equal(testObservableArray)
    expect(testObservableArray.sort()).to.equal(testObservableArray)

    // Verify that reverse and sort notified their changes
    expect(notifiedValues).to.deep.equal([
      [3, 2, 1],
      [1, 2, 3]
    ])
  })

  it('Should return a new sorted array from "sorted"', function () {
    // set some unsorted values so we can see that the new array is sorted
    testObservableArray([5, 7, 3, 1])
    notifiedValues = new Array()

    const newArray = testObservableArray.sorted()
    expect(newArray).to.deep.equal([1, 3, 5, 7])
    expect(newArray).to.not.equal(testObservableArray())

    const newArray2 = testObservableArray.sorted((a, b) => b - a)
    expect(newArray2).to.deep.equal([7, 5, 3, 1])
    expect(newArray2).to.not.equal(testObservableArray())
    expect(newArray2).to.not.equal(newArray)

    expect(notifiedValues).to.deep.equal([])
  })

  it('Should return a new reversed array from "reversed"', function () {
    const newArray = testObservableArray.reversed()
    expect(newArray).to.deep.equal([3, 2, 1])
    expect(newArray).to.not.equal(testObservableArray())
    expect(notifiedValues).to.deep.equal([])
  })

  it('Should inherit any properties defined on subscribable.fn, observable.fn, or observableArray.fn', function () {
    subscribable.fn.subscribableProp = 'subscribable value'
    subscribable.fn.customProp = 'subscribable value - will be overridden'
    subscribable.fn.customFunc = function () {
      throw new Error("Shouldn't be reachable")
    }
    observable.fn.customProp = 'observable prop value - will be overridden'
    observable.fn.customFunc = function () {
      return this()
    }
    observableArray.fn.customProp = 'observableArray value'

    try {
      const instance = observableArray([123])
      expect(instance.subscribableProp).to.equal('subscribable value')
      expect(instance.customProp).to.equal('observableArray value')
      expect(instance.customFunc()).to.deep.equal([123])
    } finally {
      delete subscribable.fn.subscribableProp
      delete subscribable.fn.customProp
      delete subscribable.fn.customFunc
      delete observable.fn.customProp
      delete observable.fn.customFunc
      delete observableArray.fn.customProp
    }
  })

  it('Should have access to functions added to "fn" on existing instances on supported browsers', function () {
    if (!browserSupportsProtoAssignment) {
      return
    }

    const obsArr = observableArray()

    const customFunction1 = function () {}
    const customFunction2 = function () {}

    try {
      observable.fn.customFunction1 = customFunction1
      observableArray.fn.customFunction2 = customFunction2

      expect(obsArr.customFunction1).to.equal(customFunction1)
      expect(obsArr.customFunction2).to.equal(customFunction2)
    } finally {
      delete observable.fn.customFunction1
      delete observableArray.fn.customFunction2
    }
  })
})
