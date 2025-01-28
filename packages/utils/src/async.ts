//
// Asynchronous functionality
// ---
import { safeSetTimeout } from './error'

export function throttle (callback, timeout) {
  var timeoutInstance: ReturnType<typeof setTimeout> | undefined
  return function (...args) {
    if (!timeoutInstance) {
      timeoutInstance = safeSetTimeout(function () {
        timeoutInstance = undefined
        callback(...args)
      }, timeout)
    }
  }
}

export function debounce (callback, timeout: number) {
  var timeoutInstance: ReturnType<typeof setTimeout>
  return function (...args) {
    clearTimeout(timeoutInstance)
    timeoutInstance = safeSetTimeout(() => callback(...args), timeout)
  }
}
