
import { options } from '@tko/utils'
import { isWriteableObservable } from '@tko/observable'
import { LifeCycle } from '@tko/lifecycle'

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
  set value (v) {
    const va = this.valueAccessor()
    if (isWriteableObservable(va)) {
      va(v)
    } else {
      this.valueAccessor(v)
    }
  }

  get controlsDescendants () { return false }

  static get allowVirtualElements () { return false }
  static get isBindingHandlerClass () { return true }

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
const ResolveSymbol = Symbol('Async Binding Resolved')

export class AsyncBindingHandler extends BindingHandler {
  constructor (params) {
    super(params)
    this.bindingCompletion = new Promise((resolve) => {
      this[ResolveSymbol] = resolve
    })
    this.completeBinding = bindingResult => this[ResolveSymbol](bindingResult)
  }

  get bindingCompleted () { return this.bindingCompletion }
}
