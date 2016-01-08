//
//  Observable values
//  ---
//
import {
    createSymbolOrString, canSetPrototype, extend, setPrototypeOfOrExtend,
    setPrototypeOf, hasPrototype
} from 'tko.utils';

import * as dependencyDetection from './dependencyDetection.js';
import { deferUpdates } from './defer.js';
import { subscribable } from './subscribable.js';
import { valuesArePrimitiveAndEqual } from './extenders.js';

var observableLatestValue = createSymbolOrString('_latestValue');


export function observable(initialValue) {
    function observable() {
        if (arguments.length > 0) {
            // Write

            // Ignore writes if the value hasn't changed
            if (observable.isDifferent(observable[observableLatestValue], arguments[0])) {
                observable.valueWillMutate();
                observable[observableLatestValue] = arguments[0];
                observable.valueHasMutated();
            }
            return this; // Permits chained assignments
        }
        else {
            // Read
            dependencyDetection.registerDependency(observable); // The caller only needs to be notified of changes if they did a "read" operation
            return observable[observableLatestValue];
        }
    }

    observable[observableLatestValue] = initialValue;

    // Inherit from 'subscribable'
    if (!canSetPrototype) {
        // 'subscribable' won't be on the prototype chain unless we put it there directly
        extend(observable, subscribable.fn);
    }
    subscribable.fn.init(observable);

    // Inherit from 'observable'
    setPrototypeOfOrExtend(observable, observableFn);

    if (ko.options['deferUpdates']) {
        deferUpdates(observable);
    }

    return observable;
}

// Define prototype for observables
var observableFn = {
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
    setPrototypeOf(observableFn, subscribable.fn);
}

var protoProperty = observable.protoProperty = '__ko_proto__';
observableFn[protoProperty] = observable;

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
