
import {LifeCycle} from '@tko/lifecycle'

import {
  removeNode
} from '@tko/utils'

import {
  applyBindings, contextFor
} from '@tko/bind'

import {
  isObservable, unwrap,
} from '@tko/observable'

import {
  NativeProvider
} from '@tko/provider.native'

export const ORIGINAL_JSX_SYM = Symbol('Knockout - Original JSX')

const NAMESPACES = {
  svg: 'http://www.w3.org/2000/svg',
  html: 'http://www.w3.org/1999/xhtml'
}

/**
 * JSX object from a pre-processor.
 * @typedef {Object} JSX
 * @property {string} elementName becomes the `tagName`
 * @property {Array.<JSX>} children
 * @property {object} attributes
 */

/**
 * Observe a variety of possible cases from JSX, modifying the
 * `parentNode` at `insertBefore` with the result.
 */
export class JsxObserver extends LifeCycle {
  /**
   * @param {any} jsxOrObservable take a long list of permutations
   */
  constructor (jsxOrObservable, parentNode, insertBefore = null, xmlns, $context) {
    super()

    const parentNodeIsComment = parentNode.nodeType === 8

    const parentNodeTarget = this.getParentTarget(parentNode)

    if (isObservable(jsxOrObservable)) {
      jsxOrObservable.extend({trackArrayChanges: true})
      this.subscribe(jsxOrObservable, this.observableArrayChange, 'arrayChange')

      if (!insertBefore) {
        const insertAt = parentNodeIsComment ? parentNode.nextSibling : null
        insertBefore = document.createComment('O')
        parentNodeTarget.insertBefore(insertBefore, insertAt)
      }
    }

    if (parentNodeIsComment && !insertBefore) {
      // Typcially: insertBefore becomes <!-- /ko -->
      insertBefore = parentNode.nextSibling
    }

    this.anchorTo(insertBefore || parentNode)

    Object.assign(this, {
      insertBefore,
      parentNode,
      parentNodeTarget,
      xmlns,
      $context,
      nodeArrayOrObservableAtIndex: [],
      subscriptionsForNode: new Map()
    })

    const jsx = unwrap(jsxOrObservable)

    if (jsx !== null && jsx !== undefined) {
      this.observableArrayChange(this.createInitialAdditions(jsx))
    }
  }

  /**
   * @param {HMTLElement|Comment|HTMLTemplateElement} parentNode
   */
  getParentTarget (parentNode) {
    if ('content' in parentNode) { return parentNode.content }
    if (parentNode.nodeType === 8) { return parentNode.parentNode }
    return parentNode
  }

  dispose () {
    super.dispose()
    const ib = this.insertBefore
    const insertBeforeIsChild = ib && this.parentNodeTarget === ib.parentNode
    if (insertBeforeIsChild) {
      this.parentNodeTarget.removeChild(ib)
    }
    this.removeAllPriorNodes()
  }

  createInitialAdditions (possibleIterable) {
    const status = 'added'
    if (typeof possibleIteratable === 'object' &&
      posibleIterable !== null &&
      Symbol.iterator in possibleIterable) {
      possibleIterable = [...possibleIterable]
    }

    return Array.isArray(possibleIterable)
      ? possibleIterable.map((value, index) => ({ index, status, value }))
      : [{ status, index: 0, value: possibleIterable }]
  }

  /**
   * Note: array change notification indexes are:
   *   - to the original array indexes for deletes
   *   - to the new array indexes for adds
   *   - sorted by index in ascending order
   */
  observableArrayChange (changes) {
    let adds = []
    let dels = []
    for (const index in changes) {
      const change = changes[index]
      if (change.status === 'added') {
        adds.push([change.index, change.value])
      } else {
        dels.unshift([change.index, change.value])
      }
    }
    dels.forEach(change => this.delChange(...change))
    adds.forEach(change => this.addChange(...change))
  }

  /**
   * Add a change at the given index.
   *
   * @param {int} index
   * @param {string|object|Array|Observable.string|Observable.Array|Obseravble.object} jsx
   */
  addChange (index, jsx) {
    let nodeArrayOrObservable

    if (isObservable(jsx)) {
      const nextNode = this.lastNodeFor(index)
      const {parentNode, xmlns} = this
      nodeArrayOrObservable = [new JsxObserver(jsx, parentNode, nextNode, xmlns)]
    } else {
      if (Array.isArray(jsx)) {
        nodeArrayOrObservable = jsx.map(j => this.jsxToNode(j))
      } else {
        nodeArrayOrObservable = [this.jsxToNode(jsx)]
      }
      const insertBefore = this.lastNodeFor(index)

      for (const node of nodeArrayOrObservable) {
        this.parentNodeTarget.insertBefore(node, insertBefore)
      }

      if (!this.parentNode.content) {
        this.applyBindingsToNodeOrArray(nodeArrayOrObservable)
      }
    }

    this.nodeArrayOrObservableAtIndex.splice(index, 0,
      nodeArrayOrObservable)
  }

