
import {
    virtualElements, options
} from 'tko.utils'

import {
    LifeCycle
} from 'tko.lifecycle'

import {
    dependencyDetection
} from 'tko.observable'

export class BindingHandler extends LifeCycle {
  constructor (params) {
    super()
    const {$element, valueAccessor, allBindings, $context} = params
    Object.assign(this, {
      valueAccessor,
      allBindings,
      $element,
      $context,
      $data: $context.$data
    })

    this.anchorTo($element)
  }

  get value () { return this.valueAccessor() }
  set value (v) { return this.valueAccessor(v) }

  get controlsDescendants () { return false }

  static get allowVirtualElements () { return false }

  /* Overload this for asynchronous bindings or bindings that recursively
     apply bindings (e.g. components, foreach, template).

     A binding should be complete when it has run through once, notably
     in server-side bindings for pre-rendering.
  */
  get bindingCompleted () { return true }

  static registerAs (name, provider = options.bindingProviderInstance) {
    provider.bindingHandlers.set(name, this)
  }
}

/**
 * An AsyncBindingHandler shall call `completeBinding` when the binding
 * is to be considered complete.
 */
export class AsyncBindingHandler extends BindingHandler {
  constructor (params) {
    super(params)
    this.bindingCompletion = new options.Promise((resolve) => { this.completeBinding = resolve })
  }

  get bindingCompleted () { return this.bindingCompletion }
}

class LegacyBindingHandler extends BindingHandler {
  constructor (params) {
    super(params)
    const handler = this.handler

    this.after = handler.after

    if (typeof handler.dispose === 'function') {
      this.addDisposable(handler)
    }

    try {
      dependencyDetection.ignore(() => {
        this.initReturn = handler.init && handler.init(...this.legacyArgs)
      })
    } catch (e) {
      handler.onError('init', e)
    }

    if (typeof handler.update === 'function') {
      this.computed(() => {
        try {
          handler.update(...this.legacyArgs)
        } catch (e) {
          handler.onError('update', e)
        }
      })
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
}

/**
 * Create a handler instance from the `origin`, which may be:
 *
 * 1. a class descended from BindingHandler
 * 2. an object (becomes LegacyBindingHandler)
 * 3. a function (becomes LegacyBindingHandler with `init: function`)
 *
 * If given an object (the only kind supported in knockout 3.x and before), it
 * shall draw the `init`, `update`, and `allowVirtualElements` properties
 */
export function getBindingHandlerClass (handler, key, onError) {
  if (handler.prototype instanceof BindingHandler) {
    return handler
  }

  if (typeof handler === 'function') {
    const [initFn, disposeFn] = [handler, handler.dispose]
    return class extends LegacyBindingHandler {
      get handler () {
        const init = initFn.bind(this)
        const dispose = disposeFn ? disposeFn.bind(this) : null
        return { init, dispose, onError }
      }
      static get allowVirtualElements () {
        return handler.allowVirtualElements || virtualElements.allowedBindings[key]
      }
        }
  }

  if (typeof handler === 'object') {
    return class extends LegacyBindingHandler {
      get handler () { return Object.assign({onError}, handler) }
      static get allowVirtualElements () {
        return handler.allowVirtualElements || virtualElements.allowedBindings[key]
      }
        }
  }

  throw new Error('The given handler is not an appropriate type.')
}
