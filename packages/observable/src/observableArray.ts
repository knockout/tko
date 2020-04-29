//
// Observable Arrays
// ===
//
import {
    arrayIndexOf, overwriteLengthPropertyIfSupported
} from '@tko/utils'

import { observable, isObservable } from './observable.js'

import { trackArrayChanges } from './observableArray.changeTracking.js'

export function observableArray<T> (initialValues?: T[] | null) {
  initialValues = initialValues || []

  if (typeof initialValues !== 'object' || !('length' in initialValues)) { throw new Error('The argument passed when initializing an observable array must be an array, or null, or undefined.') }

  const result = observable(initialValues) as KnockoutObservableArray<T>
  Object.setPrototypeOf(result, observableArray.fn)
  trackArrayChanges(result)
        // ^== result.extend({ trackArrayChanges: true })
  overwriteLengthPropertyIfSupported(result, { get: () => result().length })
  return result
}

export function isObservableArray<T> (instance: any): instance is KnockoutObservableArray<T> {
  return isObservable(instance) && typeof instance.remove === 'function' && typeof instance.push === 'function'
}


type ValueOrPredicate<T> = T | (value: T) => boolean

observableArray.fn = {
  remove<T> (this: KnockoutObservableArray<T>, valueOrPredicate: ValueOrPredicate<T>) {
    var underlyingArray = this.peek()
    var removedValues = []
    var predicate = typeof valueOrPredicate === 'function' && !isObservable(valueOrPredicate)
      ? valueOrPredicate
      : (value: T) => value === valueOrPredicate

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

  removeAll<T> (this: KnockoutObservableArray<T>, arrayOfValues: T[]) {
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
    if (!arrayOfValues) { return [] }

    return this.remove(function (value) {
      return arrayIndexOf(arrayOfValues, value) >= 0
    })
  },

  destroy<T> (this: KnockoutObservableArray<T>, valueOrPredicate: ValueOrPredicate<T>) {
    var underlyingArray = this.peek()
    var predicate = typeof valueOrPredicate === 'function' && !isObservable(valueOrPredicate)
      ? valueOrPredicate
      : (value: T) => value === valueOrPredicate

    this.valueWillMutate()
    for (var i = underlyingArray.length - 1; i >= 0; i--) {
      var value = underlyingArray[i]
      if (predicate(value)) {
        (value as any)['_destroy'] = true
      }
    }
    this.valueHasMutated()
  },

  destroyAll<T> (this: KnockoutObservableArray<T>, arrayOfValues: T[]) {
    // If you passed zero args, we destroy everything
    if (arrayOfValues === undefined) {
      return this.destroy(function () { return true })
    }

    // If you passed an arg, we interpret it as an array of entries to destroy
    if (!arrayOfValues) { return [] }

    return this.destroy(function (value) {
      return arrayIndexOf(arrayOfValues, value) >= 0
    })
  },

  indexOf<T> (this: KnockoutObservableArray<T>, item: number) {
    return arrayIndexOf(this(), item)
  },

  replace<T> (this: KnockoutObservableArray<T>, oldItem: T, newItem: T) {
    var index = this.indexOf(oldItem)
    if (index >= 0) {
      this.valueWillMutate()
      this.peek()[index] = newItem
      this.valueHasMutated()
    }
  },

  sorted<T> (this: KnockoutObservableArray<T>, compareFn: Parameters<Array<T>['sort']>[0]) {
    return [...this()].sort(compareFn)
  },

  reversed<T> (this: KnockoutObservableArray<T>) {
    return [...this()].reverse()
  },

  * [Symbol.iterator]<T> (this: KnockoutObservableArray<T>) {
    yield * this()
  }
}

Object.setPrototypeOf(observableArray.fn, observable.fn)

// Populate ko.observableArray.fn with read/write functions from native arrays
// Important: Do not add any additional write-functions here that may reasonably be used to *read* data from the array
// because we'll eval them without causing subscriptions, so ko.computed output could end up getting stale
const writeFunctions = [
  'copyWithin', 'fill', 'pop', 'push', 'reverse', 'shift', 'sort', 'splice',
  'unshift',
] as const

const readFunctions = ['forEach', 'splice'] as const


const proxyMethods = {} as Record<string, (...args: any) => any>
for (const methodName of writeFunctions) {
  proxyMethods[methodName] = function<T> (this: KnockoutObservableArray<T>, ...args: any[]) {
    // Use "peek" to avoid creating a subscription in any computed that we're executing in the context of
    // (for consistency with mutating regular observables)
    const underlyingArray = this.peek()
    this.valueWillMutate()
    this.cacheDiffForKnownOperation(underlyingArray, methodName, arguments)
    const method = underlyingArray[methodName] as any
    const methodCallResult = method.apply(underlyingArray, ...args)
    this.valueHasMutated()
    // The native sort and reverse methods return a reference to the array, but it makes more sense to return the observable array instead.
    return methodCallResult === underlyingArray ? this : methodCallResult
  }
}

// Populate ko.observableArray.fn with read-only functions from native arrays
for (const methodName of readFunctions) {
  proxyMethods[methodName] = function<T> (this: KnockoutObservableArray<T>, ...args: any[]) {
    const underlyingArray = this()
    const method = underlyingArray[methodName] as any
    return method.apply(underlyingArray, ...args)
  }
}

Object.assign(observableArray.fn, proxyMethods)
observableArray.trackArrayChanges = trackArrayChanges

type ProxyMethodType = typeof writeFunctions[number] | typeof readFunctions[number]
type ArrayProxyMethods = { readonly [P in ProxyMethodType]: Array<any>[P] }
type ObservableArrayFn = typeof observableArray.fn


declare global {
  export interface KnockoutObservableArray<T> extends KnockoutObservable<T> {
    /**
     * Returns the index of the first occurrence of a value in an  array.
     * @param searchElement The value to locate in the array.
     * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
     */
    indexOf(searchElement: T, fromIndex?: number): number;
    /**
     * Returns a section of an array.
     * @param start The beginning of the specified portion of the array.
     * @param end The end of the specified portion of the array.
     */
    slice(start: number, end?: number): T[]

    /**
     * Removes and returns all the remaining elements starting from a given index.
     * @param start The zero-based location in the array from which to start removing elements.
     */
    splice(start: number): T[];
    /**
     * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
     * @param start The zero-based location in the array from which to start removing elements.
     * @param deleteCount The number of elements to remove.
     * @param items Elements to insert into the array in place of the deleted elements.
     */
    splice(start: number, deleteCount: number, ...items: T[]): T[];
    /**
     * Removes the last value from the array and returns it.
     */
    pop(): T;
    /**
     * Adds new item or items to the end of array.
     * @param items Items  to be added.
     */
    push(...items: T[]): void;
    /**
     * Removes the first value from the array and returns it.
     */
    shift(): T;
    /**
     * Inserts new item or items at the beginning of the array.
     * @param items Items to be added.
     */
    unshift(...items: T[]): number;
    /**
     * Reverses the order of the array and returns the observableArray (not the underlying array).
     */
    reverse(): KnockoutObservableArray<T>;
    /**
     * Sorts the array contents and returns the observableArray.
     */
    sort(): KnockoutObservableArray<T>;
    /**
     * Sorts the array contents and returns the observableArray.
     * @param compareFunction A function that returns negative value if first argument is smaller, positive value if second is smaller, or zero to treat them as equal.
     */
    sort(compareFunction: (left: T, right: T) => number): KnockoutObservableArray<T>;

    // Ko specific
    /**
     * Replaces the first value that equals oldItem with newItem.
     * @param oldItem Item to be replaced.
     * @param newItem Replacing item.
     */
    replace(oldItem: T, newItem: T): void;
    /**
     * Removes all values that equal item and returns them as an array.
     * @param item The item to be removed.
     */
    remove(item: T): T[];
    /**
     * Removes all values and returns them as an array.
     * @param removeFunction A function used to determine true if item should be removed and fasle otherwise.
     */
    remove(removeFunction: (item: T) => boolean): T[];
    /**
     * Removes all values that equal any of the supplied items.
     * @param items Items to be removed.
     */
    removeAll(items: T[]): T[];
    /**
     * Removes all values and returns them as an array.
     */
    removeAll(): T[];

    // Ko specific Usually relevant to Ruby on Rails developers only
    /**
     * Finds any objects in the array that equal someItem and gives them a special property called _destroy with value true.
     * @param item Items to be marked with the property.
     */
    destroy(item: T): void;
    /**
     * Finds any objects in the array filtered by a function and gives them a special property called _destroy with value true.
     * @param destroyFunction A function used to determine which items should be marked with the property.
     */
    destroy(destroyFunction: (item: T) => boolean): void;
    /**
     * Finds any objects in the array that equal suplied items and gives them a special property called _destroy with value true.
     * @param items
     */
    destroyAll(items: T[]): void;
    /**
     * Gives a special property called _destroy with value true to all objects in the array.
     */
    destroyAll(): void;
  }

  interface KnockoutReadonlyObservableArrayFunctions<T> extends KnockoutReadonlyObservable<T>, Omit<KnockoutObservableArray<T>, keyof KnockoutReadonlyObservable<T>> {
    splice: never
    shift: never
    unshift: never
    push: never
    pop: never
    sort: never
    remove: never
    removeAll: never
    destroy: never
    destroyAll: never
  }


  interface KnockoutObservableArrayFunctions extends ObservableArrayFn, ArrayProxyMethods { }

  interface KnockoutObservableArrayStatic {
    fn: KnockoutObservableArrayFunctions

    <T>(value?: T[] | null): KnockoutObservableArray<T>
  }

  type MaybeObservableArray<T> = KnockoutObservableArray<T> | T
}

