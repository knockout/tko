/**
 * Create a subscribable symbol that's used to identify subscribables.
 */
export const SUBSCRIBABLE_SYM = Symbol('Knockout Subscribable')

export function isSubscribable (instance) {
  return (instance && instance[SUBSCRIBABLE_SYM]) || false
}
