//
//  Observable values
//  ---
//
import {
    createSymbolOrString, options, overwriteLengthPropertyIfSupported
} from 'tko.utils'

import * as dependencyDetection from './dependencyDetection.js'
import { deferUpdates } from './defer.js'
import { subscribable, defaultEvent } from './subscribable.js'
import { valuesArePrimitiveAndEqual } from './extenders.js'

var observableLatestValue = createSymbolOrString('_latestValue')

export function observable (initialValue) {
  function Observable () {
    if (arguments.length > 0) {
            // Write
            // Ignore writes if the value hasn't changed
      if (Observable.isDifferent(Observable[observableLatestValue], arguments[0])) {
        Observable.valueWillMutate()
        Observable[observableLatestValue] = arguments[0]
        Observable.valueHasMutated()
      }
      return this // Permits chained assignments
    } else {
            // Read
      dependencyDetection.registerDependency(Observable) // The caller only needs to be notified of changes if they did a "read" operation
      return Observable[observableLatestValue]
    }
  }

  overwriteLengthPropertyIfSupported(Observable, { value: undefined })

  Observable[observableLatestValue] = initialValue

  subscribable.fn.init(Observable)

    // Inherit from 'observable'
  Object.setPrototypeOf(Observable, observable.fn)

  if (options.deferUpdates) {
    deferUpdates(Observable)
  }

  return Observable
}

// Define prototype for observables
observable.fn = {
  equalityComparer: valuesArePrimitiveAndEqual,
  peek () { return this[observableLatestValue] },
  valueHasMutated () {
    this.notifySubscribers(this[observableLatestValue], 'spectate')
    this.notifySubscribers(this[observableLatestValue])
  },
  valueWillMutate () {
    this.notifySubscribers(this[observableLatestValue], 'beforeChange')
  },

  // Some observables may not always be writeable, notably computeds.
  isWriteable: true
}

// Moved out of "limit" to avoid the extra closure
function limitNotifySubscribers (value, event) {
  if (!event || event === defaultEvent) {
    this._limitChange(value)
  } else if (event === 'beforeChange') {
    this._limitBeforeChange(value)
  } else {
    this._origNotifySubscribers(value, event)
  }
}

// Add `limit` function to the subscribable prototype
subscribable.fn.limit = function limit (limitFunction) {
  var self = this
  var selfIsObservable = isObservable(self)
  var beforeChange = 'beforeChange'
  var ignoreBeforeChange, notifyNextChange, previousValue, pendingValue, didUpdate

  if (!self._origNotifySubscribers) {
    self._origNotifySubscribers = self.notifySubscribers
    self.notifySubscribers = limitNotifySubscribers
  }

  var finish = limitFunction(function () {
    self._notificationIsPending = false

    // If an observable provided a reference to itself, access it to get the latest value.
    // This allows computed observables to delay calculating their value until needed.
    if (selfIsObservable && pendingValue === self) {
      pendingValue = self._evalIfChanged ? self._evalIfChanged() : self()
    }
    const shouldNotify = notifyNextChange || (
      didUpdate && self.isDifferent(previousValue, pendingValue)
    )
    self._notifyNextChange = didUpdate = ignoreBeforeChange = false
    if (shouldNotify) {
      self._origNotifySubscribers(previousValue = pendingValue)
    }
  })

  Object.assign(self, {
    _limitChange  (value, isDirty) {
      if (!isDirty || !self._notificationIsPending) {
        didUpdate = !isDirty
      }
      self._changeSubscriptions = [...self._subscriptions[defaultEvent]]
      self._notificationIsPending = ignoreBeforeChange = true
      pendingValue = value
      finish()
    },

    _limitBeforeChange (value) {
      if (!ignoreBeforeChange) {
        previousValue = value
        self._origNotifySubscribers(value, beforeChange)
      }
    },

    _notifyNextChangeIfValueIsDifferent () {
      if (self.isDifferent(previousValue, self.peek(true /* evaluate */))) {
        notifyNextChange = true
      }
    },

    _recordUpdate () {
      didUpdate = true
    }
  })
}

Object.setPrototypeOf(observable.fn, subscribable.fn)

var protoProperty = observable.protoProperty = options.protoProperty
observable.fn[protoProperty] = observable

// Subclasses can add themselves to observableProperties so that
// isObservable will be `true`.
observable.observablePrototypes = new Set([observable])

export function isObservable (instance) {
  const proto = typeof instance === 'function' && instance[protoProperty]
  if (proto && !observable.observablePrototypes.has(proto)) {
    throw Error('Invalid object that looks like an observable; possibly from another Knockout instance')
  }
  return !!proto
}

export function unwrap (value) {
  return isObservable(value) ? value() : value
}

export function peek (value) {
  return isObservable(value) ? value.peek() : value
}

export function isWriteableObservable (instance) {
  return isObservable(instance) && instance.isWriteable
}

export { isWriteableObservable as isWritableObservable }
