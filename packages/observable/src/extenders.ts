//
// Observable extenders
// ---
//
import {
    options, objectForEach,
    throttle as throttleFn, debounce as debounceFn    
} from '@tko/utils'

import type { CompareArraysOptions } from '@tko/utils'
import type { ObservableArray } from '@tko/observable'

import { deferUpdates } from './defer'

let primitiveTypes = {
  'undefined': 1, 'boolean': 1, 'number': 1, 'string': 1
}

export function valuesArePrimitiveAndEqual (a, b) {
  let oldValueIsPrimitive = (a === null) || (typeof (a) in primitiveTypes)
  return oldValueIsPrimitive ? (a === b) : false
}

export function applyExtenders (requestedExtenders?) {
  let target = this
  if (requestedExtenders) {
    objectForEach(requestedExtenders, function (key, value) {
      let extenderHandler = extenders[key]
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
  let timeout, method, limitFunction

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

export let extenders: BaseExtendersType = {
  notify: notify,
  deferred: deferred,
  rateLimit: rateLimit
}
