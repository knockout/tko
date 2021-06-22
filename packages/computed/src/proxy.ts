/**
 * Create an ES
 */

import {
  observable, observableArray, unwrap
} from '@tko/observable'

import {
  computed
} from './computed'

const PROXY_SYM = Symbol('Knockout Proxied Object')
const MIRROR_SYM = Symbol('Knockout Proxied Observables')

function makeComputed (proxy, fn) {
  return computed({
    owner: proxy,
    read: fn,
    write: fn,
    pure: 'pure' in fn ? fn.pure : true,
    deferEvaluation: 'deferEvaluation' in fn ? fn.deferEvaluation : true
  }).extend({ deferred: true })
}

function setOrCreate (mirror, prop, value, proxy) {
  if (!mirror[prop]) {
    const ctr = Array.isArray(value) ? observableArray
      : typeof value === 'function' ? makeComputed.bind(null, proxy)
      : observable
    mirror[prop] = ctr(value)
  } else {
    mirror[prop](value)
  }
}

function assignOrUpdate(mirror, object, proxy) {
  for (const key of Object.keys(object)) {
    setOrCreate(mirror, key, object[key], proxy)
  }
  return object
}

export function proxy (object) {
  const mirror = { [PROXY_SYM]: object }
  mirror[MIRROR_SYM] = mirror
  const proxy = new Proxy(function () {}, {
    has (target, prop) { return prop in mirror },
    get (target, prop) { return unwrap(mirror[prop]) },
    set (target, prop, value, receiver) {
      setOrCreate(mirror, prop, value, proxy)
      object[prop] = value
      return true
    },
    deleteProperty (property) {
      delete mirror[property]
      return delete object[property]
    },
    apply (target, thisArg, [props]) {
      if (props) {
        assignOrUpdate(mirror, props, proxy)
        return Object.assign(object, props)
      }
      return object
    },
    getPrototypeOf () { return Object.getPrototypeOf(object) },
    setPrototypeOf (target, proto) { return Object.setPrototypeOf(object, proto) },
    defineProperty (target, prop, desc) { return Object.defineProperty(object, prop, desc) },
    preventExtensions () { return Object.preventExtensions(object) },
    isExtensible () { return Object.isExtensible(object) },
    ownKeys () {
      return [...Object.getOwnPropertyNames(object),
              ...Object.getOwnPropertySymbols(object)]
    }
  })
  assignOrUpdate(mirror, object, proxy)
  return proxy
}

export function getObservable (proxied, prop) { return proxied[MIRROR_SYM][prop] }
export function peek (proxied, prop) { return getObservable(proxied, prop).peek() }
export function isProxied (proxied) { return PROXY_SYM in proxied }

Object.assign(proxy, { getObservable, peek, isProxied })
