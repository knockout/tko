//
// Observables
// ---
//
// If `tko.observable` is included, then these will be set to `unwrap` and
// `peek`.
//
// The following are included for legacy support where ko.utils.FN is
// called instead of the equivalent `ko.FN`.
//
export var unwrapObservable
export var peekObservable
export { unwrapObservable as unwrap }

export function setUpwrapObservableFn(fn) {
    unwrapObservable = fn
}

export function setPeekObservableFn(fn) {
    peekObservable = fn
}
