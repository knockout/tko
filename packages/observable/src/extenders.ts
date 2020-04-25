//
// Observable extenders
// ---
//
import { options } from '@tko/utils'
import { deferUpdates } from './defer.js'

type KnockoutExtenderArgs = {
  readonly [P in keyof KnockoutExtenders]?: Parameters<KnockoutExtenders[P]>[1]
}


const primitiveTypes = {
  'undefined': 1, 'boolean': 1, 'number': 1, 'string': 1
}

export function valuesArePrimitiveAndEqual<T> (a: T, b: T): boolean {
  const oldValueIsPrimitive = (a === null) || (typeof a in primitiveTypes)
  return oldValueIsPrimitive ? a === b : false
}

export function applyExtenders<T> (
  this: KnockoutSubscribable<T>,
  requestedExtenders: KnockoutExtenderArgs,
) {
  let target = this
  if (requestedExtenders) {
    for (const key in requestedExtenders) {
      const value = requestedExtenders[key as keyof KnockoutExtenderArgs]
      const extenderHandler = extenders[key as keyof KnockoutExtenderArgs]
      if (typeof extenderHandler === 'function') {
        target = (extenderHandler as any)(target, value) || target
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

export const extenders: Partial<KnockoutExtenders> = {
  notify,
  deferred,
}



/**
 * Extend this interface with new extenders and their respective return types.
 */
declare global {
  export interface KnockoutExtenders {
    throttle<T> (target: KnockoutSubscribable<T>, timeout: number): KnockoutComputed<T>
    notify<T> (target: any, notifyWhen: string): void
    deferred<T> (target: KnockoutSubscribable<T>, option: true): void
    trackArrayChanges<T> (target: KnockoutSubscribable<T>, v: true): KnockoutSubscribable<T>
  }
}
