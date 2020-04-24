/* eslint no-cond-assign: 0 */
import {
    arrayRemoveItem, objectForEach, options
} from '@tko/utils'

import Subscription from './Subscription'
import { SUBSCRIBABLE_SYM } from './subscribableSymbol'
import { applyExtenders } from './extenders.js'
import * as dependencyDetection from './dependencyDetection.js'
export { isSubscribable } from './subscribableSymbol'

// Descendants may have a LATEST_VALUE, which if present
// causes TC39 subscriptions to emit the latest value when
// subscribed.
export const LATEST_VALUE = Symbol('Knockout latest value')

type Predicate<T> = (v: T) => boolean

/**
 * Extend this interface to add more event types, e.g.
 * `arrayChange`.
 */
interface KnockoutEventTypeInterface {
  change: true,
  beforeChange: true,
}

type KnockoutEventType = keyof KnockoutEventTypeInterface


interface KnockoutSubscribableFunctions<T> {
  /**
   * Notify subscribers of knockout "change" event. This doesn't actually change the observable value.
   * @param eventValue A value to be sent with the event.
   * @param event The knockout event.
   */
  notifySubscribers(eventValue?: T, event?: "change"): void;
  /**
   * Notify subscribers of a knockout or user defined event.
   * @param eventValue A value to be sent with the event.
   * @param event The knockout or user defined event name.
   */
  notifySubscribers<U>(eventValue: U, event: KnockoutEventType): void;
}


interface KnockoutSubscription {
  /**
   * Terminates a subscription.
   */
  dispose(): void;
}


interface KnockoutSubscribable<T> extends KnockoutSubscribableFunctions<T> {
  _subscriptions: Record<KnockoutEventType, KnockoutSubscription[]>
  _versionNumber: number

  /**
   * Used by Observable limit function.
   */
  _changeSubscriptions?: KnockoutSubscription[]

  /**
   * Registers to be notified after the observable's value changes.
   * @param callback Function that is called whenever the notification happens.
   * @param target Defines the value of 'this' in the callback function.
   * @param event The knockout event name.
   */
  subscribe(callback: (newValue: T) => void, target?: any, event?: "change"): KnockoutSubscription;
  /**
   * Registers to be notified before the observable's value changes.
   * @param callback Function that is called whenever the notification happens.
   * @param target Defines the value of 'this' in the callback function.
   * @param event The knockout event name.
   */
  subscribe(callback: (newValue: T) => void, target: any, event: "beforeChange"): KnockoutSubscription;
  /**
   * Registers to be notified when a knockout or user defined event happens.
   * @param callback Function that is called whenever the notification happens. eventValue can be anything. No relation to underlying observable.
   * @param target Defines the value of 'this' in the callback function.
   * @param event The knockout or user defined event name.
   */
  subscribe<U>(callback: (eventValue: U) => void, target: any, event: KnockoutEventType): KnockoutSubscription;
  /**
   * Customizes observables basic functionality.
   * @param requestedExtenders Name of the extender feature and its value, e.g. { notify: 'always' }, { rateLimit: 50 }
   */
  extend(requestedExtenders: { [key: string]: any; }): KnockoutSubscribable<T>;
  /**
  * Gets total number of subscribers.
  */
  getSubscriptionsCount(): number;
  /**
   * Gets number of subscribers of a particular event.
   * @param event Event name.
   */
  getSubscriptionsCount(event: KnockoutEventType): number;

  [LATEST_VALUE]: T

  beforeSubscriptionAdd? (eventType: KnockoutEventType): void
  afterSubscriptionRemove? (eventType: KnockoutEventType): void
}

type Tc39Callback<T> = {
  next (value: T): void
}



export function subscribable<T> (this: KnockoutSubscribable<T>): KnockoutSubscribable<T> {
  Object.setPrototypeOf(this, ko_subscribable_fn)
  ko_subscribable_fn.init(this)
  return this
}


export const defaultEvent = 'change'

