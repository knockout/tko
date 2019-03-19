
import {
  removeDisposeCallback, DisposeCallback, addDisposeCallback
} from '@tko/utils'
import { ISubscribable } from './subscribable'

export const LATEST_VALUE = Symbol('Knockout latest value')

export default class Subscription<T> {
  private _domNodeDisposalCallback: null|DisposeCallback
  private _node: null|Node
  private _isDisposed: boolean
  private _callback: null|((value: T) => void)

  constructor (
    private _target: ISubscribable<T>,
    observer,
    private _disposeCallback: DisposeCallback
  ) {
    this._callback = observer.next
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
