//
// Prototype Functions
//
import { extend } from './object.js'

var canSetPrototype = ({ __proto__: [] } instanceof Array);

export var canSetPrototype

export function setPrototypeOf(obj, proto) {
    obj.__proto__ = proto;
    return obj;
}

export var setPrototypeOfOrExtend = canSetPrototype ? setPrototypeOf : extend

export function hasPrototype(instance, prototype) {
    if ((instance === null) || (instance === undefined) || (instance[protoProperty] === undefined)) return false;
    if (instance[protoProperty] === prototype) return true;
    return hasPrototype(instance[protoProperty], prototype); // Walk the prototype chain
}


