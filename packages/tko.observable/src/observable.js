//
//  Observable values
//  ---
//
import {
    createSymbolOrString, canSetPrototype, extend, setPrototypeOfOrExtend,
    setPrototypeOf, hasPrototype, options
} from 'tko.utils';

import * as dependencyDetection from './dependencyDetection.js';
import { deferUpdates } from './defer.js';
import { subscribable } from './subscribable.js';
import { valuesArePrimitiveAndEqual } from './extenders.js';

var observableLatestValue = createSymbolOrString('_latestValue');


export function observable(initialValue) {
    function obsFn() {
        if (arguments.length > 0) {
            // Write

            // Ignore writes if the value hasn't changed
            if (obsFn.isDifferent(obsFn[observableLatestValue], arguments[0])) {
                obsFn.valueWillMutate();
                obsFn[observableLatestValue] = arguments[0];
                obsFn.valueHasMutated();
            }
            return this; // Permits chained assignments
        }
        else {
            // Read
            dependencyDetection.registerDependency(obsFn); // The caller only needs to be notified of changes if they did a "read" operation
            return obsFn[observableLatestValue];
        }
    }

    obsFn[observableLatestValue] = initialValue;

    // Inherit from 'subscribable'
    if (!canSetPrototype) {
        // 'subscribable' won't be on the prototype chain unless we put it there directly
        extend(obsFn, subscribable.fn);
    }
    subscribable.fn.init(obsFn);

    // Inherit from 'observable'
    setPrototypeOfOrExtend(obsFn, observable.fn);

    if (options.deferUpdates) {
        deferUpdates(obsFn);
    }

    return obsFn;
}

// Define prototype for observables
observable.fn = {
    equalityComparer: valuesArePrimitiveAndEqual,
    peek: function() { return this[observableLatestValue]; },
    valueHasMutated: function () { this.notifySubscribers(this[observableLatestValue]); },
    valueWillMutate: function () {
        this.notifySubscribers(this[observableLatestValue], 'beforeChange');
    }
};

// Note that for browsers that don't support proto assignment, the
// inheritance chain is created manually in the observable constructor
if (canSetPrototype) {
    setPrototypeOf(observable.fn, subscribable.fn);
}

var protoProperty = observable.protoProperty = options.protoProperty;
observable.fn[protoProperty] = observable;

export function isObservable(instance) {
    return hasPrototype(instance, observable);
}

export function unwrap(value) {
    return isObservable(value) ? value() : value;
}

export function peek(value) {
    return isObservable(value) ? value.peek() : value;
}

export function isWriteableObservable(instance) {
    // Observable
    if ((typeof instance == 'function') && instance[protoProperty] === observable)
        return true;
    // Writeable dependent observable
    if ((typeof instance == 'function') /* && (instance[protoProperty] === ko.dependentObservable)*/ && (instance.hasWriteFunction))
        return true;
    // Anything else
    return false;
}

export { isWriteableObservable as isWritableObservable };
