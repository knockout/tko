import type { Subscribable } from "./subscribable"

/**
 * Create a subscribable symbol that's used to identify subscribables.
 */
export const SUBSCRIBABLE_SYM = Symbol('Knockout Subscribable')

export function isSubscribable<T = any>(instance : any) : instance is Subscribable<T> {
  return (instance && instance[SUBSCRIBABLE_SYM]) || false
}
