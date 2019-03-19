//
// Asynchronous functionality
// ---
import { safeSetTimeout } from './error';

// tslint:disable-next-line:ban-types
export function throttle(callback: Function, timeout: number) {
  let timeoutInstance: number|undefined;
  return (...args: any[]) => {
    if (!timeoutInstance) {
      timeoutInstance = safeSetTimeout(() => {
        timeoutInstance = undefined;
        callback(...args);
      }, timeout);
    }
  };
}

// tslint:disable-next-line:ban-types
export function debounce(callback: Function, timeout: number) {
  let timeoutInstance: number|undefined;
  return (...args: any[]) => {
    clearTimeout(timeoutInstance);
    timeoutInstance = safeSetTimeout(() => callback(...args), timeout);
  };
}
