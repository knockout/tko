
import {
  throttle as throttleFn, debounce as debounceFn,
} from '@tko/utils'
import { isObservable } from './observable'
import { extenders } from './extenders'
import { defaultEvent } from './subscribable'

export type RateLimitFunction = typeof debounceFn | typeof throttleFn

type RateLimitOptions = number | {
  timeout: number
  method: 'notifyWhenChangesStop' | 'throttle' | 'debounce'
}

export function rateLimit<T> (
  target: KnockoutSubscribable<T>,
  options: RateLimitOptions,
) {
  const timeout = typeof options === 'number' ? options : options.timeout
  const method = typeof options === 'number' ? null : options.method

  // rateLimit supersedes deferred updates
  target._deferUpdates = false

  const limitFunction = (
    method === 'notifyWhenChangesStop' ||
    method === 'debounce'
  ) ? debounceFn : throttleFn

  target.limit((cb: RateLimitFunction) => limitFunction(cb, timeout))
}

// Moved out of "limit" to avoid the extra closure
function limitNotifySubscribers<T> (
  this: KnockoutObservable<T>,
  value: T,
  event?: KnockoutEventType,
  ) {
  if (!event || event === defaultEvent) {
    this._limitChange(value)
  } else if (event === 'beforeChange') {
    this._limitBeforeChange(value)
  } else {
    this._origNotifySubscribers(value, event)
  }
}

// Add `limit` function to the subscribable prototype
export function limit<T> (
  this: KnockoutObservable<T>,
  limitFunction: RateLimitFunction,
) {
  const self = this
  const selfIsObservable = isObservable(self)
  const beforeChange = 'beforeChange'
  let ignoreBeforeChange: boolean
  let notifyNextChange: boolean
  let previousValue: T | KnockoutSubscribable<T>
  let pendingValue: T | KnockoutSubscribable<T>
  let didUpdate: boolean

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
      didUpdate && self.isDifferent(previousValue as T, pendingValue as T)
    )
    self._notifyNextChange = didUpdate = ignoreBeforeChange = false
    if (shouldNotify) {
      self._origNotifySubscribers((previousValue as T) = (pendingValue as T))
    }
  })

  Object.assign(self, {
    _limitChange (value: T, isDirty: boolean) {
      if (!isDirty || !self._notificationIsPending) {
        didUpdate = !isDirty
      }
      self._changeSubscriptions = Array.from(self._subscriptions[defaultEvent] || [])
      self._notificationIsPending = ignoreBeforeChange = true
      pendingValue = value
      finish()
    },

    _limitBeforeChange (value: T) {
      if (!ignoreBeforeChange) {
        previousValue = value
        self._origNotifySubscribers(value, beforeChange)
      }
    },

    _notifyNextChangeIfValueIsDifferent () {
      if (self.isDifferent(previousValue as T, self.peek(true /* evaluate */))) {
        notifyNextChange = true
      }
    },

    _recordUpdate () {
      didUpdate = true
    }
  })
}

extenders.rateLimit = rateLimit

declare global {
  export interface KnockoutExtenders {
    rateLimit: typeof rateLimit,
  }

  export interface KnockoutObservable<T> {
    _notificationIsPending: boolean
    _evalIfChanged?: () => T | KnockoutSubscribable<T>
    _origNotifySubscribers: KnockoutObservable<T>['notifySubscribers']
    _notifyNextChange: boolean
    _limitChange: (value: T, isDirty?: boolean) => void
    _limitBeforeChange: (value: T) => void
  }
}
