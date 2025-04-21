//
//  Observable values
//  ---
//
import {
  options, overwriteLengthPropertyIfSupported
} from '@tko/utils'

import * as dependencyDetection from './dependencyDetection'
import { deferUpdates } from './defer'
import { subscribable, defaultEvent, LATEST_VALUE } from './subscribable'
import { valuesArePrimitiveAndEqual } from './extenders'
import type { Subscribable, MaybeSubscribable } from './subscribable'

//#region Observable

/**
 * Represents a value that can be either a plain value or an observable.
 */
export type MaybeObservable<T = any> = T | Observable<T>;

/**
 * Defines the functions available on an observable.
 */
export interface ObservableFunctions<T = any> extends Subscribable<T> {
  /**
   * Compares two values for equality.
   * @param a The first value.
   * @param b The second value.
   * @returns True if the values are equal, otherwise false.
   */
  equalityComparer(a: T, b: T): boolean;

  /**
   * Returns the current value of the observable without creating a dependency.
   * @returns The current value.
   */
  peek(): T;

  /**
   * Notifies subscribers that the value has changed.
   */
  valueHasMutated(): void;

  /**
   * Notifies subscribers that the value is about to change.
   */
  valueWillMutate(): void;

  /**
   * Modifies the value of the observable using a function.
   * @param fn The function to modify the value.
   * @param peek Whether to use the current value without creating a dependency.
   * @returns The modified observable.
   */
  modify(fn, peek? : Boolean): Observable

  /**
   * Some observables may not always be writeable, notably computeds.
   */
  isWriteable: boolean
}

/**
 * Represents an observable value.
 */
export interface Observable<T = any> extends ObservableFunctions<T> {
  /**
   * The latest value of the observable.
   */
  [LATEST_VALUE]: any;

  /**
   * Gets the current value of the observable.
   * @returns The current value.
   */
  (): T;

  /**
   * Sets the value of the observable.
   * @param value The new value.
   * @returns The observable.
   */
  (value: T): any;
}

//#endregion Observable  

/**
 * Creates an observable object.
 * @param initialValue The initial value of the observable.
 * @returns The observable object.
 */
export function observable(initialValue?: any): Observable {
  function Observable() {
    if (arguments.length > 0) {
      // Write
      // Ignore writes if the value hasn't changed
      // inherits from interface SubscribableFunctions
      if ((Observable as any).isDifferent(Observable[LATEST_VALUE], arguments[0])) {
        (Observable as any).valueWillMutate();
        Observable[LATEST_VALUE] = arguments[0];
        (Observable as any).valueHasMutated();
      }
      return this // Permits chained assignments
    } else {
      // Read
      dependencyDetection.registerDependency(Observable) // The caller only needs to be notified of changes if they did a "read" operation
      return Observable[LATEST_VALUE]
    }
  }

  overwriteLengthPropertyIfSupported(Observable as any, { value: undefined })

  Observable[LATEST_VALUE] = initialValue

  subscribable.fn.init(Observable)

  // Inherit from 'observable'
  Object.setPrototypeOf(Observable, observable.fn)

  if (options.deferUpdates) {
    deferUpdates(Observable)
  }

  // through setPrototypeOf we can cast to Observable
  return Observable as unknown as Observable
}

/**
 * Defines prototype for observables.
 */
observable.fn = {
  /**
   * Compares two values for equality.
   * @param a The first value.
   * @param b The second value.
   * @returns True if the values are equal, otherwise false.
   */
  equalityComparer: valuesArePrimitiveAndEqual,

  /**
   * Returns the current value of the observable without creating a dependency.
   * @returns The current value.
   */
  peek() { return this[LATEST_VALUE] },

  /**
   * Notifies subscribers that the value has changed.
   */
  valueHasMutated() {
    this.notifySubscribers(this[LATEST_VALUE], 'spectate')
    this.notifySubscribers(this[LATEST_VALUE])
  },

  /**
   * Notifies subscribers that the value is about to change.
   */
  valueWillMutate() {
    this.notifySubscribers(this[LATEST_VALUE], 'beforeChange')
  },

  /**
   * Modifies the value of the observable using a function.
   * @param fn The function to modify the value.
   * @param peek Whether to use the current value without creating a dependency.
   * @returns The modified observable.
   */
  modify(fn, peek = true) {
    return this(fn(peek ? this.peek() : this()))
  },

  // Some observables may not always be writeable, notably computeds.
  isWriteable: true
}

/**
 * Limits the notifications to subscribers.
 * @param value The value to notify.
 * @param event The event type.
 */
function limitNotifySubscribers(value, event?: string) {
  if (!event || event === defaultEvent) {
    this._limitChange(value)
  } else if (event === 'beforeChange') {
    this._limitBeforeChange(value)
  } else {
    this._origNotifySubscribers(value, event)
  }
}

/**
 * Adds a limit function to the subscribable prototype.
 * @param limitFunction The function to limit notifications.
 */
(subscribable.fn as any).limit = function limit(limitFunction) {
  var self = this
  var selfIsObservable = isObservable(self)
  var beforeChange = 'beforeChange'
  var ignoreBeforeChange: boolean, notifyNextChange: boolean, previousValue: any, pendingValue: any, didUpdate: boolean

  if (!self._origNotifySubscribers) {
    // Moved out of "limit" to avoid the extra closure
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
    _limitChange(value: any, isDirty: boolean) {
      if (!isDirty || !self._notificationIsPending) {
        didUpdate = !isDirty
      }
      self._changeSubscriptions = [...self._subscriptions[defaultEvent]]
      self._notificationIsPending = ignoreBeforeChange = true
      pendingValue = value
      finish()
    },

    _limitBeforeChange(value: any) {
      if (!ignoreBeforeChange) {
        previousValue = value
        self._origNotifySubscribers(value, beforeChange)
      }
    },

    _notifyNextChangeIfValueIsDifferent() {
      if (self.isDifferent(previousValue, self.peek(true /* evaluate */))) {
        notifyNextChange = true
      }
    },

    _recordUpdate() {
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

/**
 * Checks if an instance is an observable.
 * @param instance The instance to check.
 * @returns True if the instance is an observable, otherwise false.
 */
export function isObservable<T = any>(instance: any): instance is Observable<T> {
  const proto = typeof instance === 'function' && instance[protoProperty]
  if (proto && !observable.observablePrototypes.has(proto)) {
    throw Error('Invalid object that looks like an observable; possibly from another Knockout instance')
  }
  return !!proto
}

/**
 * Unwraps the value if it is an observable.
 * @param value The value to unwrap.
 * @returns The unwrapped value.
 */
export function unwrap(value) {
  return isObservable(value) ? value() : value
}

/**
 * Peeks at the value of a MaybeSubscribable without creating a dependency.
 * @param value The value to peek at.
 * @returns The peeked value.
 */
export function peek<T = any>(value: MaybeSubscribable<T>): T {
  return isObservable(value) ? value.peek() : value as T
}

/**
 * Checks if an instance is a writeable observable.
 * @param instance The instance to check.
 * @returns True if the instance is a writeable observable, otherwise false.
 */
export function isWriteableObservable<T = any>(instance: any): instance is Observable<T> {
  return isObservable(instance) && instance.isWriteable
}

export { isWriteableObservable as isWritableObservable }
