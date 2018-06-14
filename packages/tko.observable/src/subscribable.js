/* eslint no-cond-assign: 0 */
import {
    arrayRemoveItem, objectForEach, options, removeDisposeCallback,
    addDisposeCallback
} from 'tko.utils'

import { SUBSCRIBABLE_SYM } from './subscribableSymbol'
export { isSubscribable } from './subscribableSymbol'
import { applyExtenders } from './extenders.js'
import * as dependencyDetection from './dependencyDetection.js'


export function subscription (target, callback, disposeCallback) {
  this._target = target
  this._callback = callback
  this._disposeCallback = disposeCallback
  this._isDisposed = false
  this._domNodeDisposalCallback = null
}

Object.assign(subscription.prototype, {
  dispose () {
    if (this._domNodeDisposalCallback) {
      removeDisposeCallback(this._node, this._domNodeDisposalCallback)
    }
    this._isDisposed = true
    this._disposeCallback()
  },

  disposeWhenNodeIsRemoved (node) {
    this._node = node
    addDisposeCallback(node, this._domNodeDisposalCallback = this.dispose.bind(this))
  }
})

export function subscribable () {
  Object.setPrototypeOf(this, ko_subscribable_fn)
  ko_subscribable_fn.init(this)
}

export var defaultEvent = 'change'

var ko_subscribable_fn = {
  [SUBSCRIBABLE_SYM]: true,

  init (instance) {
    instance._subscriptions = { change: [] }
    instance._versionNumber = 1
  },

  subscribe (callback, callbackTarget, event) {
    var self = this

    event = event || defaultEvent
    var boundCallback = callbackTarget ? callback.bind(callbackTarget) : callback

    var subscriptionInstance = new subscription(self, boundCallback, function () {
      arrayRemoveItem(self._subscriptions[event], subscriptionInstance)
      if (self.afterSubscriptionRemove) {
        self.afterSubscriptionRemove(event)
      }
    })

    if (self.beforeSubscriptionAdd) {
      self.beforeSubscriptionAdd(event)
    }

    if (!self._subscriptions[event]) {
      self._subscriptions[event] = []
    }
    self._subscriptions[event].push(subscriptionInstance)

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
