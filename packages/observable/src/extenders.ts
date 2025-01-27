//
// Observable extenders
// ---
//
import {
    options, objectForEach,
    throttle as throttleFn, debounce as debounceFn,
    CompareArraysOptions
} from '@tko/utils'

import { deferUpdates } from './defer'

var primitiveTypes = {
  'undefined': 1, 'boolean': 1, 'number': 1, 'string': 1
}

export function valuesArePrimitiveAndEqual (a, b) {
  var oldValueIsPrimitive = (a === null) || (typeof (a) in primitiveTypes)
  return oldValueIsPrimitive ? (a === b) : false
}

export function applyExtenders (requestedExtenders?) {
  var target = this
  if (requestedExtenders) {
    objectForEach(requestedExtenders, function (key, value) {
      var extenderHandler = extenders[key]
      if (typeof extenderHandler === 'function') {
        target = extenderHandler(target, value) || target
      } else {
        options.onError(new Error('Extender not found: ' + key))
      }
    })
  }
  return target
}

/*
                --- DEFAULT EXTENDERS ---
 */

// Change when notifications are published.
export function notify(target: any, notifyWhen: string) {
  target.equalityComparer = notifyWhen == 'always'
        ? null  // null equalityComparer means to always notify
        : valuesArePrimitiveAndEqual
}

export function deferred(target: any, option: boolean) {
  if (option !== true) {
    throw new Error('The \'deferred\' extender only accepts the value \'true\', because it is not supported to turn deferral off once enabled.')
  }
  deferUpdates(target)
}

export function rateLimit(target: any, options: string | any) {
  var timeout, method, limitFunction

  if (typeof options === 'number') {
    timeout = options
  } else {
    timeout = options.timeout
    method = options.method
  }

  // rateLimit supersedes deferred updates
  target._deferUpdates = false

  limitFunction = method === 'notifyWhenChangesStop' ? debounceFn : throttleFn

  target.limit(function (callback) {
    return limitFunction(callback, timeout)
  })
}

export interface BaseExtendersType{
  notify(target: any, notifyWhen: string): void,
  deferred(target: any, option: boolean): void,
  rateLimit(target: any, options: string | any): void,
  trackArrayChanges? (target: ObservableArray, options?: CompareArraysOptions) : void
  throttle?(target: any, timout: number): void
}

export var extenders: BaseExtendersType = {
  notify: notify,
  deferred: deferred,
  rateLimit: rateLimit
}