  /**
   * True when Node is a type suitable for applyBindings
   * @param {Node} node
   */
  canApplyBindings (node) {
    return node.nodeType === 1 || node.nodeType === 8
  }

  getContext () {
    if (typeof this.$context === 'function') { return this.$context() }
    if (this.$context) { return this.$context }
    return contextFor(this.parentNode)
  }

  applyBindingsToNodeOrArray (nodeOrArray) {
    const $context = this.getContext()
    if (!$context) { return }

    if (Array.isArray(nodeOrArray)) {
      for (const node of nodeOrArray.filter(this.canApplyBindings)) {
        applyBindings($context, node)
      }
    } else if (canApplyBindings(nodeOrArray)) {
      applyBindings($context, nodeOrArray)
    }
  }

  delChange (index) {
    this.removeNodeArrayOrObservable(
      this.nodeArrayOrObservableAtIndex[index])
    this.nodeArrayOrObservableAtIndex.splice(index, 1)
  }

  getSubscriptionsForNode (node) {
    if (!this.subscriptionsForNode.has(node)) {
      const subscriptions = []
      this.subscriptionsForNode.set(node, subscriptions)
      return subscriptions
    }
    return this.subscriptionsForNode.get(node)
  }

  jsxToNode (jsx) {
    if (typeof jsx === 'string') {
      return document.createTextNode(jsx)
    }
    if (jsx === null || jsx === undefined) {
      return document.createComment(String(jsx))
    }
    if (jsx instanceof Node) {
      if (ORIGINAL_JSX_SYM in jsx) {
        jsx = jsx[ORIGINAL_JSX_SYM]
      } else {
        return jsx.cloneNode(true)
      }
    }

    const xmlns = jsx.attributes.xmlns || NAMESPACES[jsx.elementName] || this.xmlns
    const node = document.createElementNS(xmlns || NAMESPACES.html, jsx.elementName)

    const subscriptions = this.getSubscriptionsForNode(node)

    /** Slots need to be able to replicate with the attributes, which
     *  are not preserved when cloning from template nodes. */
    node[ORIGINAL_JSX_SYM] = jsx

    if (isObservable(jsx.attributes)) {
      subscriptions.push(
        jsx.attributes.subscribe(attrs => {
          this.updateAttributes(node, unwrap(attrs))
        })
      )
    }
    this.updateAttributes(node, unwrap(jsx.attributes))

    this.addDisposable(new JsxObserver(jsx.children, node, null, xmlns))

    return node
  }

  updateAttributes (node, attributes) {
    const subscriptions = this.getSubscriptionsForNode(node)

    while (node.attributes.length) {
      node.removeAttributeNS(null, node.attributes[0].name)
    }

    for (const [name, value] of Object.entries(attributes || {})) {
      if (isObservable(value)) {
        subscriptions.push(
          value.subscribe(attr => this.setNodeAttribute(node, name, value))
        )
      }
      this.setNodeAttribute(node, name, value)
    }
  }

  /**
   *
   * @param {HTMLElement} node
   * @param {string} name
   * @param {any} valueOrObservable
   */
  setNodeAttribute (node, name, valueOrObservable) {
    const value = unwrap(valueOrObservable)
    NativeProvider.addValueToNode(node, name, valueOrObservable)
    if (typeof value === 'string') {
      node.setAttributeNS(null, name, value)
    } else if (value === undefined) {
      node.removeAttributeNS(null, name)
    }
  }

  /**
   * @param {int} index
   * @return {Comment} that immediately precedes this.
   */
  lastNodeFor (index) {
    const nodesAtIndex = this.nodeArrayOrObservableAtIndex[index] || []
    const [lastNodeOfPrior] = nodesAtIndex.slice(-1)
    return lastNodeOfPrior || this.insertBefore
  }

  removeAllPriorNodes () {
    const {nodeArrayOrObservableAtIndex} = this
    while (nodeArrayOrObservableAtIndex.length) {
      this.removeNodeArrayOrObservable(nodeArrayOrObservableAtIndex.pop())
    }
  }

  removeNodeArrayOrObservable (nodeArrayOrObservable) {
    for (const nodeOrObservable of nodeArrayOrObservable) {
      if (nodeOrObservable instanceof JsxObserver) {
        nodeOrObservable.dispose()
        continue
      }
      const node = nodeOrObservable
      removeNode(node)
      const subscriptions = this.subscriptionsForNode.get(node) || []
      subscriptions.forEach(s => s.dispose())
      this.subscriptionsForNode.delete(node)
    }
  }
}

export default JsxObserver
