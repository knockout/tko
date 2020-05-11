
import { LifeCycle } from '@tko/lifecycle'

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
  NativeProvider, setNativeBindings, getNativeBindings, NativeBindingNodes,
} from '@tko/provider.native'

import {
  queueCleanNode
} from './jsxClean'

import type {
  JsxNodeable, JsxNodeAttribute, JsxObject,
} from './types'

export const ORIGINAL_JSX_SYM = Symbol('Knockout - Original JSX')

type MaybeObservable<T> = KnockoutObservable<T> | T
type JsxAttributes = Record<string, MaybeObservable<JsxNodeAttribute>>
type Trackable = NativeBindingNodes | JsxObserver
type TrackedAtIndex = Trackable | (() => Trackable) | TrackedAtIndex[]

interface Disposable { dispose(): void }

const NAMESPACES = {
  svg: 'http://www.w3.org/2000/svg',
  html: 'http://www.w3.org/1999/xhtml',
  xml: 'http://www.w3.org/XML/1998/namespace',
  xlink: 'http://www.w3.org/1999/xlink',
  xmlns: 'http://www.w3.org/2000/xmlns/'
} as const

const isNamespace = (s: string): s is keyof typeof NAMESPACES => s in NAMESPACES
const namespaceOrNull = (s: string) => isNamespace(s) ? NAMESPACES[s] : null

function isIterableElement (v: JsxNodeable): v is { [Symbol.iterator]: () => Generator<Element> } {
  return isIterable<Element>(v)
}

