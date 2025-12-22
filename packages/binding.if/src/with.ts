import { options } from '@tko/utils'

import { unwrap } from '@tko/observable'

import ConditionalBindingHandler from './ConditionalBindingHandler'

/**
 * The following fails somewhere in the `limit` functions of Observables i.e.
 * it's an issue related to async/deferUpdates.
 */
export class WithBindingHandler extends ConditionalBindingHandler {
  asOption: any
  conditional: any
  constructor(...args: [any]) {
    super(...args)
    this.asOption = this.allBindings.get('as')

    // If given `as`, reduce the condition to a boolean, so it does not
    // change & refresh when the value is updated.
    const conditionalFn =
      this.asOption && !options.createChildContextWithAs ? () => Boolean(unwrap(this.value)) : () => unwrap(this.value)
    this.conditional = this.computed(conditionalFn)

    this.computed('render')
  }

  override get bindingContext() {
    if (!this.asOption) {
      return this.$context.createChildContext(this.valueAccessor)
    }
    return options.createChildContextWithAs
      ? this.$context.createChildContext(this.value, this.asOption)
      : this.$context.extend({ [this.asOption]: this.value })
  }

  override renderStatus() {
    const shouldDisplay = Boolean(this.conditional())
    return { shouldDisplay }
  }
}
