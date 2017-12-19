
import {
    unwrap
} from 'tko.observable'

import ConditionalBindingHandler from './ConditionalBindingHandler'

/**
 * For the `if:` binding.
 */
export class IfBindingHandler extends ConditionalBindingHandler {
  constructor (...args) {
    super(...args)
    this.ifCondition = this.computed(() => !!unwrap(this.value))
    this.computed('render')
  }

  shouldDisplayIf () {
    return this.ifCondition()
  }

  get bindingContext () {
    return this.ifCondition.isActive()
      ? this.$context.extend(() => {
        // Ensure that this context is dependant upon the conditional, so the
        // order of binding application is: conditional before its children.
        // See https://github.com/knockout/kn
        // ockout/pull/2226
        this.ifCondition()
        return null
      })
      : this.$context
  }

  renderStatus () {
    let shouldDisplay = this.shouldDisplayIf()

    if (this.elseChainIsAlreadySatisfied) {
      shouldDisplay = false
      // needsRefresh = isFirstRender || this.didDisplayOnLastUpdate FIXME
      this.completesElseChain(true)
    } else {
      this.completesElseChain(shouldDisplay)
    }
    return {shouldDisplay}
  }
}

export class UnlessBindingHandler extends IfBindingHandler {
  shouldDisplayIf () { return !super.shouldDisplayIf() }
}
