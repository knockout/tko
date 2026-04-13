/* eslint no-cond-assign: 0 */
import { arrayRemoveItem, objectForEach, options } from '@tko/utils'

import Subscription from './Subscription'
import { SUBSCRIBABLE_SYM } from './subscribableSymbol'
import { applyExtenders } from './extenders'
import * as dependencyDetection from './dependencyDetection'
export { isSubscribable } from './subscribableSymbol'

// Descendants may have a LATEST_VALUE, which if present
// causes TC39 subscriptions to emit the latest value when
// subscribed.
export const LATEST_VALUE = Symbol('Knockout latest value')

if (!Symbol.observable) {
  Symbol.observable = Symbol.for('@tko/Symbol.observable')
}

export type SubscriptionCallback<T = any, TTarget = void> = (this: TTarget, val: T) => void
export type MaybeSubscribable<T = any> = T | Subscribable<T>

// Some types remain here because refactoring leads to invasive changes.
// Change prototype-chains of the TKO base classes to js/ts classes can be later steps.
export interface SubscribableFunctions<T = any> {
  [symbol: symbol]: boolean
  init(instance: any): void

  notifySubscribers(valueToWrite?: T, event?: string): void

  subscribe<TTarget = void>(
    callback: SubscriptionCallback<T, TTarget> | any,
    callbackTarget?: TTarget,
    event?: string
  ): Subscription
  extend(requestedExtenders: any): this
  extend<S extends Subscribable<T>>(requestedExtenders: any): S

  getSubscriptionsCount(event?: string): number
  getVersion(): number
  hasChanged(versionToCheck: number): boolean
  updateVersion(): void
  hasSubscriptionsForEvent(event: string): boolean
  isDifferent<T>(oldValue?: T, newValue?: T): boolean
  once(cb: Function): void
  when(test, returnValue?)
  yet(test: Function | any, args: any[]): void
  next(): Promise<unknown>
  toString(): string

  // From pureComputedOverrides in computed.ts
  beforeSubscriptionAdd?: (event: string) => void
  afterSubscriptionRemove?: (event: string) => void
}

export interface Subscribable<T = any> extends SubscribableFunctions<T> {
  _subscriptions: any
  _versionNumber: number
  _id: number
}

// This interface is for the JS-Factory-Method 'subscribable' to returns a typed Subscribable
export interface subscribable {
  new <T = any>(): Subscribable<T>
  fn: SubscribableFunctions
}

// https://stackoverflow.com/questions/75658736/is-there-any-way-to-create-object-using-function-in-typescript-like-javascript
// TODO need help for refactoring to typescript-class without breaking the api
export const subscribable = function subscribableFactory() {
  Object.setPrototypeOf(this, ko_subscribable_fn)
  ko_subscribable_fn.init(this)
} as unknown as subscribable

export const defaultEvent = 'change'

const ko_subscribable_fn: SubscribableFunctions = {
  [SUBSCRIBABLE_SYM]: true,
  [Symbol.observable as any]() {
    return this
  },

  init(instance) {
    instance._subscriptions = { change: [] }
    instance._versionNumber = 1
  },

  subscribe(callback, callbackTarget, event): Subscription {
    // TC39 proposed standard Observable { next: () => ... }
    const isTC39Callback = typeof callback === 'object' && (callback as any).next

    event = event || defaultEvent
    const observer = isTC39Callback ? callback : { next: callbackTarget ? callback.bind(callbackTarget) : callback }

    const subscriptionInstance = new Subscription(this, observer, () => {
      arrayRemoveItem(this._subscriptions[event], subscriptionInstance)
      if (this.afterSubscriptionRemove) {
        this.afterSubscriptionRemove(event)
      }
    })

    if (this.beforeSubscriptionAdd) {
      this.beforeSubscriptionAdd(event)
    }

    if (!this._subscriptions[event]) {
      this._subscriptions[event] = new Array()
    }
    this._subscriptions[event].push(subscriptionInstance)

    // Have TC39 `subscribe` immediately emit.
    // https://github.com/tc39/proposal-observable/issues/190

    if (isTC39Callback && LATEST_VALUE in this) {
      observer.next(this[LATEST_VALUE])
    }

    return subscriptionInstance
  },

  notifySubscribers(valueToNotify, event) {
    event = event || defaultEvent
    if (event === defaultEvent) {
      this.updateVersion()
    }
    if (this.hasSubscriptionsForEvent(event)) {
      const subs = (event === defaultEvent && this._changeSubscriptions) || [...this._subscriptions[event]]

      try {
        dependencyDetection.begin() // Begin suppressing dependency detection (by setting the top frame to undefined)
        for (let i = 0, subscriptionInstance; (subscriptionInstance = subs[i]); ++i) {
          // In case a subscription was disposed during the arrayForEach cycle, check
          // for isDisposed on each subscription before invoking its callback
          if (!subscriptionInstance._isDisposed) {
            subscriptionInstance._callback(valueToNotify)
          }
        }
      } finally {
        dependencyDetection.end() // End suppressing dependency detection
      }
    }
  },

  getVersion(): number {
    return this._versionNumber
  },

  hasChanged(versionToCheck): boolean {
    return this.getVersion() !== versionToCheck
  },

  updateVersion() {
    ++this._versionNumber
  },

  hasSubscriptionsForEvent(event): boolean {
    return this._subscriptions[event] && this._subscriptions[event].length
  },

  getSubscriptionsCount(event?: string): number {
    if (event) {
      return (this._subscriptions[event] && this._subscriptions[event].length) || 0
    } else {
      let total = 0
      objectForEach(this._subscriptions, function (eventName, subscriptions) {
        if (eventName !== 'dirty') {
          total += subscriptions.length
        }
      })
      return total
    }
  },

  isDifferent(oldValue, newValue): boolean {
    return !this.equalityComparer || !this.equalityComparer(oldValue, newValue)
  },

  once(cb) {
    const subs = this.subscribe(nv => {
      subs.dispose()
      cb(nv)
    })
  },

  when(test: any, returnValue: unknown) {
    const current = this.peek()
    const givenRv = arguments.length > 1
    const testFn = typeof test === 'function' ? test : v => v === test
    if (testFn(current)) {
      return options.Promise.resolve(givenRv ? returnValue : current)
    }
    return new options.Promise((resolve, reject) => {
      const subs = this.subscribe(newValue => {
        if (testFn(newValue)) {
          subs.dispose()
          resolve(givenRv ? returnValue : newValue)
        }
      })
    })
  },

  yet(test, ...args) {
    const testFn = typeof test === 'function' ? test : v => v === test
    const negated = v => !testFn(v)
    return this.when(negated, ...args)
  },

  next() {
    return new Promise(resolve => this.once(resolve))
  },

  toString(): string {
    return '[object Object]'
  },

  extend: applyExtenders
}

// For browsers that support proto assignment, we overwrite the prototype of each
// observable instance. Since observables are functions, we need Function.prototype
// to still be in the prototype chain.
Object.setPrototypeOf(ko_subscribable_fn, Function.prototype)

subscribable.fn = ko_subscribable_fn
