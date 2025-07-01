'use strict'

import {
    addDisposeCallback, createSymbolOrString
} from '@tko/utils'

import {
    computed
} from '@tko/computed'

const SUBSCRIPTIONS = createSymbolOrString('LifeCycle Subscriptions List')
const ANCHOR_NODE = createSymbolOrString('LifeCycle Anchor Node')

export default class LifeCycle {
  // NOTE: For more advanced integration as an ES6 mixin, see e.g.:
  // http://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/

  /**
   * Copy the properties of the LifeCycle class to the target (or its prototype)
   *
   * NOTE: getOwnPropertyNames is needed to copy the non-enumerable properties.
   */
  static mixInto (Constructor) {
    const target = Constructor.prototype || Constructor
    const mixin = LifeCycle.prototype
    for (let prop of Object.getOwnPropertyNames(mixin)) {
      target[prop] = mixin[prop]
    }
  }

  subscribe (observable, action, subscriptionType) {
    if (typeof action === 'string') { action = this[action] }
    this.addDisposable(observable.subscribe(action, this, subscriptionType))
  }

  computed (params) {
    if (typeof params === 'string') {
      params = { read: this[params], write: this[params] }
    }

    if (typeof params === 'object') {
      params = Object.assign({ owner: this }, params)
    } else if (typeof params === 'function') {
      const proto = Object.getPrototypeOf(this)
      if (proto && proto[params.name] === params) { params = params.bind(this) }
      params = { read: params, write: params }
    } else {
      throw new Error('LifeCycle::computed not given a valid type.')
    }

    params.disposeWhenNodeIsRemoved = this[ANCHOR_NODE]
    return this.addDisposable(computed(params))
  }

  /**
   * Add an event listener for the given or anchored node.
   * @param {node} [node] (optional) The target node (otherwise the anchored node)
   * @param {string} [type] Event type
   * @param {function|string} [action] Either call the given function or `this[action]`
   * @param {object} [options] (optional) Passed as `options` to `node.addEventListener`
   */
  addEventListener (...args) {
    const node = args[0].nodeType ? args.shift() : this[ANCHOR_NODE]
    const [type, act, options] = args
    const handler = typeof act === 'string' ? this[act].bind(this) : act
    this.__addEventListener(node, type, handler, options)
  }

  __addEventListener (node, eventType, handler, options) {
    node.addEventListener(eventType, handler, options)
    function dispose () { node.removeEventListener(eventType, handler) }
    addDisposeCallback(node, dispose)
    this.addDisposable({ dispose })
  }

  anchorTo (nodeOrLifeCycle:Node|LifeCycle) {
    if ('addDisposable' in nodeOrLifeCycle) {
      nodeOrLifeCycle.addDisposable(this)
      this[ANCHOR_NODE] = null // re-anchor on `anchorTo` calls
    } else {
      this[ANCHOR_NODE] = nodeOrLifeCycle
      addDisposeCallback(nodeOrLifeCycle, () => this[ANCHOR_NODE] === nodeOrLifeCycle && this.dispose())
    }
  }

  dispose () {
    const subscriptions = this[SUBSCRIPTIONS] || []
    subscriptions.forEach(s => s.dispose())
    this[SUBSCRIPTIONS] = new Array()
    this[ANCHOR_NODE] = null
  }

  addDisposable (subscription) {
    const subscriptions = this[SUBSCRIPTIONS] || []
    if (!this[SUBSCRIPTIONS]) { this[SUBSCRIPTIONS] = subscriptions }
    if (typeof subscription.dispose !== 'function') {
      throw new Error('Lifecycle::addDisposable argument missing `dispose`.')
    }
    subscriptions.push(subscription)
    return subscription
  }
}
