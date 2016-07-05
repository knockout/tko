//
// Asynchronous functionality
// ---
import { safeSetTimeout } from './error.js';

export function throttle(callback, timeout) {
    var timeoutInstance;
    return function () {
        if (!timeoutInstance) {
            timeoutInstance = safeSetTimeout(function () {
                timeoutInstance = undefined;
                callback();
            }, timeout);
        }
    };
}

export function debounce(callback, timeout) {
    var timeoutInstance;
    return function () {
        clearTimeout(timeoutInstance);
        timeoutInstance = safeSetTimeout(callback, timeout);
    };
}
