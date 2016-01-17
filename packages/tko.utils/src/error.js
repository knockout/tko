//
// Error handling
//
export var onError

export function catchFunctionErrors(delegate) {
    return onError ? function () {
        try {
            return delegate.apply(this, arguments);
        } catch (e) {
            onError && onError(e);
            throw e;
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

export { safeSetTimeout as setTimeout }
