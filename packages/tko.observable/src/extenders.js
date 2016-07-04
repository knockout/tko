//
// Observable extenders
// ---
//
import { objectForEach } from 'tko.utils';


var primitiveTypes = {
    'undefined': 1, 'boolean': 1, 'number': 1, 'string': 1
};


export function valuesArePrimitiveAndEqual(a, b) {
    var oldValueIsPrimitive = (a === null) || (typeof(a) in primitiveTypes);
    return oldValueIsPrimitive ? (a === b) : false;
}


export function applyExtenders(requestedExtenders) {
    var target = this;
    if (requestedExtenders) {
        objectForEach(requestedExtenders, function(key, value) {
            var extenderHandler = extenders[key];
            if (typeof extenderHandler == 'function') {
                target = extenderHandler(target, value) || target;
            }
        });
    }
    return target;
}


// Change when notifications are published.
export function notify(target, notifyWhen) {
    target.equalityComparer = notifyWhen == "always" ?
        null :  // null equalityComparer means to always notify
        extenders.valuesArePrimitiveAndEqual;
}


export var extenders = {
    notify: notify
};
