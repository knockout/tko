
import {
  removeDisposeCallback, addDisposeCallback
} from '@tko/utils'


export default class Subscription<T> {
  private _callback: (v: T) => void
  private _isDisposed = false
  private _domNodeDisposalCallback: () => void
  private _node: Element

  constructor (
    private _target: KnockoutSubscribable<T>,
    observer: { next: (v: T) => void },
    private _disposeCallback: () => void,
  ) {
    this._callback = observer.next
    this._isDisposed = false
  }

  callback (v: T) { this._callback(v) }

  dispose () {
    if (this._domNodeDisposalCallback) {
      removeDisposeCallback(this._node, this._domNodeDisposalCallback)
    }
    this._isDisposed = true
    this._disposeCallback()
  }

  disposeWhenNodeIsRemoved (node: Element) {
    this._node = node
    addDisposeCallback(node, this._domNodeDisposalCallback = this.dispose.bind(this))
  }

  // TC39 Observable API
  unsubscribe () { this.dispose() }
  get closed () { return this._isDisposed }
}
