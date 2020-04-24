//
// Observable extenders
// ---
//
import {
    options, objectForEach,
    throttle as throttleFn, debounce as debounceFn
} from '@tko/utils'

import { deferUpdates } from './defer.js'

type KnockoutSubscribable<T> = import('./subscribable').KnockoutSubscribable<T>

/**
 * Extend this interface with new extenders and their respective return types.
 */
export interface KnockoutExtenders {
  throttle<T> (target: KnockoutSubscribable<T>, timeout: number): KnockoutComputed<T>;
  notify<T> (target: any, notifyWhen: string): void
  deferred<T> (target: KnockoutSubscribable<T>, option: true): void

  rateLimit<T> (target: KnockoutSubscribable<T>, options: RateLimitOptions): void

  trackArrayChanges<T> (target: KnockoutSubscribable<T>, v: true): KnockoutSubscribable<T>
}

type KnockoutExtenderArgs = {
  readonly [P in keyof KnockoutExtenders]?: Parameters<KnockoutExtenders[P]>[1]
}


const primitiveTypes = {
  'undefined': 1, 'boolean': 1, 'number': 1, 'string': 1
}

export function valuesArePrimitiveAndEqual<T> (a: T, b: T): boolean {
  const oldValueIsPrimitive = (a === null) || (typeof (a) in primitiveTypes)
  return oldValueIsPrimitive ? (a === b) : false
}

export function applyExtenders<T> (
  this: KnockoutSubscribable<T>,
  requestedExtenders: KnockoutExtenderArgs,
) {
  let target = this
  if (requestedExtenders) {
    for (const key in requestedExtenders) {
      const options = requestedExtenders[key as keyof KnockoutExtenderArgs]
      const extenderHandler = extenders[key as keyof KnockoutExtenderArgs]
      if (typeof extenderHandler === 'function') {
        target = (extenderHandler as any)(target, options) || target
      } else {
        options.onError(new Error('Extender not found: ' + key))
      }
    }
  }
  return target
}

/*
                --- DEFAULT EXTENDERS ---
 */

// Change when notifications are published.
export function notify<T> (target: KnockoutSubscribable<T>, notifyWhen: string) {
  target.equalityComparer = notifyWhen === 'always'
    ? null  // null equalityComparer means to always notify
    : valuesArePrimitiveAndEqual
}

export function deferred<T> (target: KnockoutSubscribable<T>, option: true) {
  if (option !== true) {
    throw new Error('The \'deferred\' extender only accepts the value \'true\', because it is not supported to turn deferral off once enabled.')
  }
  deferUpdates(target)
}

type RateLimitOptions = number | {
  timeout: number
  method: 'notifyWhenChangesStop' | 'throttle' | 'debounce'
}

type RateLimitFunction = typeof debounceFn | typeof throttleFn

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

export const extenders: KnockoutExtenders = {
  notify,
  deferred,
  rateLimit,
}
