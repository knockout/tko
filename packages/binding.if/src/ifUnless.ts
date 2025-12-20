import { unwrap } from '@tko/observable'

import ConditionalBindingHandler from './ConditionalBindingHandler'

/**
 * For the `if:` binding.
 */
export class IfBindingHandler extends ConditionalBindingHandler {
  ifCondition: any
  constructor(...args: [any]) {
    super(...args)
    this.ifCondition = this.computed(() => !!unwrap(this.value))
    this.computed('render')
  }

  shouldDisplayIf() {
    return this.ifCondition()
  }

  override get bindingContext() {
    return this.ifCondition.isActive()
      ? this.$context.extend(() => {
          // Ensure that this context is dependant upon the conditional, so the
          // order of binding application is: conditional before its children.
          // See https://github.com/knockout/knockout/pull/2226
          this.ifCondition()
          return null
        })
      : this.$context
  }

  override renderStatus() {
    let shouldDisplay = this.shouldDisplayIf()

    if (this.elseChainIsAlreadySatisfied) {
      shouldDisplay = false
      // needsRefresh = isFirstRender || this.didDisplayOnLastUpdate FIXME
      this.completesElseChain(true)
    } else {
      this.completesElseChain(shouldDisplay)
    }
    return { shouldDisplay }
  }
}

export class UnlessBindingHandler extends IfBindingHandler {
  override shouldDisplayIf() {
    return !super.shouldDisplayIf()
  }
}
