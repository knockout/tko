/* eslint no-cond-assign: 0 */
import {
    arrayRemoveItem, objectForEach, options
} from 'tko.utils'

import Subscription from './Subscription'
import { SUBSCRIBABLE_SYM } from './subscribableSymbol'
import { applyExtenders } from './extenders.js'
import * as dependencyDetection from './dependencyDetection.js'
export { isSubscribable } from './subscribableSymbol'

// Descendants may have a LATEST_VALUE, which if present
// causes TC39 subscriptions to emit the latest value when
// subscribed.
export const LATEST_VALUE = Symbol('Knockout latest value')

export function subscribable () {
  Object.setPrototypeOf(this, ko_subscribable_fn)
  ko_subscribable_fn.init(this)
}

export var defaultEvent = 'change'

var ko_subscribable_fn = {
  [SUBSCRIBABLE_SYM]: true,
  [Symbol.observable] () { return this },

  init (instance) {
    instance._subscriptions = { change: [] }
    instance._versionNumber = 1
  },

  subscribe (callback, callbackTarget, event) {
    // TC39 proposed standard Observable { next: () => ... }
    const isTC39Callback = typeof callback === 'object' && callback.next

    event = event || defaultEvent
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

  notifySubscribers (valueToNotify, event) {
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

  getVersion () {
    return this._versionNumber
  },

  hasChanged (versionToCheck) {
    return this.getVersion() !== versionToCheck
  },

  updateVersion () {
    ++this._versionNumber
  },

  hasSubscriptionsForEvent (event) {
    return this._subscriptions[event] && this._subscriptions[event].length
  },

  getSubscriptionsCount (event) {
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

  isDifferent (oldValue, newValue) {
    return !this.equalityComparer ||
               !this.equalityComparer(oldValue, newValue)
  },

  once (cb) {
    const subs = this.subscribe((nv) => {
      subs.dispose()
      cb(nv)
    })
  },

  when (test, returnValue) {
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

  yet (test, ...args) {
    const testFn = typeof test === 'function' ? test : v => v === test
    const negated = v => !testFn(v)
    return this.when(negated, ...args)
  },

  next () { return new Promise(resolve => this.once(resolve)) },

  toString () { return '[object Object]' },

  extend: applyExtenders
}

// For browsers that support proto assignment, we overwrite the prototype of each
// observable instance. Since observables are functions, we need Function.prototype
// to still be in the prototype chain.
Object.setPrototypeOf(ko_subscribable_fn, Function.prototype)

subscribable.fn = ko_subscribable_fn
