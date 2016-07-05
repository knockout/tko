//
// Builtin Extenders
// ---
// TODO: These go in after ko.computed has been added i.e. alongside
//       the defaultBindingHandlers.
//

import {
    setTimeout,
    throttle as throttleFn, debounce as debounceFn
} from 'tko.utils';

import {
    extenders, deferUpdates
} from 'tko.observables';

import { computed } from 'tko.computed';


export function throttle(target, timeout) {
    // Throttling means two things:

    // (1) For dependent observables, we throttle *evaluations* so that, no matter how fast its dependencies
    //     notify updates, the target doesn't re-evaluate (and hence doesn't notify) faster than a certain rate
    target.throttleEvaluation = timeout;

    // (2) For writable targets (observables, or writable dependent observables), we throttle *writes*
    //     so the target cannot change value synchronously or faster than a certain rate
    var writeTimeoutInstance = null;
    return computed({
        read: target,
        write: function(value) {
            clearTimeout(writeTimeoutInstance);
            writeTimeoutInstance = setTimeout(function() {
                target(value);
            }, timeout);
        }
    });
}


export function rateLimit(target, options) {
    var timeout, method, limitFunction;

    if (typeof options == 'number') {
        timeout = options;
    } else {
        timeout = options.timeout;
        method = options.method;
    }

    // rateLimit supersedes deferred updates
    target._deferUpdates = false;

    limitFunction = method == 'notifyWhenChangesStop' ? debounceFn : throttleFn;
    target.limit(function(callback) {
        return limitFunction(callback, timeout);
    });
}


export function deferred(target, options) {
    if (options !== true) {
        throw new Error('The \'deferred\' extender only accepts the value \'true\', because it is not supported to turn deferral off once enabled.');
    }

    deferUpdates(target)
}
