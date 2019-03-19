//
// Error handling
// ---
//
// The default onError handler is to re-throw.
import options from './options.js';

export function catchFunctionErrors<T extends Array<any>, TOut>(delegate: (...args: T) => TOut) {
  if (!options.onError) { return delegate }
  return (...args: T) => {
    try {
      return delegate(...args)
    } catch (err) {
      options.onError(err)
    }
  }
}

export function deferError (error: Error) {
  safeSetTimeout(function () { throw error }, 0)
}

export function safeSetTimeout(handler: (err: Error) => void, timeout: number) {
  return setTimeout(catchFunctionErrors(handler), timeout);
}
