//
//  Observable values
//  ---
//
import {
  options, overwriteLengthPropertyIfSupported
} from '@tko/utils'

import type { ProtoProperty } from '@tko/utils/src/options'


import * as dependencyDetection from './dependencyDetection.js'
import { deferUpdates } from './defer.js'
import { subscribable, defaultEvent, LATEST_VALUE } from './subscribable.js'
import { valuesArePrimitiveAndEqual } from './extenders.js'
import { limit } from './limit'


function observableStatic<T> (initialValue: T): KnockoutObservable<T> {
  const Observable = (function (this: KnockoutObservable<T>): T | KnockoutObservable<T> {
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

export const observable = observableStatic as KnockoutObservableStatic
const protoProperty = observable.protoProperty = options.protoProperty as ProtoProperty

/**
 * Prototype for Observables
 */
const observableFn = {
  [protoProperty]: observable,
  equalityComparer: valuesArePrimitiveAndEqual,

  valueHasMutated<T> (this: KnockoutObservable<T>) {
    this.notifySubscribers(this[LATEST_VALUE], 'spectate')
    this.notifySubscribers(this[LATEST_VALUE])
  },

  valueWillMutate<T> (this: KnockoutObservable<T>) {
    this.notifySubscribers(this[LATEST_VALUE], 'beforeChange')
  },

  /**
   * Pass in and change the value of the observable.
   *
   * Example: to increment the value `o.modify(x => x++)`
   */
  modify<T> (this: KnockoutObservable<T>, fn: (value: T) => T, peek = true) {
    return this(fn(peek ? this.peek() : this()))
  },

  limit,

  // Some observables may not always be writeable, notably computeds.
  isWriteable: true
} as const

observable.fn = observableFn
Object.setPrototypeOf(observable.fn, subscribable.fn)

// Subclasses can add themselves to observableProperties so that
// isObservable will be `true`.
observable.observablePrototypes = new Set([observable])


export function isObservable<T> (
  instance: KnockoutObservable<T> | KnockoutObservableArray<T> | T,
): instance is KnockoutObservable<T> {
  const proto = typeof instance === 'function' && protoProperty in instance
  if (proto && !observable.observablePrototypes.has(proto)) {
    throw Error('Invalid object that looks like an observable; possibly from another Knockout instance')
  }
  return !!proto
}

export function unwrap<T> (value: KnockoutObservableArray<T>): T[]
export function unwrap<T> (value: KnockoutObservable<T>): T
export function unwrap<T> (value: T): T
export function unwrap<T> (value: any): T {
  return isObservable(value) ? value() : value
}

export function peek<T> (value: KnockoutObservableArray<T>): T[]
export function peek<T> (value: KnockoutObservable<T>): T
export function peek<T> (value: T): T
export function peek<T> (value: any): T {
  return isObservable(value) ? value.peek() : value
}

export function isWriteableObservable<T> (instance: KnockoutObservable<T>) {
  return isObservable(instance) && instance.isWriteable
}

export { isWriteableObservable as isWritableObservable }

/**
 * Note the Omit<> re. https://stackoverflow.com/questions/61427945
 * when this is used to extend KnockoutObservable<T>
 */
type ObservableFn = typeof observableFn


declare global {
  export interface KnockoutObservable<T> extends KnockoutSubscribable<T>, Omit<ObservableFn, keyof KnockoutObservable<T>> {
    /**
     * Unwrap the value, creating a dependency.
     */
    (): T

    /**
     * Set the value of the observable.
     */
    (value: T): void;

    modify (this: KnockoutObservable<T>, fn: (value: T) => T, peek: boolean): void
    valueHasMutated (this: KnockoutObservable<T>): void
    valueWillMutate (this: KnockoutObservable<T>): void

    [protoProperty]: typeof observable,

    /**
     * Some observables may not always be writeable, notably computeds.
     */
    isWriteable: boolean
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
    valueHasMutated: never
    valueWillMutate: never
  }

  export interface KnockoutObservableStatic {
    protoProperty: ProtoProperty
    observablePrototypes: Set<any>

    fn: ObservableFn

    <T>(value: T): KnockoutObservable<T>
    <T = any>(value: null): KnockoutObservable<T | null>
    <T = any>(): KnockoutObservable<T | undefined>
  }

  type MaybeObservable<T> = KnockoutObservable<T> | T
}
