/* eslint no-cond-assign: 0 */
import {
    arrayRemoveItem, objectForEach
} from '@tko/utils'

import { default as Subscription, LATEST_VALUE } from './Subscription'
import { applyExtenders } from './extenders.js'
import * as dependencyDetection from './dependencyDetection.js'
export { isSubscribable } from './subscribableSymbol'
import { SUBSCRIBABLE_SYM } from './subscribableSymbol'

export interface ISubscribable<T> {
  _versionNumber: number
  _subscriptions: Record<string, Subscription<T>[]>
  [SUBSCRIBABLE_SYM]: boolean
  [LATEST_VALUE]?: any
  [Symbol.observable] (): ISubscribable<T>

  init: () => void
  equalityComparer?: (oldValue: any, newValue: any) => boolean
  afterSubscriptionRemove?: (event: string) => void
  beforeSubscriptionAdd?: (event: string) => void
  subscribe: (callback, callbackTarget?, event?: string) => Subscription<T>
}

// Descendants may have a LATEST_VALUE, which if present
// causes TC39 subscriptions to emit the latest value when
// subscribed.

export function subscribable<T> (this: ISubscribable<T>) : void {
  Object.setPrototypeOf(this, Subscribable.prototype)
  this.init()
}

interface TC39Callback {
}
type Subscriber = (value: any) => void | TC39Callback

export const defaultEvent = 'change'

class Subscribable<T> implements ISubscribable<T> {
  public _subscriptions!: Record<string, any[]> // @todo make more restrictive
  public _versionNumber!: number

  public afterSubscriptionRemove?: (event: string) => void
  public beforeSubscriptionAdd?: (event: string) => void
  public equalityComparer?: (oldValue: any, newValue: any) => boolean

  [SUBSCRIBABLE_SYM]: true
  [Symbol.observable] () { return this }

  init() : void {
    this._subscriptions = { change: [] }
    this._versionNumber = 1
  }

  subscribe(callback: Subscriber, callbackTarget?: Function, event = defaultEvent) : Subscription {
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
  }

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
  }

  getVersion () : number {
    return this._versionNumber
  }

  hasChanged (versionToCheck : number) : boolean {
    return this.getVersion() !== versionToCheck
  }

  updateVersion () :void {
    ++this._versionNumber
  }

  hasSubscriptionsForEvent (event: string) : boolean {
    return this._subscriptions[event] && this._subscriptions[event].length
  }

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
  }

  isDifferent (oldValue: any , newValue: any) : boolean {
    return !this.equalityComparer ||
      !this.equalityComparer(oldValue, newValue)
  }

  once (cb: (value: any) => void) : void {
    const subs = this.subscribe(nv => {
      subs.dispose()
      cb(nv)
    })
  }

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
  }

  yet (test: any|((value: any) => boolean), ...args) {
    const testFn = typeof test === 'function' ? test : v => v === test
    const negated = v => !testFn(v)
    return this.when(negated, ...args)
  }

  next () : Promise<any> { return new Promise(resolve => this.once(resolve)) }

  toString () { return '[object Object]' }

  extend = applyExtenders
}

// For browsers that support proto assignment, we overwrite the prototype of each
// observable instance. Since observables are functions, we need Function.prototype
// to still be in the prototype chain.
Object.setPrototypeOf(Subscribable, Function.prototype)

subscribable.fn = Subscribable.prototype