const ko_subscribable_fn = {
  [SUBSCRIBABLE_SYM]: true,

  init<T> (instance: KnockoutSubscribable<T>) {
    instance._subscriptions = { change: [] }
    instance._versionNumber = 1
  },

  subscribe<T> (
    this: KnockoutSubscribable<T>,
    callback: (eventValue: T) => void | Tc39Callback<T>,
    target: any,
    event: KnockoutEventType,
  ) {
    // TC39 proposed standard Observable { next: () => ... }
    event = event || defaultEvent
    const observer = (() => {
      if ('next' in callback) { return callback }
      return { next: target ? callback.bind(target) : callback }
    })()

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
      this._subscriptions[event] = []
    }
    this._subscriptions[event].push(subscriptionInstance)

    // Have TC39 `subscribe` immediately emit.
    // https://github.com/tc39/proposal-observable/issues/190
    if ('next' in callback && LATEST_VALUE in this) {
      observer.next(this[LATEST_VALUE])
    }

    return subscriptionInstance
  },

  notifySubscribers<T> (this: KnockoutSubscribable<T>, valueToNotify: T, event: KnockoutEventType) {
    event = event || defaultEvent
    if (event === defaultEvent) {
      this.updateVersion()
    }
    if (this.hasSubscriptionsForEvent(event)) {
      const subs = event === defaultEvent && this._changeSubscriptions
        || [...this._subscriptions[event]]

      try {
        dependencyDetection.begin() // Begin suppressing dependency detection (by setting the top frame to undefined)
        for (let i = 0, subscriptionInstance; subscriptionInstance = subs[i]; ++i) {
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

  getVersion<T> (this: KnockoutSubscribable<T>) {
    return this._versionNumber
  },

  hasChanged<T> (this: KnockoutSubscribable<T>, versionToCheck: number) {
    return this.getVersion() !== versionToCheck
  },

  updateVersion<T> (this: KnockoutSubscribable<T>) {
    ++this._versionNumber
  },

  hasSubscriptionsForEvent<T> (this: KnockoutSubscribable<T>, event: KnockoutEventType) {
    return this._subscriptions[event] && this._subscriptions[event].length
  },

  getSubscriptionsCount<T> (this: KnockoutSubscribable<T>, event: KnockoutEventType) {
    if (event) {
      return this._subscriptions[event] && this._subscriptions[event].length || 0
    } else {
      let total = 0
      objectForEach(this._subscriptions, function (eventName: KnockoutEventType, subscriptions: KnockoutSubscription[]) {
        if (eventName !== 'dirty') {
          total += subscriptions.length
        }
      })
      return total
    }
  },

  isDifferent<T> (this: KnockoutSubscribable<T>, oldValue: T, newValue: T) {
    return !this.equalityComparer ||
      !this.equalityComparer(oldValue, newValue)
  },

  /**
   *
   * @param this Trigger the callback on the next change
   * @param cb
   */
  once<T> (this: KnockoutSubscribable<T>, cb: (v: T) => void, eventType: KnockoutEventType) {
    const subs = this.subscribe((nv) => {
      subs.dispose()
      cb(nv)
    })
    return subs
  },

  /**
   * `when` waits until the value is equal to `v` or the predicate is truthy.
   */
  when<T, U> (
    this: KnockoutSubscribable<T>,
    test: T | Predicate<T>,
    returnValue?: U,
  ): Promise<T | U> {
    const current = this.peek()
    const givenRv = arguments.length > 1
    const testFn = typeof test === 'function'
      ? test as Predicate<T>
      : (v: T) => v === test

    if (testFn(current)) {
      return Promise.resolve(givenRv ? returnValue : current)
    }
    return new Promise((resolve, reject) => {
      const subs = this.subscribe(newValue => {
        if (testFn(newValue)) {
          subs.dispose()
          resolve(givenRv ? returnValue : newValue)
        }
      })
    })
  },

  /**
   * `yet` waits until the value is no longer equal to `v` or the predicate
   * is falsy.
   */
  yet<T, U> (
    this: KnockoutSubscribable<T>,
    test: T | Predicate<T>,
    ...args: [U]
  ) {
    const testFn = typeof test === 'function'
      ? test as Predicate<T> : v => v === test
    const negated = v => !testFn(v)
    return this.when(negated, ...args)
  },

  next<T> (this: KnockoutSubscribable<T>): Promise<T> {
    return new Promise(resolve => this.once(resolve))
  },

  toString () { return '[object Object]' },

  extend: applyExtenders
}

// For browsers that support proto assignment, we overwrite the prototype of each
// observable instance. Since observables are functions, we need Function.prototype
// to still be in the prototype chain.
Object.setPrototypeOf(ko_subscribable_fn, Function.prototype)

subscribable.fn = ko_subscribable_fn


type SubscribableFn = typeof ko_subscribable_fn
interface KnockoutSubscribable<T> extends SubscribableFn {
  when<T, U> (this: KnockoutSubscribable<T>, test: T | ((v: T) => boolean)): Promise<T>
  when<T, U> (this: KnockoutSubscribable<T>, test: T | ((v: T) => boolean), returnValue: U): Promise<U>
}
