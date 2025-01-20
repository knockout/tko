

import { applyBindingsToDescendants } from './applyBindings'
import { AsyncBindingHandler } from './BindingHandler'

/**
 * This DescendantBindingHandler is a base class for bindings that control
 * descendants, such as the `if`, `with`, `component`, `foreach` and `template`
 * bindings.
 */
export class DescendantBindingHandler extends AsyncBindingHandler {
  get controlsDescendants () { return true }

  async applyBindingsToDescendants (childContext: any, callback?: Function) {
    const bindingResult = applyBindingsToDescendants(childContext, this.$element)
    if (bindingResult.isSync) {
      this.bindingCompletion = bindingResult
    } else {
      await bindingResult.completionPromise
    }
    if (callback) { callback(bindingResult) }
    this.completeBinding(bindingResult)
  }
}
