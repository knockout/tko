
import {
  removeNode, addDisposeCallback
} from '@tko/utils'

import {
  isObservable, unwrap
} from '@tko/observable'

import {
  contextFor, applyBindings
} from '@tko/bind'

import {
  NativeProvider
} from '@tko/provider.native'

import JsxObserver from './JsxObserver'

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
export function maybeJsx (possibleJsx) {
  if (isObservable(possibleJsx)) { return true }
  const value = unwrap(possibleJsx)
  if (!value) { return false }
  if (value.elementName) { return true }
  if (!Array.isArray(value) || !value.length) { return false }
  if (value[0] instanceof window.Node) { return false }
  return true
}

function canApplyBindings (node) {
  return node.nodeType === 1 || node.nodeType === 8
}

/**
 * Clone a node from its original JSX if possible, otherwise using DOM cloneNode
 * This preserves any native attributes set by JSX.
 * @param {HTMLElemen} node
 * @return {HTMLElement} clone of node
 */
export function cloneNodeFromOriginal (node) {
  if (!node) { return [] }

  if (node[ORIGINAL_JSX_SYM]) {
    const possibleTemplate = jsxToNode(node[ORIGINAL_JSX_SYM])
    return [...possibleTemplate.content
      ? possibleTemplate.content.childNodes
      : possibleTemplate.childNodes]
  }

  if ('content' in node) {
    const clone = document.importNode(node.content, true)
    return [...clone.childNodes]
  }

  const nodeArray = Array.isArray(node) ? node : [node]
  return nodeArray.map(n => n.cloneNode(true))
}

/**
 * Use a JSX transpilation of the format created by babel-plugin-transform-jsx
 * @param {Object} jsx An object of the form
 *    { elementName: node-name e.g. "div",
 *      attributes: { "attr": "value", ... },
 *      children: [string | jsx]
 *    }
 */
export function jsxToNode (jsx, xmlns, node = document.createElement('div')) {
  const observer = new JsxObserver(jsx, node, null, xmlns)
  return node.childNodes[0]
}
