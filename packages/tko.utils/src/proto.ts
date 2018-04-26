//
// Prototype Functions
//
import { extend } from './object.js';
import options from './options.js';

const protoProperty = options.protoProperty;

export const canSetPrototype = ({ __proto__: [] } instanceof Array);

export function setPrototypeOf(obj: any, proto: any) {
  obj.__proto__ = proto;
  return obj;
}

export const setPrototypeOfOrExtend = canSetPrototype ? setPrototypeOf : extend;
