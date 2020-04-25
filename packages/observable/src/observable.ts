//
//  Observable values
//  ---
//
import {
  options, overwriteLengthPropertyIfSupported
} from '@tko/utils'

import * as dependencyDetection from './dependencyDetection.js'
import { deferUpdates } from './defer.js'
import { subscribable, defaultEvent, LATEST_VALUE } from './subscribable.js'
import { valuesArePrimitiveAndEqual } from './extenders.js'


export function observable<T> (initialValue: T): KnockoutObservable<T> {
  const Observable = (function (): T | KnockoutObservable<T> {
    if (arguments.length > 0) {
            // Write
            // Ignore writes if the value hasn't changed
      if (Observable.isDifferent(Observable[LATEST_VALUE], arguments[0])) {
        Observable.valueWillMutate()
        Observable[LATEST_VALUE] = arguments[0]
        Observable.valueHasMutated()
      }
      return this // Permits chained assignments
    } else {
            // Read
      dependencyDetection.registerDependency(Observable) // The caller only needs to be notified of changes if they did a "read" operation
      return Observable[LATEST_VALUE]
    }
  }) as KnockoutObservable<T>

  overwriteLengthPropertyIfSupported(Observable, { value: undefined })

  Observable[LATEST_VALUE] = initialValue

  subscribable.fn.init(Observable)

    // Inherit from 'observable'
  Object.setPrototypeOf(Observable, observable.fn)

  if (options.deferUpdates) {
    deferUpdates(Observable)
  }

  return Observable
}

/**
 * Prototype for Observables
 */
observable.fn = {
  equalityComparer: valuesArePrimitiveAndEqual,

  valueHasMutated (this: KnockoutObservable<T>) {
    this.notifySubscribers(this[LATEST_VALUE], 'spectate')
    this.notifySubscribers(this[LATEST_VALUE])
  },

  valueWillMutate (this: KnockoutObservable<T>) {
    this.notifySubscribers(this[LATEST_VALUE], 'beforeChange')
  },

  /**
   * Pass in and change the value of the observable.
   *
   * Example: to increment the value `o.modify(x => x++)`
   */
  modify (this: KnockoutObservable<T>, fn: (value: T) => T, peek = true) {
    return this(fn(peek ? this.peek() : this()))
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

const protoProperty = observable.protoProperty = options.protoProperty
observable.fn[protoProperty] = observable

// Subclasses can add themselves to observableProperties so that
// isObservable will be `true`.
observable.observablePrototypes = new Set([observable])

export function isObservable<T> (instance: T) {
  const proto = typeof instance === 'function' && instance[protoProperty]
  if (proto && !observable.observablePrototypes.has(proto)) {
    throw Error('Invalid object that looks like an observable; possibly from another Knockout instance')
  }
  return !!proto
}

export function unwrap<T> (value: KnockoutSubscribable<T>) {
  return isObservable(value) ? value() : value
}

export function peek<T> (value: KnockoutSubscribable<T>) {
  return isObservable(value) ? value.peek() : value
}

export function isWriteableObservable<T> (instance: KnockoutObservable<T>) {
  return isObservable(instance) && instance.isWriteable
}

export { isWriteableObservable as isWritableObservable }


type ObservableFn = typeof observable.fn


declare global {
  export interface KnockoutObservable<T> extends KnockoutSubscribable<T>, ObservableFn {
    /**
     * Unwrap the value, creating a dependency.
     */
    (): T

    /**
     * Set the value of the observable.
     */
    (value: T): void;
  }

  /**
   * While all observable are writable at runtime, this type is analogous to the native ReadonlyArray type:
   * casting an observable to this type expresses the intention that this observable shouldn't be mutated.
   */
  export interface KnockoutReadonlyObservable<T> extends KnockoutObservable<T> {
    (): void
    /**
     * This observable has been given a read-only type.
     */
    (value: never): void
    extend: never
    modify: never
  }

  export interface KnockoutObservableStatic {
    fn: ObservableFn

    <T>(value: T): KnockoutObservable<T>
    <T = any>(value: null): KnockoutObservable<T | null>
    <T = any>(): KnockoutObservable<T | undefined>
  }
}
