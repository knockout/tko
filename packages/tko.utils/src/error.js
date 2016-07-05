//
// Error handling
// ---
//
// The default onError handler is to re-throw.
import options from './options.js';


export function catchFunctionErrors(delegate) {
    return options.onError ? function () {
        try {
            return delegate.apply(this, arguments);
        } catch (e) {
            options.onError(e);
        }
    } : delegate;
}

export function deferError(error) {
    safeSetTimeout(function () { options.onError(error); }, 0);
}


export function safeSetTimeout(handler, timeout) {
    return setTimeout(catchFunctionErrors(handler), timeout);
}
