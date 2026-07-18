import { domData, addDisposeCallback, removeDisposeCallback, arrayRemoveItem } from '@tko/utils'
import { subscribable, dependencyDetection } from '@tko/observable'
import type { Subscribable, Subscription } from '@tko/observable'
import type { BindingContext } from './bindingContext'

export const contextAncestorBindingInfo = Symbol('_ancestorBindingInfo')
const boundElementDomDataKey = domData.nextKey()

interface BindingInfo {
  eventSubscribable?: Subscribable
  notifiedEvents?: Record<string, boolean>
  asyncContext?: AsyncCompleteContext | null
}

function asyncContextDispose(node: Node): void {
  const bindingInfo = domData.get(node, boundElementDomDataKey) as BindingInfo | undefined
  const asyncContext = bindingInfo && bindingInfo.asyncContext
  if (asyncContext) {
    bindingInfo!.asyncContext = null
    asyncContext.notifyAncestor()
  }
}

/**
 * Per-node bookkeeping of pending asynchronously-completing descendants.
 * Ported from Knockout 3.5 (`src/binding/bindingAttributeSyntax.js`); it lets
 * `descendantsComplete` fire once a node's children *and* every async descendant
 * (components, conditionals held open by `completeOn: "render"`) have bound.
 */
class AsyncCompleteContext {
  node: Node
  bindingInfo: BindingInfo
  asyncDescendants: Node[] = []
  childrenComplete = false
  ancestorBindingInfo?: BindingInfo

  constructor(node: Node, bindingInfo: BindingInfo, ancestorBindingInfo?: BindingInfo) {
    this.node = node
    this.bindingInfo = bindingInfo

    if (!bindingInfo.asyncContext) {
      addDisposeCallback(node, asyncContextDispose)
    }

    if (ancestorBindingInfo && ancestorBindingInfo.asyncContext) {
      ancestorBindingInfo.asyncContext.asyncDescendants.push(node)
      this.ancestorBindingInfo = ancestorBindingInfo
    }
  }

  notifyAncestor(): void {
    if (this.ancestorBindingInfo && this.ancestorBindingInfo.asyncContext) {
      this.ancestorBindingInfo.asyncContext.descendantComplete(this.node)
    }
  }

  descendantComplete(node: Node): void {
    arrayRemoveItem(this.asyncDescendants, node)
    if (!this.asyncDescendants.length && this.childrenComplete) {
      this.completeChildren()
    }
  }

  completeChildren(): void {
    this.childrenComplete = true
    if (this.bindingInfo.asyncContext && !this.asyncDescendants.length) {
      this.bindingInfo.asyncContext = null
      removeDisposeCallback(this.node, asyncContextDispose)
      bindingEvent.notify(this.node, bindingEvent.descendantsComplete)
      this.notifyAncestor()
    }
  }
}

export interface BindingEventSubscribeOptions {
  notifyImmediately?: boolean
}

export const bindingEvent = {
  //TODO better: String-Enum "BindingEventEnum"
  childrenComplete: 'childrenComplete',
  descendantsComplete: 'descendantsComplete',

  subscribe(
    node: Node,
    event: string | 'childrenComplete' | 'descendantsComplete',
    callback: (node: Node) => void,
    callbackContext?: any,
    options?: BindingEventSubscribeOptions
  ): Subscription {
    const bindingInfo = domData.getOrSet(node, boundElementDomDataKey, {}) as BindingInfo
    if (!bindingInfo.eventSubscribable) {
      bindingInfo.eventSubscribable = new subscribable()
    }
    if (options && options.notifyImmediately && bindingInfo.notifiedEvents && bindingInfo.notifiedEvents[event]) {
      dependencyDetection.ignore(callback, callbackContext, [node])
    }
    return bindingInfo.eventSubscribable.subscribe(callback, callbackContext, event)
  },

  notify(node: Node, event: string): void {
    const bindingInfo = domData.get(node, boundElementDomDataKey) as BindingInfo | undefined
    if (bindingInfo) {
      if (!bindingInfo.notifiedEvents) {
        bindingInfo.notifiedEvents = {}
      }
      bindingInfo.notifiedEvents[event] = true
      if (bindingInfo.eventSubscribable) {
        bindingInfo.eventSubscribable.notifySubscribers(node, event)
      }
      // Drive the async-completion bookkeeping once a node's direct children
      // have bound. TKO stays lenient here: KO throws when a descendantsComplete
      // subscription exists without an async context; we don't, because
      // `bindingEvent.subscribe` is public and works on any node.
      if (event === bindingEvent.childrenComplete && bindingInfo.asyncContext) {
        bindingInfo.asyncContext.completeChildren()
      }
    }
  },

  /**
   * Register `node` as (potentially) completing its content asynchronously.
   * Creates the node's `AsyncCompleteContext` (linking it into its ancestor's
   * pending set) and returns a binding context extended so descendant contexts
   * can find this node as their completion ancestor.
   */
  startPossiblyAsyncContentBinding(node: Node, bindingContext: BindingContext): BindingContext {
    const bindingInfo = domData.getOrSet(node, boundElementDomDataKey, {}) as BindingInfo

    if (!bindingInfo.asyncContext) {
      bindingInfo.asyncContext = new AsyncCompleteContext(node, bindingInfo, bindingContext[contextAncestorBindingInfo])
    }

    // If the provided context was already extended with this node's binding info, reuse it.
    if (bindingContext[contextAncestorBindingInfo] === bindingInfo) {
      return bindingContext
    }

    return bindingContext.extend(function (this: BindingContext) {
      this[contextAncestorBindingInfo] = bindingInfo
    } as any)
  }
}
