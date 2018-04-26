//
// Prototype Functions
//
import { extend } from './object.js'
import options from './options.js'

var protoProperty = options.protoProperty

export var canSetPrototype = ({ __proto__: [] } instanceof Array)

export function setPrototypeOf (obj, proto) {
  obj.__proto__ = proto
  return obj
}

export var setPrototypeOfOrExtend = canSetPrototype ? setPrototypeOf : extend
