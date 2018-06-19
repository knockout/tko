
import {
  cleanNode, removeNode, addDisposeCallback
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
      node.appendChild(convertJsxChildToDom(child))
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
        node.setAttribute(name, unwrap(attr))
      }))
    }
    node.setAttribute(name, unwrap(value))
  }
}

function monitorObservableChild (node, child) {
  const jsx = unwrap(child)
  let nodeToReplace = convertJsxChildToDom(jsx)

  console.log("Subscribing ...", child)
  child.subscribe(console.error)
  const subscription = child.subscribe(newJsx => {
    console.log("Updating child", newJsx)
    const newNode = convertJsxChildToDom(newJsx)
    const $context = contextFor(node)
    cleanNode(nodeToReplace)
    node.replaceChild(newNode, nodeToReplace)
    if ($context) {
      applyBindings(newNode, contextFor(node))
    }
    nodeToReplace = newNode
  })

  node.appendChild(nodeToReplace)
  return subscription
}

function convertJsxChildToDom (child) {
  return typeof child === 'string'
    ? document.createTextNode(child)
    : child ? jsxToNode(child)
      : document.createComment('[jsx placeholder]')
}
