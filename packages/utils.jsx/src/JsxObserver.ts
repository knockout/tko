
import {LifeCycle} from '@tko/lifecycle'

import {
  safeStringify, isThenable
} from '@tko/utils'

import {
  applyBindings, contextFor
} from '@tko/bind'

import {
  isObservable, unwrap, observable
} from '@tko/observable'

import {
  isComputed
} from '@tko/computed'

import {
  NativeProvider, NATIVE_BINDINGS
} from '@tko/provider.native'

import {
  queueCleanNode
} from './jsxClean'

export const ORIGINAL_JSX_SYM = Symbol('Knockout - Original JSX')

const NAMESPACES = {
  svg: 'http://www.w3.org/2000/svg',
  html: 'http://www.w3.org/1999/xhtml',
  xml: 'http://www.w3.org/XML/1998/namespace',
  xlink: 'http://www.w3.org/1999/xlink',
  xmlns: 'http://www.w3.org/2000/xmlns/'
}

function isIterable (v) {
  return v && typeof v[Symbol.iterator] === 'function'
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
  constructor (jsxOrObservable, parentNode, insertBefore = null, xmlns, noInitialBinding) {
    super()

    const parentNodeIsComment = parentNode.nodeType === 8

    const parentNodeTarget = this.getParentTarget(parentNode)

    if (isObservable(jsxOrObservable)) {
      jsxOrObservable.extend({ trackArrayChanges: true })
      this.subscribe(jsxOrObservable, this.observableArrayChange, 'arrayChange')

      if (!insertBefore) {
        const insertAt = parentNodeIsComment ? parentNode.nextSibling : null
        insertBefore = this.createComment('O')
        parentNodeTarget.insertBefore(insertBefore, insertAt)
      } else {
        this.adoptedInsertBefore = true
      }
    }

    if (parentNodeIsComment && !insertBefore) {
      // Typcially: insertBefore becomes <!-- /ko -->
      insertBefore = parentNode.nextSibling
      // Mark this so we don't remove the next node - since we didn't create it.
      this.adoptedInsertBefore = true
    }

    this.anchorTo(insertBefore || parentNode)

    Object.assign(this, {
      insertBefore,
      noInitialBinding,
      parentNode,
      parentNodeTarget,
      xmlns,
      nodeArrayOrObservableAtIndex: [],
      subscriptionsForNode: new Map(),
    })

    const jsx = unwrap(jsxOrObservable)
    const computed = isComputed(jsxOrObservable)

    if (computed || (jsx !== null && jsx !== undefined)) {
      this.observableArrayChange(this.createInitialAdditions(jsx))
    }
    this.noInitialBinding = false
  }

  /**
   * @param {HMTLElement|Comment|HTMLTemplateElement} parentNode
   */
  getParentTarget (parentNode) {
    if ('content' in parentNode) { return parentNode.content }
    if (parentNode.nodeType === 8) { return parentNode.parentNode }
    return parentNode
  }

  remove () { this.dispose() }
  dispose () {
    super.dispose()
    const ib = this.insertBefore
    const insertBeforeIsChild = ib && this.parentNodeTarget === ib.parentNode
    if (insertBeforeIsChild && !this.adoptedInsertBefore) {
      this.parentNodeTarget.removeChild(ib)
    }
    this.removeAllPriorNodes()
    Object.assign(this, {
      parentNode: null,
      parentNodeTarget: null,
      insertBefore: null,
      nodeArrayOrObservableAtIndex: []
    })
    for (const subscriptions of this.subscriptionsForNode.values()) {
      subscriptions.forEach(s => s.dispose())
    }
    this.subscriptionsForNode.clear()
  }

  createInitialAdditions (possibleIterable) {
    const status = 'added'
    if (typeof possibleIterable === 'object' &&
      possibleIterable !== null &&
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
   * @param {string|object|Array|Observable.string|Observable.Array|Observable.object} jsx
   */
  addChange (index, jsx) {
    this.nodeArrayOrObservableAtIndex.splice(index, 0,
      this.injectNode(jsx, this.lastNodeFor(index)))
  }

  injectNode (jsx, nextNode) {
    let nodeArrayOrObservable

    if (isObservable(jsx)) {
      const {parentNode, xmlns} = this
      const observer = new JsxObserver(jsx, parentNode, nextNode, xmlns, this.noInitialBinding)
      nodeArrayOrObservable = [observer]
    } else if (typeof jsx !== 'string' && isIterable(jsx)) {
      nodeArrayOrObservable = []
      for (const child of jsx) {
        nodeArrayOrObservable.unshift(
          this.injectNode(child, nextNode))
      }
    } else {
      const $context = contextFor(this.parentNode)
      const isInsideTemplate = 'content' in this.parentNode
      const shouldApplyBindings = $context && !isInsideTemplate && !this.noInitialBinding

      if (Array.isArray(jsx)) {
        nodeArrayOrObservable = jsx.map(j => this.anyToNode(j))
      } else {
        nodeArrayOrObservable = [this.anyToNode(jsx)]
      }

      for (const node of nodeArrayOrObservable) {
        this.parentNodeTarget.insertBefore(node, nextNode)
        if (shouldApplyBindings && this.canApplyBindings(node)) {
          applyBindings($context, node)
        }
      }
    }

    return nodeArrayOrObservable
  }

  /**
   * True when Node is a type suitable for applyBindings i.e. a HTMLElement
   * or a Comment.
   * @param {Node} node
   */
  canApplyBindings (node) {
    return node.nodeType === 1 || node.nodeType === 8
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

  isJsx (jsx) {
    return typeof jsx.elementName === 'string' &&
      'children' in jsx &&
      'attributes' in jsx
  }

  /**
   * @param {any} value acceptable to turn into a Node
   *
   * The one thing `any` cannot be here is an Array or Observable; both those
   * cases are handled with new JsxObservers.
   */
  anyToNode (any) {
    if (isThenable(any)) { return this.futureJsxNode(any) }

    switch (typeof any) {
      case 'object':
        if (any instanceof Error) {
          return this.createComment(any.toString())
        }
        if (any === null) {
          return this.createComment(String(any))
        }
        if (any instanceof Node) {
          return this.cloneJSXorMoveNode(any)
        }
        if (Symbol.iterator in any) {
          return any
        }
        break
      case 'function': return this.anyToNode(any())
      case 'undefined':
      case 'symbol':
        return this.createComment(String(any))
      case 'string': return this.createTextNode(any)
      case 'boolean':
      case 'number':
      case 'bigint':
      default:
        return this.createTextNode(String(any))
    }

    return this.isJsx(any)
      ? this.jsxToNode(any)
      : this.createComment(safeStringify(any))
  }

  createComment (string) {
    const node = document.createComment(string)
    node[NATIVE_BINDINGS] = true
    return node
  }

  createTextNode (string) {
    const node = document.createTextNode(string)
    node[NATIVE_BINDINGS] = true
    return node
  }

  /**
   * Clone a node; if that node was originally from JSX, we clone from there
   * so we preserve binding handlers.
   *
   * @param {HTMLElement} node
   */
  cloneJSXorMoveNode (node) {
    return ORIGINAL_JSX_SYM in node
      ? this.jsxToNode(node[ORIGINAL_JSX_SYM])
      : node
  }

  /**
   * @param {JSX} jsx to convert to a node.
   */
  jsxToNode (jsx) {
    const xmlns = jsx.attributes.xmlns || NAMESPACES[jsx.elementName] || this.xmlns
    const node = document.createElementNS(xmlns || NAMESPACES.html, jsx.elementName)

    /** Slots need to be able to replicate with the attributes, which
     *  are not preserved when cloning from template nodes. */
    node[ORIGINAL_JSX_SYM] = jsx

    if (isObservable(jsx.attributes)) {
      const subscriptions = this.getSubscriptionsForNode(node)
      subscriptions.push(
        jsx.attributes.subscribe(attrs => {
          this.updateAttributes(node, unwrap(attrs))
        }))
    }
    this.updateAttributes(node, unwrap(jsx.attributes))

    this.addDisposable(new JsxObserver(jsx.children, node, null, xmlns, this.noInitialBinding))

    return node
  }

  futureJsxNode (promise) {
    const obs = observable()
    promise.then(obs).catch(e => obs(e instanceof Error ? e : Error(e)))
    const jo = new JsxObserver(obs, this.parentNode, null, this.xmlns, this.noInitialBinding)
    this.addDisposable(jo)
    return jo.insertBefore
  }

  updateAttributes (node, attributes) {
    const subscriptions = this.getSubscriptionsForNode(node)
    const toRemove = new Set([...node.attributes].map(n => n.name))

    for (const [name, value] of Object.entries(attributes || {})) {
      toRemove.delete(name)
      if (isObservable(value)) {
        subscriptions.push(
          value.subscribe(attr => this.setNodeAttribute(node, name, value)))
      }
      this.setNodeAttribute(node, name, value)
    }

    for (const name of toRemove) {
      this.setNodeAttribute(node, name, undefined)
    }
  }

  /**
   * See https://stackoverflow.com/a/52572048
   * @param {string} attr element attribute
   * @return {string} namespace argument for setAtttributeNS
   */
  getNamespaceOfAttribute (attr) {
    const [prefix, ...unqualifiedName] = attr.split(':')
    if (prefix === 'xmlns' || (unqualifiedName.length && NAMESPACES[prefix])) {
      return NAMESPACES[prefix]
    }
    return null
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
    if (value === undefined) {
      node.removeAttributeNS(null, name)
    } else if (isThenable(valueOrObservable)) {
      Promise.resolve(valueOrObservable)
        .then(v => this.setNodeAttribute(node, name, v))
    } else {
      const ns = this.getNamespaceOfAttribute(name)
      node.setAttributeNS(ns, name, String(value))
    }
  }

  /**
   * @param {int} index
   * @return {Comment} that immediately precedes this.
   */
  lastNodeFor (index) {
    const nodesAtIndex = this.nodeArrayOrObservableAtIndex[index] || []
    const [lastNodeOfPrior] = nodesAtIndex.slice(-1)
    const insertBefore = lastNodeOfPrior instanceof JsxObserver
      ? lastNodeOfPrior.insertBefore : lastNodeOfPrior || this.insertBefore
    if (insertBefore) { return insertBefore.parentNode ? insertBefore : null }
    return null
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
      delete node[ORIGINAL_JSX_SYM]
      this.detachAndDispose(node)
      const subscriptions = this.subscriptionsForNode.get(node)
      if (subscriptions) {
        subscriptions.forEach(s => s.dispose())
        this.subscriptionsForNode.delete(node)
      }
    }
  }

  /**
   * Detach the given node, and dispose of its children.
   *
   * The cleaning can trigger a lot of garbage collection, so we defer that.
   */
  detachAndDispose (node) {
    if (isIterable(node)) {
      for (const child of node) {
        this.detachAndDispose(child)
      }
    } else {
      node.remove()
    }
    queueCleanNode(node)
  }
}

export default JsxObserver
