
import { throttle as throttleFn, debounce as debounceFn } from '@tko/utils'
import { extenders } from './extenders'

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
export function limit (limitFunction) {
  var self = this
  var selfIsObservable = isObservable(self)
  var beforeChange = 'beforeChange'
  var ignoreBeforeChange, notifyNextChange, previousValue, pendingValue, didUpdate

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
    _limitChange  (value, isDirty) {
      if (!isDirty || !self._notificationIsPending) {
        didUpdate = !isDirty
      }
      self._changeSubscriptions = [...self._subscriptions[defaultEvent]]
      self._notificationIsPending = ignoreBeforeChange = true
      pendingValue = value
      finish()
    },

    _limitBeforeChange (value) {
      if (!ignoreBeforeChange) {
        previousValue = value
        self._origNotifySubscribers(value, beforeChange)
      }
    },

    _notifyNextChangeIfValueIsDifferent () {
      if (self.isDifferent(previousValue, self.peek(true /* evaluate */))) {
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
  interface KnockoutExtenders {
    rateLimit: typeof rateLimit,
  }
}
