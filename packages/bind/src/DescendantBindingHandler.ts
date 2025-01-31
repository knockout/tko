

import { applyBindingsToDescendants } from './applyBindings'
import { AsyncBindingHandler } from './BindingHandler'
import { BindingResult } from "./BindingResult";

/**
 * This DescendantBindingHandler is a base class for bindings that control
 * descendants, such as the `if`, `with`, `component`, `foreach` and `template`
 * bindings.
 */
export class DescendantBindingHandler extends AsyncBindingHandler {
  get controlsDescendants () { return true }

  async applyBindingsToDescendants (childContext: BindingContext, callback?: (result: BindingResult) => void ) {
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
