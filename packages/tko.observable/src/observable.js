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
    function Observable() {
        if (arguments.length > 0) {
            // Write

            // Ignore writes if the value hasn't changed
            if (Observable.isDifferent(Observable[observableLatestValue], arguments[0])) {
                Observable.valueWillMutate();
                Observable[observableLatestValue] = arguments[0];
                Observable.valueHasMutated();
            }
            return this; // Permits chained assignments
        }
        else {
            // Read
            dependencyDetection.registerDependency(Observable); // The caller only needs to be notified of changes if they did a "read" operation
            return Observable[observableLatestValue];
        }
    }

    Observable[observableLatestValue] = initialValue;

    // Inherit from 'subscribable'
    if (!canSetPrototype) {
        // 'subscribable' won't be on the prototype chain unless we put it there directly
        extend(Observable, subscribable.fn);
    }
    subscribable.fn.init(Observable);

    // Inherit from 'observable'
    setPrototypeOfOrExtend(Observable, observable.fn);

    if (options.deferUpdates) {
        deferUpdates(Observable);
    }

    return Observable;
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
