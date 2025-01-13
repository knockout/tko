
import {
  removeDisposeCallback, addDisposeCallback
} from '@tko/utils'

import { Subscription as SubscriptionType } from "../types/Observable";

export default class Subscription implements SubscriptionType{
  private _disposeCallback: any
  private _target: any
  private _callback: any
  private _isDisposed: boolean
  private _domNodeDisposalCallback: null
  private _node: Node
  
  constructor (target, observer, disposeCallback) {
    this._target = target
    this._callback = observer.next
    this._disposeCallback = disposeCallback
    this._isDisposed = false
    this._domNodeDisposalCallback = null
  }

  dispose (): void {
    if (this._domNodeDisposalCallback) {
      removeDisposeCallback(this._node, this._domNodeDisposalCallback)
    }
    this._isDisposed = true
    this._disposeCallback()
  }

  disposeWhenNodeIsRemoved (node: Node): void {
    this._node = node
    addDisposeCallback(node, this._domNodeDisposalCallback = this.dispose.bind(this))
  }

  // TC39 Observable API
  unsubscribe () { this.dispose() }
  get closed () { return this._isDisposed }
}