function isIterable<T>(v: any): v is { [Symbol.iterator]: () => Generator<T> } {
  if (!v || typeof v !== 'object') { return false }
  return typeof v[Symbol.iterator] === 'function'
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
  adoptedInsertBefore: boolean
  insertBefore: Node
  nodeArrayOrObservableAtIndex: TrackedAtIndex[]
  noInitialBinding: boolean
  parentNode: Node
  parentNodeTarget: Node
  subscriptionsForNode: Map<Node, Disposable[]>
  xmlns: string

  /**
   * @param {any} jsxOrObservable take a long list of permutations
   */
  constructor (
    jsxOrObservable: JsxNodeable,
    parentNode: Node,
    insertBefore: Node | null = null,
    xmlns?: string,
    noInitialBinding?: boolean
  ) {
    super()

    const parentNodeIsComment = parentNode.nodeType === 8

    const parentNodeTarget = this.getParentTarget(parentNode)

    if (isObservable(jsxOrObservable)) {
      jsxOrObservable.extend({ trackArrayChanges: true })
      this.subscribe(jsxOrObservable, this.observableArrayChange, 'arrayChange')

      if (!insertBefore) {
        const insertAt = parentNodeIsComment ? parentNode.nextSibling : null
        insertBefore = this.createComment('O')
        parentNodeTarget!.insertBefore(insertBefore, insertAt)
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
  getParentTarget (parentNode: Node | Element | Comment | HTMLTemplateElement) {
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

  /**
   * Add the initial nodes.  Iterate over any generator.
   */
  createInitialAdditions (possibleIterable: JsxNodeable): KnockoutArrayChange<any>[] {
    const status = 'added'
    const iter = isIterable(possibleIterable) ? [...possibleIterable] : null

    return Array.isArray(iter)
      ? iter.map((value, index) => ({ index, status, value }))
      : [{ status, index: 0, value: possibleIterable }]
  }

  /**
   * Note: array change notification indexes are:
   *   - to the original array indexes for deletes
   *   - to the new array indexes for adds
   *   - sorted by index in ascending order
   */
  observableArrayChange (changes: KnockoutArrayChange<any>[]) {
    type DeltaList = [number, JsxNodeable][]
    const adds = [] as DeltaList
    const dels = [] as DeltaList
    for (const index in changes) {
      const change = changes[index]
      if (change.status === 'added') {
        adds.push([change.index, change.value])
      } else {
        dels.unshift([change.index, change.value])
      }
    }
    dels.forEach(([index]) => this.delChange(index))
    adds.forEach(change => this.addChange(...change))
  }

  /**
   * Add a change at the given index.
   *
   * @param {int} index
   * @param {string|object|Array|Observable.string|Observable.Array|Obseravble.object} jsx
   */
  addChange (index: number, jsx: JsxNodeable) {
    this.nodeArrayOrObservableAtIndex.splice(index, 0,
      this.injectNode(jsx, this.lastNodeFor(index)))
  }

  injectNode (
    jsx: JsxNodeable,
    nextNode: NativeBindingNodes,
  ): Trackable[] {

    if (isObservable(jsx)) {
      const {parentNode, xmlns} = this
      const observer = new JsxObserver(jsx, parentNode, nextNode, xmlns, this.noInitialBinding)
      return [observer]
    } else if (isIterableElement(jsx)) {
      const nodeArrayOrObservable = [] as Trackable[]
      for (const child of jsx) {
        nodeArrayOrObservable.unshift(...this.injectNode(child, nextNode))
      }
      return nodeArrayOrObservable
    }

    let nodeArrayOrObservable = [] as NativeBindingNodes[]
    const $context = contextFor(this.parentNode)
    const isInsideTemplate = 'content' in this.parentNode
    const shouldApplyBindings = $context && !isInsideTemplate && !this.noInitialBinding

    if (isIterableElement(jsx)) {
      nodeArrayOrObservable = [...jsx].map(j => this.anyToNode(j))
    } else {
      nodeArrayOrObservable = [this.anyToNode(jsx)]
    }

    for (const node of nodeArrayOrObservable) {
      this.parentNodeTarget.insertBefore(node, nextNode)
      if (shouldApplyBindings && this.canApplyBindings(node)) {
        applyBindings($context, node)
      }
    }
    return nodeArrayOrObservable
  }

  /**
   * True when Node is a type suitable for applyBindings i.e. a HTMLElement
   * or a Comment.
   * @param {Node} node
   */
  canApplyBindings (node: Node) {
    return node.nodeType === 1 || node.nodeType === 8
  }

  delChange (index: number) {
    this.removeNodeArrayOrObservable(
      this.nodeArrayOrObservableAtIndex[index])
    this.nodeArrayOrObservableAtIndex.splice(index, 1)
  }

  getSubscriptionsForNode (node: Node) {
    if (!this.subscriptionsForNode.has(node)) {
      const subscriptions = [] as Disposable[]
      this.subscriptionsForNode.set(node, subscriptions)
      return subscriptions
    }
    return this.subscriptionsForNode.get(node) as Disposable[]
  }

  isJsx (jsx: any): jsx is JsxObject {
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
  anyToNode (any: JsxNodeable): Comment | Element | Text {
    if (isThenable(any)) { return this.futureJsxNode(any) }

    switch (typeof any) {
      case 'object':
        if (any instanceof Error) { return this.createComment(any.toString()) }
        if (any === null) { return this.createComment(String(any)) }
        if (any instanceof Node) { return this.cloneJSXorMoveNode(any) }
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

  createComment (string: string) {
    return setNativeBindings(document.createComment(string), true)
  }

  createTextNode (string: string) {
    return setNativeBindings(document.createTextNode(string), true)
  }

  /**
   * Clone a node; if that node was originally from JSX, we clone from there
   * so we preserve binding handlers.
   *
   * @param {HTMLElement} node
   */
  cloneJSXorMoveNode (node: NativeBindingNodes) {
    return ORIGINAL_JSX_SYM in node
      ? this.jsxToNode(node[ORIGINAL_JSX_SYM])
      : node
  }

  /**
   * @param {JSX} jsx to convert to a node.
   */
  jsxToNode (jsx: JsxObject) {
    const xmlns = (
      jsx.attributes.xmlns || namespaceOrNull(jsx.elementName) || this.xmlns
    ) as string
    const node = document.createElementNS(xmlns || NAMESPACES.html, jsx.elementName)

    /** Slots need to be able to replicate with the attributes, which
     *  are not preserved when cloning from template nodes. */
    setNativeBindings(node, jsx)

    if (isObservable(jsx.attributes)) {
      const subscriptions = this.getSubscriptionsForNode(node)
      subscriptions.push(
        jsx.attributes.subscribe((attrs: JsxAttributes) => {
          this.updateAttributes(node, unwrap(attrs))
        }))
    }

    this.updateAttributes(node, unwrap(jsx.attributes))
    this.addDisposable(
      new JsxObserver(jsx.children, node, null, xmlns, this.noInitialBinding))
    return node
  }

  futureJsxNode (future: JsxNodeable) {
    const obs = observable()
    Promise.resolve(future)
      .then(obs)
      .catch((e: Error) => obs(e instanceof Error ? e : Error(e)))
    const jo = new JsxObserver(obs, this.parentNode, null, this.xmlns, this.noInitialBinding)
    this.addDisposable(jo)
    return jo.insertBefore as Comment | Text | Element
  }

  updateAttributes (node: Element, attributes: JsxAttributes) {
    const subscriptions = this.getSubscriptionsForNode(node)
    const toRemove = new Set(Array.from(node.attributes).map(n => n.name))

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
  getNamespaceOfAttribute (attr: string) {
    const [prefix, ...unqualifiedName] = attr.split(':')
    if (prefix === 'xmlns' || (unqualifiedName.length && isNamespace(prefix))) {
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
  setNodeAttribute (
    node: Element,
    name: string,
    valueOrObservable?: MaybeObservable<any>,
  ) {
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
  lastNodeFor (index: number) {
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

  removeNodeArrayOrObservable (
    nodeArrayOrObservable: TrackedAtIndex
  ) {
    for (const nodeOrObservable of nodeArrayOrObservable) {
      if (nodeOrObservable instanceof JsxObserver) {
        nodeOrObservable.dispose()
        continue
      }
      const node = typeof nodeOrObservable === 'function' ? nodeOrObservable() : nodeOrObservable
      delete (node as any)[ORIGINAL_JSX_SYM]
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
  detachAndDispose (node: NativeBindingNodes) {
    if (isIterableElement(node)) {
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
