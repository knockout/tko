
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

export class JsxObserver extends LifeCycle {
  constructor (jsxOrObservable, parentNode, insertBefore = null, xmlns, $context) {
    super()

    const parentNodeTarget = 'content' in parentNode
      ? parentNode.content
      : parentNode

    if (isObservable(jsxOrObservable)) {
      jsxOrObservable.extend({trackArrayChanges: true})
      this.subscribe(jsxOrObservable, this.observableArrayChange, 'arrayChange')

      if (!insertBefore) {
        insertBefore = document.createComment('O')
      }

      if (insertBefore.parentNode !== parentNodeTarget) {
        parentNodeTarget.insertBefore(insertBefore, null)
      }
    }

    this.anchorTo(insertBefore || parentNode)

    Object.assign(this, {
      $context,
      insertBefore,
      parentNode,
      parentNodeTarget,
      xmlns,
      nodeArrayOrObservableAtIndex: [],
      subscriptionsForNode: new Map()
    })

    const jsx = unwrap(jsxOrObservable)

    if (jsx !== null && jsx !== undefined) {
      this.observableArrayChange(this.createInitialAdditions(jsx))
    }
  }

  dispose () {
    super.dispose()
    this.parentNodeTarget.remove(this.insertBefore)
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
    for (const change of changes) {
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
      this.applyBindingsToNodeOrArray(nodeArrayOrObservable)
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

  applyBindingsToNodeOrArray (nodeOrArray) {
    const {$context} = this
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
