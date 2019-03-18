
import {
  removeDisposeCallback, DisposeCallback, addDisposeCallback
} from '@tko/utils'

import { SUBSCRIBABLE_SYM } from './subscribableSymbol'
export const LATEST_VALUE = Symbol('Knockout latest value')

export interface Subscribable<T> {
  _versionNumber: number
  _subscriptions: Record<string, Subscription<T>[]>
  [SUBSCRIBABLE_SYM]: boolean
  [LATEST_VALUE]: T
  [Symbol.observable]: Subscribable<T>

  init: (instance: Subscribable<T>) => void
  equalityComparer: (oldValue: T, newValue: T) => boolean
  afterSubscriptionRemove: (event: string) => void
  beforeSubscriptionAdd: (event: string) => void
  subscribe: (callback, callbackTarget?, event?: string) => Subscription<T>
}

export default class Subscription<T> {
  private _domNodeDisposalCallback: null|DisposeCallback
  private _node: null|Node
  private _isDisposed: boolean
  private _disposeCallback: DisposeCallback
  private _callback: null|((value: T) => void)
  private _target: any

  constructor (target: Subscribable<T>, observer, disposeCallback: DisposeCallback) {
    this._target = target
    this._callback = observer.next
    this._disposeCallback = disposeCallback
    this._domNodeDisposalCallback = null
    this._node = null
    this._isDisposed = false
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
  unsubscribe () : void { this.dispose() }
  get closed () : boolean { return this._isDisposed }
}
