//
// Error handling
// ---
//
// The default onError handler is to re-throw.
import options from './options.js';

// tslint:disable:ban-types
export function catchFunctionErrors<T extends Function>(delegate: T): T {
  // Though this is a very nasty catch (and potentially wrong, because on error this may return undefined, it makes working with this function much more pleasant)
  return options.onError ? (function(this: any) {
    try {
      return delegate.apply(this, arguments);
    } catch (e) {
      options.onError(e);
    }
  }) as any : delegate;
}

export function deferError(error: Error) {
  safeSetTimeout(() => options.onError(error), 0);
}

export function safeSetTimeout(handler: Function, timeout: number) {
  return setTimeout(catchFunctionErrors(handler), timeout);
}
