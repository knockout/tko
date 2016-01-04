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
