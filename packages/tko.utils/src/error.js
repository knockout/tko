//
// Error handling
// ---
//
// The default onError handler is to re-throw.
export var onError = function (e) { throw(e); };

export function catchFunctionErrors(delegate) {
    return onError ? function () {
        try {
            return delegate.apply(this, arguments);
        } catch (e) {
            onError(e);
        }
    } : delegate;
}

export function deferError(error) {
    safeSetTimeout(function () {
        onError && onError(error);
        throw error;
    }, 0);
}


function safeSetTimeout(handler, timeout) {
    return setTimeout(catchFunctionErrors(handler), timeout);
}

export { safeSetTimeout as safeSetTimeout };
