/* eslint no-cond-assign: 0 */
import {
    arrayRemoveItem, objectForEach, options
} from '@tko/utils'

import { default as Subscription, LATEST_VALUE } from './Subscription'
import { applyExtenders } from './extenders.js'
import * as dependencyDetection from './dependencyDetection.js'
export { isSubscribable } from './subscribableSymbol'
import { SUBSCRIBABLE_SYM } from './subscribableSymbol'

// Descendants may have a LATEST_VALUE, which if present
// causes TC39 subscriptions to emit the latest value when
// subscribed.

export function subscribable<T> (this: Subscribable<T>) : void {
  Object.setPrototypeOf(this, ko_subscribable_fn)
  ko_subscribable_fn.init(this)
}

interface TC39Callback {
}
type Subscriber = (value: any) => void | TC39Callback

export const defaultEvent = 'change'

const ko_subscribable_fn = {
  [SUBSCRIBABLE_SYM]: true,
  [Symbol.observable] () { return this },

  init<T> (instance : Subscribable<T>) : void {
    instance._subscriptions = { change: [] }
    instance._versionNumber = 1
  },

  subscribe<T> (this: Subscribable<T>, callback: Subscriber, callbackTarget?: Function, event = defaultEvent) : Subscription {
    // TC39 proposed standard Observable { next: () => ... }
    const isTC39Callback = typeof callback === 'object' && callback.next

    const observer = isTC39Callback ? callback : {
      next: callbackTarget ? callback.bind(callbackTarget) : callback
    }

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

    if (isTC39Callback && LATEST_VALUE in this) {
      observer.next(this[LATEST_VALUE])
    }

    return subscriptionInstance
  },

  notifySubscribers (valueToNotify: any, event: string) {
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

  getVersion (this: Subscribable) : number {
    return this._versionNumber
  },

  hasChanged (versionToCheck : number) : boolean {
    return this.getVersion() !== versionToCheck
  },

  updateVersion (this: Subscribable) :void {
    ++this._versionNumber
  },

  hasSubscriptionsForEvent (event: string) : boolean {
    return this._subscriptions[event] && this._subscriptions[event].length
  },

  getSubscriptionsCount (event: string) : number {
    if (event) {
      return this._subscriptions[event] && this._subscriptions[event].length || 0
    } else {
      var total = 0
      objectForEach(this._subscriptions, function (eventName, subscriptions) {
        if (eventName !== 'dirty') {
          total += subscriptions.length
        }
      })
      return total
    }
  },

  isDifferent (oldValue: any , newValue: any) : boolean {
    return !this.equalityComparer ||
      !this.equalityComparer(oldValue, newValue)
  },

  once (this: Subscribable, cb: (value: any) => void) : void {
    const subs = this.subscribe(nv => {
      subs.dispose()
      cb(nv)
    })
  },

  when (test: any|((value: any) => boolean), returnValue?: any) : Promise<any> {
    const current = this.peek()
    const givenRv = arguments.length > 1
    const testFn = typeof test === 'function' ? test : v => v === test
    if (testFn(current)) {
      return Promise.resolve(givenRv ? returnValue : current)
    }
    return new Promise((resolve, reject) => {
      const subs = this.subscribe((newValue: any) => {
        if (testFn(newValue)) {
          subs.dispose()
          resolve(givenRv ? returnValue : newValue)
        }
      })
    })
  },

  yet (test: any|((value: any) => boolean), ...args) {
    const testFn = typeof test === 'function' ? test : v => v === test
    const negated = v => !testFn(v)
    return this.when(negated, ...args)
  },

  next () : Promise<any> { return new Promise(resolve => this.once(resolve)) },

  toString () { return '[object Object]' },

  extend: applyExtenders
}

// For browsers that support proto assignment, we overwrite the prototype of each
// observable instance. Since observables are functions, we need Function.prototype
// to still be in the prototype chain.
Object.setPrototypeOf(ko_subscribable_fn, Function.prototype)

subscribable.fn = ko_subscribable_fn
