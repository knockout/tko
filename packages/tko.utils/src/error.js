//
// Error handling
//

export function catchFunctionErrors(delegate) {
    return ko.onError ? function () {
        try {
            return delegate.apply(this, arguments);
        } catch (e) {
            ko.onError && ko.onError(e);
            throw e;
        }
    } : delegate;
}

export function deferError(error) {
    setTimeout(function () {
        ko.onError && ko.onError(error);
        throw error;
    }, 0);
}


export function setTimeout(handler, timeout) {
    return setTimeout(catchFunctionErrors(handler), timeout);
}
