
import { options } from '@tko/utils'
import { isWriteableObservable } from '@tko/observable'
import { LifeCycle } from '@tko/lifecycle'

export class BindingHandler extends LifeCycle {
  $context: BindingContext // most likly BindingContext but params must be typed first
  $element: HTMLElement
  $data: any
  bindingCompletion: any
  valueAccessor: Function
  completeBinding: any
  allBindings: AllBindings

  constructor (params) {
    super()
    const {$element, valueAccessor, allBindings, $context} = params

    this.$element = $element;
    this.valueAccessor = valueAccessor;    
    this.allBindings = allBindings;
    this.$context = $context;
    this.$data = $context.$data;

    this.anchorTo($element)
  }

  get value () {
    return this.valueAccessor()
  }
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
  get bindingCompleted (): any { return true }

  static registerAs (name, provider = options.bindingProviderInstance) {
    provider.bindingHandlers.set(name, this) //todo dangerous javascript: this in static function = this is calling object
  }

  static registerBindingHandler(handler: BindingHandler, name, provider = options.bindingProviderInstance) {
    provider.bindingHandlers.set(name, handler)
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
