//
// Error handling
// ---
//
// The default onError handler is to re-throw.
import options from './options'

export function catchFunctionErrors (delegate) {
  if (!options.onError) { return delegate }
  return (...args) => {
    try {
      return delegate(...args)
    } catch (err) {
      options.onError(err as Error)
    }
  }
}

export function deferError (error) {
  safeSetTimeout(function () { throw error }, 0)
}

export function safeSetTimeout (handler, timeout: number) {
  return setTimeout(catchFunctionErrors(handler), timeout)
}
