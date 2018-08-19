
import {
  virtualElements, options
} from '@tko/utils'

import {
  dependencyDetection
} from '@tko/observable'

import {
  BindingHandler
} from './BindingHandler'

/**
 * We have no guarantees, for users employing legacy bindings,
 * that it has not been changed with a modification like
 *
 *    ko.bindingHandlers[name] = { init: ...}
 *
 * ... so we have to keep track by way of a map.
 */
const PossibleWeakMap = options.global.WeakMap || Map
const legacyBindingMap = new PossibleWeakMap()

export class LegacyBindingHandler extends BindingHandler {
  constructor (params) {
    super(params)
    const handler = this.handler
    this.onError = params.onError

    if (typeof handler.dispose === 'function') {
      this.addDisposable(handler)
    }

    try {
      this.initReturn = handler.init && handler.init(...this.legacyArgs)
    } catch (e) {
      params.onError('init', e)
    }
  }

  onValueChange () {
    const handler = this.handler
    if (typeof handler.update !== 'function') { return }
    try {
      handler.update(...this.legacyArgs)
    } catch (e) {
      this.onError('update', e)
    }
  }

  get legacyArgs () {
    return [
      this.$element, this.valueAccessor, this.allBindings,
      this.$data, this.$context
    ]
  }

  get controlsDescendants () {
    const objectToTest = this.initReturn || this.handler || {}
    return objectToTest.controlsDescendantBindings
  }

  /**
   * Create a handler instance from the `origin`, which may be:
   *
   * 1. an object (becomes LegacyBindingHandler)
   * 2. a function (becomes LegacyBindingHandler with `init: function`)
   *
   * If given an object (the only kind supported in knockout 3.x and before), it
   * shall draw the `init`, `update`, and `allowVirtualElements` properties
   */
  static getOrCreateFor (key, handler) {
    if (legacyBindingMap.has(handler)) {
      return legacyBindingMap.get(handler)
    }
    const newLegacyHandler = this.createFor(key, handler)
    legacyBindingMap.set(handler, newLegacyHandler)
    return newLegacyHandler
  }

  static createFor (key, handler) {
    if (typeof handler === 'function') {
      const [initFn, disposeFn] = [handler, handler.dispose]
      return class extends LegacyBindingHandler {
        get handler () {
          const init = initFn.bind(this)
          const dispose = disposeFn ? disposeFn.bind(this) : null
          return { init, dispose }
        }
        static get after () { return handler.after }
        static get allowVirtualElements () {
          return handler.allowVirtualElements || virtualElements.allowedBindings[key]
        }
      }
    }

    if (typeof handler === 'object') {
      return class extends LegacyBindingHandler {
        get handler () { return handler }
        static get after () { return handler.after }
        static get allowVirtualElements () {
          return handler.allowVirtualElements || virtualElements.allowedBindings[key]
        }
      }
    }

    throw new Error('The given handler is not an appropriate type.')
  }
}
