//
// Observables
//


export function unwrapObservable (value) {
    return ko.isObservable(value) ? value() : value;
}

export function peekObservable (value) {
    return ko.isObservable(value) ? value.peek() : value;
}

// Shorten `unwrap` alias
export var unwrap = unwrapObservable
