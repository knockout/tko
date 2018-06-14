//
// Observable Arrays
// ===
//
import {
    arrayIndexOf, arrayForEach, overwriteLengthPropertyIfSupported
} from 'tko.utils'

import { observable, isObservable } from './observable.js'

import { trackArrayChanges } from './observableArray.changeTracking.js'

export function observableArray (initialValues) {
  initialValues = initialValues || []

  if (typeof initialValues !== 'object' || !('length' in initialValues)) { throw new Error('The argument passed when initializing an observable array must be an array, or null, or undefined.') }

  var result = observable(initialValues)
  Object.setPrototypeOf(result, observableArray.fn)
  trackArrayChanges(result)
        // ^== result.extend({ trackArrayChanges: true })
  overwriteLengthPropertyIfSupported(result, { get: () => result().length })
  return result
}

export function isObservableArray (instance) {
  return isObservable(instance) && typeof instance.remove === 'function' && typeof instance.push === 'function'
}

observableArray.fn = {
  remove (valueOrPredicate) {
    var underlyingArray = this.peek()
    var removedValues = []
    var predicate = typeof valueOrPredicate === 'function' && !isObservable(valueOrPredicate) ? valueOrPredicate : function (value) { return value === valueOrPredicate }
    for (var i = 0; i < underlyingArray.length; i++) {
      var value = underlyingArray[i]
      if (predicate(value)) {
        if (removedValues.length === 0) {
          this.valueWillMutate()
        }
        if (underlyingArray[i] !== value) {
          throw Error("Array modified during remove; cannot remove item")
        }
        removedValues.push(value)
        underlyingArray.splice(i, 1)
        i--
      }
    }
    if (removedValues.length) {
      this.valueHasMutated()
    }
    return removedValues
  },

  removeAll (arrayOfValues) {
        // If you passed zero args, we remove everything
    if (arrayOfValues === undefined) {
      var underlyingArray = this.peek()
      var allValues = underlyingArray.slice(0)
      this.valueWillMutate()
      underlyingArray.splice(0, underlyingArray.length)
      this.valueHasMutated()
      return allValues
    }
        // If you passed an arg, we interpret it as an array of entries to remove
    if (!arrayOfValues) {
      return []
    }
    return this['remove'](function (value) {
      return arrayIndexOf(arrayOfValues, value) >= 0
    })
  },

  destroy (valueOrPredicate) {
    var underlyingArray = this.peek()
    var predicate = typeof valueOrPredicate === 'function' && !isObservable(valueOrPredicate) ? valueOrPredicate : function (value) { return value === valueOrPredicate }
    this.valueWillMutate()
    for (var i = underlyingArray.length - 1; i >= 0; i--) {
      var value = underlyingArray[i]
      if (predicate(value)) {
        value['_destroy'] = true
      }
    }
    this.valueHasMutated()
  },

  destroyAll (arrayOfValues) {
        // If you passed zero args, we destroy everything
    if (arrayOfValues === undefined) { return this.destroy(function () { return true }) }

        // If you passed an arg, we interpret it as an array of entries to destroy
    if (!arrayOfValues) {
      return []
    }
    return this.destroy(function (value) {
      return arrayIndexOf(arrayOfValues, value) >= 0
    })
  },

  indexOf (item) {
    return arrayIndexOf(this(), item)
  },

  replace (oldItem, newItem) {
    var index = this.indexOf(oldItem)
    if (index >= 0) {
      this.valueWillMutate()
      this.peek()[index] = newItem
      this.valueHasMutated()
    }
  },

  sorted (compareFn) {
    return [...this()].sort(compareFn)
  },

  reversed () {
    return [...this()].reverse()
  },

  [Symbol.iterator]: function * () {
    yield * this()
  }
}

Object.setPrototypeOf(observableArray.fn, observable.fn)

// Populate ko.observableArray.fn with read/write functions from native arrays
// Important: Do not add any additional functions here that may reasonably be used to *read* data from the array
// because we'll eval them without causing subscriptions, so ko.computed output could end up getting stale
arrayForEach(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function (methodName) {
  observableArray.fn[methodName] = function () {
        // Use "peek" to avoid creating a subscription in any computed that we're executing in the context of
        // (for consistency with mutating regular observables)
    var underlyingArray = this.peek()
    this.valueWillMutate()
    this.cacheDiffForKnownOperation(underlyingArray, methodName, arguments)
    var methodCallResult = underlyingArray[methodName].apply(underlyingArray, arguments)
    this.valueHasMutated()
        // The native sort and reverse methods return a reference to the array, but it makes more sense to return the observable array instead.
    return methodCallResult === underlyingArray ? this : methodCallResult
  }
})

// Populate ko.observableArray.fn with read-only functions from native arrays
arrayForEach(['slice'], function (methodName) {
  observableArray.fn[methodName] = function () {
    var underlyingArray = this()
    return underlyingArray[methodName].apply(underlyingArray, arguments)
  }
})

// Expose for testing.
observableArray.trackArrayChanges = trackArrayChanges
