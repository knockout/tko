/**
 * A simple callback binding.
 *
 * The actual `descendantsComplete` firing is driven by the async-completion
 * bookkeeping in `@tko/bind` (`applyBindings` subscribes to the node's
 * `descendantsComplete` event). This handler only marks the key as a valid
 * binding that may appear on virtual elements.
 */
import { BindingHandler } from '@tko/bind'

export default class DescendantsCompleteHandler extends BindingHandler {
  static override get allowVirtualElements() {
    return true
  }
}
