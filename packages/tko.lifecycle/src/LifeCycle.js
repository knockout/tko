'use strict'


import {
    addDisposeCallback, createSymbolOrString
} from 'tko.utils'

import {
    computed
} from 'tko.computed'


const SUBSCRIPTIONS = createSymbolOrString('LifeCycle Subscriptions List')
const ANCHOR_NODE = createSymbolOrString('LifeCycle Anchor Node')


export default class LifeCycle {
  // NOTE: For more advanced integration as an ES6 mixin, see e.g.:
  // http://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/

  static mixInto(Constructor) {
    Object.assign(Constructor.prototype || Constructor, LifeCycle.prototype)
  }

  subscribe(observable, action) {
    if (typeof action === 'string') { action = this[action].bind(this) }
    this.addDisposable(observable.subscribe(action))
  }

  computed(params) {
    if (typeof params === 'string') {
      params = { read: this[params], write: this[params], owner: this }
    } else if (typeof params === 'object') {
      // Pass directly.
    } else if (typeof params === 'function') {
      params = { read: params, write: params }
    } else {
      throw new Error("LifeCycle::computed not given a valid type.")
    }
    params.disposeWhenNodeIsRemoved = this[ANCHOR_NODE]
    return this.addDisposable(computed(params))
  }

  addEventListener(...args) {
    const node = args[0].nodeType ? args.shift() : this[ANCHOR_NODE]
    const [type, act, options] = args
    const handler = typeof act === 'string' ? this[act].bind(this) : act
    this.__addEventListener(node, type, handler, options)
  }

  __addEventListener(node, event_type, handler, options) {
    node.addEventListener(event_type, action, options)
    function dispose() { node.removeEventListener(event_type, action) }
    addDisposeCallback(node, dispose)
    this.addDisposable({ dispose })
  }

  anchorTo(node) {
    addDisposeCallback(node, () => this.dispose())
    this[ANCHOR_NODE] = node
  }

  dispose() {
    const subscriptions = this[SUBSCRIPTIONS] || []
    subscriptions.forEach(s => s.dispose())
    this[SUBSCRIPTIONS] = []
    this[ANCHOR_NODE] = null

  }

  addDisposable(subscription) {
    const subscriptions = this[SUBSCRIPTIONS] || []
    if (!this[SUBSCRIPTIONS]) { this[SUBSCRIPTIONS] = subscriptions }
    if (typeof subscription.dispose !== 'function') {
      throw new Error("Lifecycle::addDisposable argument missing `dispose`.")
    }
    subscriptions.push(subscription)
    return subscription
  }

}