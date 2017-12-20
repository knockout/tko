import {
    unwrap
} from 'tko.observable'

import ConditionalBindingHandler from './ConditionalBindingHandler'

/**
 * The following fails somewhere in the `limit` functions of Observables i.e.
 * it's an issue related to async/deferUpdates.
 */
export class WithBindingHandler extends ConditionalBindingHandler {
  constructor (...args) {
    super(...args)
    this.asOption = this.allBindings.get('as')

    // If given `as`, reduce the condition to a boolean, so it does not
    // change & refresh when the value is updated.
    const conditionalFn = this.asOption
      ? () => Boolean(unwrap(this.value)) : () => unwrap(this.value)
    this.conditional = this.computed(conditionalFn)

    this.computed('render')
  }

  get bindingContext () {
    return this.asOption
      ? this.$context.extend({[this.asOption]: this.value})
      : this.$context.createChildContext(this.valueAccessor)
  }

  renderStatus () {
    const shouldDisplay = Boolean(this.conditional())
    return { shouldDisplay }
  }
}
