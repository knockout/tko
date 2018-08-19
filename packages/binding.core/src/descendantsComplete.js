/**
 * A simple callback binding.
 */
import {
  BindingHandler
} from '@tko/bind'

export default class DescendantsCompleteHandler extends BindingHandler {
  onDescendantsComplete () {
    if (typeof this.value === 'function') {
      this.value(this.$element)
    }
  }

  static get allowVirtualElements () { return true }
}
