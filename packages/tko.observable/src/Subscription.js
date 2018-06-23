
import {
  removeDisposeCallback, addDisposeCallback
} from 'tko.utils'


export default class Subscription {
  constructor (target, observer, disposeCallback) {
    this._target = target
    this._callback = observer.next
    this._disposeCallback = disposeCallback
    this._isDisposed = false
    this._domNodeDisposalCallback = null
  }

  dispose () {
    if (this._domNodeDisposalCallback) {
      removeDisposeCallback(this._node, this._domNodeDisposalCallback)
    }
    this._isDisposed = true
    this._disposeCallback()
  }

  disposeWhenNodeIsRemoved (node) {
    this._node = node
    addDisposeCallback(node, this._domNodeDisposalCallback = this.dispose.bind(this))
  }

  // TC39 Observable API
  unsubscribe () { this.dispose() }
  get closed () { return this._isDisposed }
}
