/**
 * Create an ES
 */

import {
  observable, observableArray, unwrap
} from 'tko.observable'

import {
  computed
} from './computed.js'

const PROXY_SYM = Symbol('Knockout Proxied Object')
const MIRROR_SYM = Symbol('Knockout Proxied Observables')

function makeComputed (fn) {
  return computed({
    read: fn,
    write: fn,
    pure: 'pure' in fn ? fn.pure : true,
    deferEvaluation: 'deferEvaluation' in fn ? fn.deferEvaluation : true
  }).extend({ deferred: true })
}

function setOrCreate (mirror, prop, value) {
  if (!mirror[prop]) {
    const ctr = Array.isArray(value) ? observableArray
      : typeof value === 'function' ? makeComputed
      : observable
    mirror[prop] = ctr(value)
  } else {
    mirror[prop](value)
  }
}

export function proxy (object) {
  const mirror = { [PROXY_SYM]: object }
  mirror[MIRROR_SYM] = mirror
  for (const key of Object.keys(object)) {
    setOrCreate(mirror, key, object[key])
  }
  return new Proxy(object, {
    has (target, prop) { return prop in mirror },
    get (target, prop) { return unwrap(mirror[prop]) },
    set (target, prop, value, receiver) {
      setOrCreate(mirror, prop, value)
      target[prop] = value
      return true
    },
    deleteProperty (property) {
      delete mirror[property]
      return delete object[property]
    },
    getPrototypeOf () { return Object.getPrototypeOf(object) },
    setPrototypeOf (target, proto) { return Object.setPrototypeOf(object, proto) },
    defineProperty (target, prop, desc) { return Object.defineProperty(object, prop, desc) },
    preventExtensions () { return Object.preventExtensions(object) },
    isExtensible () { return Object.isExtensible(object) },
    ownKeys () { return [...Object.getOwnPropertyNames(object), ...Object.getOwnPropertySymbols(object)] }
  })
}

export function getObservable (proxied, prop) { return proxied[MIRROR_SYM][prop] }
export function peek (proxied, prop) { return proxied[PROXY_SYM][prop] }
export function isProxied (proxied) { return PROXY_SYM in proxied }
export function unproxy (proxied) { return proxied[PROXY_SYM] }

Object.assign(proxy, { getObservable, peek, isProxied, unproxy })
