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

//#region Observable

export type MaybeObservable<T = any> = T | Observable<T>;

export interface ObservableFunctions<T = any> extends Subscribable<T> {
  equalityComparer(a: T, b: T): boolean;
  peek(): T;
  valueHasMutated(): void;
  valueWillMutate(): void;

  modify(fn, peek? : Boolean): Observable
}

export interface Observable<T = any> extends ObservableFunctions<T> {
  subprop?: string; // for some test
  [symbol: symbol]: any;
  (): T;
  (value: T): any;
}

//#endregion Observable  

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

// Define prototype for observables
observable.fn = {
  equalityComparer: valuesArePrimitiveAndEqual,
  peek() { return this[LATEST_VALUE] },
  valueHasMutated() {
    this.notifySubscribers(this[LATEST_VALUE], 'spectate')
    this.notifySubscribers(this[LATEST_VALUE])
  },
  valueWillMutate() {
    this.notifySubscribers(this[LATEST_VALUE], 'beforeChange')
  },

  modify(fn, peek = true) {
    return this(fn(peek ? this.peek() : this()))
  },

  // Some observables may not always be writeable, notably computeds.
  isWriteable: true
}

// Moved out of "limit" to avoid the extra closure
function limitNotifySubscribers(value, event?: string) {
  if (!event || event === defaultEvent) {
    this._limitChange(value)
  } else if (event === 'beforeChange') {
    this._limitBeforeChange(value)
  } else {
    this._origNotifySubscribers(value, event)
  }
}

// Add `limit` function to the subscribable prototype
(subscribable.fn as any).limit = function limit(limitFunction) {
  var self = this
  var selfIsObservable = isObservable(self)
  var beforeChange = 'beforeChange'
  var ignoreBeforeChange: boolean, notifyNextChange: boolean, previousValue: any, pendingValue: any, didUpdate: boolean

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

export function isObservable<T = any>(instance: any): instance is Observable<T> {
  const proto = typeof instance === 'function' && instance[protoProperty]
  if (proto && !observable.observablePrototypes.has(proto)) {
    throw Error('Invalid object that looks like an observable; possibly from another Knockout instance')
  }
  return !!proto
}

export function unwrap(value) {
  return isObservable(value) ? value() : value
}

export function peek<T = any>(value: MaybeSubscribable<T>): T {
  return isObservable(value) ? value.peek() : value
}

export function isWriteableObservable<T = any>(instance: any): instance is Observable<T> {
  return isObservable(instance) && (instance as any).isWriteable
}

export { isWriteableObservable as isWritableObservable }
