import { isObservable, unwrap } from '@tko/observable'

import { ORIGINAL_JSX_SYM } from './JsxObserver'

/**
 *
 * @param {any} possibleJsx Test whether this value is JSX.
 *
 * True for
 *    { elementName }
 *    [{elementName}]
 *    observable({elementName} | [])
 *
 * Any observable will return truthy if its value is an array that doesn't
 * contain HTML elements.  Template nodes should not be observable unless they
 * are JSX.
 *
 * There's a bit of guesswork here that we could nail down with more test cases.
 */
export function maybeJsx(possibleJsx) {
  if (isObservable(possibleJsx)) {
    return true
  }
  const value = unwrap(possibleJsx)
  if (!value) {
    return false
  }
  if (value.elementName) {
    return true
  }
  if (!Array.isArray(value) || !value.length) {
    return false
  }
  if (value[0] instanceof window.Node) {
    return false
  }
  return true
}

export function getOriginalJsxForNode(node) {
  return node[ORIGINAL_JSX_SYM]
}

/**
 * Convert JSX into an object that can be consumed by TKO.
 * Mimics React.createElement
 * @param {string} e tagName of the element
 * @param {object|null} a attributes of the element
 * @param  {...string|object} c children of the element
 */
export function createElement(elementName, attributes, ...children) {
  return elementName === Fragment
    ? children
    : { elementName: elementName, attributes: attributes || {}, children: [...children] }
}

export const Fragment = Symbol('JSX Fragment')
