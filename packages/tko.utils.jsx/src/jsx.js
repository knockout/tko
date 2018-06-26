
import {
  removeNode, addDisposeCallback
} from 'tko.utils'

import {
  isObservable, unwrap
} from 'tko.observable'

import {
  contextFor, applyBindings
} from 'tko.bind'

/**
 * Use a JSX transpilation of the format created by babel-plugin-transform-jsx
 * @param {Object} jsx An object of the form
 *    { elementName: node-name e.g. "div",
 *      attributes: { "attr": "value", ... },
 *      children: [string | jsx]
 *    }
 */
export function jsxToNode (jsx) {
  const node = document.createElement(jsx.elementName)
  const subscriptions = []

  updateAttributes(node, unwrap(jsx.attributes), subscriptions)
  if (isObservable(jsx.attributes)) {
    subscriptions.push(jsx.attributes.subscribe(attrs => {
      updateAttributes(node, unwrap(attrs), subscriptions)
    }))
  }

  updateChildren(node, unwrap(jsx.children), subscriptions)
  if (isObservable(jsx.children)) {
    subscriptions.push(jsx.children.subscribe(children => {
      updateChildren(node, children, subscriptions)
    }))
  }

  if (subscriptions.length) {
    addDisposeCallback(node, () => subscriptions.map(s => s.dispose()))
  }

  return node
}

function appendChildOrChildren (possibleTemplateElement, nodeToAppend) {
  if (Array.isArray(nodeToAppend)) {
    for (const node of nodeToAppend) {
      appendChildOrChildren(possibleTemplateElement, node)
    }
  } else if ('content' in possibleTemplateElement) {
    possibleTemplateElement.content.appendChild(nodeToAppend)
  } else {
    possibleTemplateElement.appendChild(nodeToAppend)
  }
}

/**
 *
 * @param {HTMLElement} node
 * @param {Array} children
 * @param {Array} subscriptions
 */
function updateChildren (node, children, subscriptions) {
  let lastChild = node.lastChild
  while (lastChild) {
    removeNode(lastChild)
    lastChild = node.lastChild
  }

  for (const child of children || []) {
    if (isObservable(child)) {
      subscriptions.push(monitorObservableChild(node, child))
    } else {
      appendChildOrChildren(node, convertJsxChildToDom(child))
    }
  }
}

/**
 *
 * @param {HTMLElement} node
 * @param {Object} attributes
 * @param {Array} subscriptions
 */
function updateAttributes (node, attributes, subscriptions) {
  while (node.attributes.length) {
    node.removeAttribute(node.attributes[0].name)
  }

  for (const [name, value] of Object.entries(attributes || {})) {
    if (isObservable(value)) {
      subscriptions.push(value.subscribe(attr => {
        if (attr === undefined) {
          node.removeAttribute(name)
        } else {
          node.setAttribute(name, attr)
        }
      }))
    }
    const unwrappedValue = unwrap(value)
    if (unwrappedValue !== undefined) {
      node.setAttribute(name, unwrappedValue)
    }
  }
}

/**
 *
 * @param {jsx} newJsx
 * @param {HTMLElement|Array} toReplace
 * @return {HTMLElement|Array} Nodes to replace next time
 *
 * TODO: Use trackArrayChanges to minimize changes to the DOM and state-loss.
 */
function replaceNodeOrNodes (newJsx, toReplace, parentNode) {
  const newNodeOrNodes = convertJsxChildToDom(newJsx)
  const $context = contextFor(toReplace)

  if (Array.isArray(toReplace)) {
    for (const node of toReplace) { removeNode(node) }
  } else {
    removeNode(toReplace)
  }
  appendChildOrChildren(parentNode, newNodeOrNodes)
  if ($context) { applyBindings($context, newNodeOrNodes) }
  return newNodeOrNodes
}

function monitorObservableChild (node, child) {
  const jsx = unwrap(child)
  let toReplace = convertJsxChildToDom(jsx)
  appendChildOrChildren(node, toReplace)

  const subscription = child.subscribe(newJsx => {
    toReplace = replaceNodeOrNodes(newJsx, toReplace, node)
  })

  return subscription
}

/**
 * Convert a child to the anticipated HTMLElement(s).
 * @param {string|array|jsx} child
 * @return {Array|Comment|HTMLElement}
 */
function convertJsxChildToDom (child) {
  return typeof child === 'string' ? document.createTextNode(child)
    : Array.isArray(child) ? child.map(convertJsxChildToDom)
      : child ? jsxToNode(child)
        : document.createComment('[jsx placeholder]')
}
