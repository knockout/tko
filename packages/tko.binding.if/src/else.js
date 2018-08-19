import {
    virtualElements, domData
} from '@tko/utils'

import {
    unwrap
} from '@tko/observable'

import {
  IfBindingHandler
} from './ifUnless.js'

/**
 * The `else` binding
 * (not to be mistaken for `<!-- else -->` inside if bindings.
 */
export class ElseBindingHandler extends IfBindingHandler {
  shouldDisplayIf () {
    return super.shouldDisplayIf() || this.value === undefined
  }

  /**
   * Return any conditional that precedes the given node.
   * @return {object}      { elseChainSatisfied: observable }
   */
  get elseChainIsAlreadySatisfied () {
    if (!this._elseChain) { this._elseChain = this.readElseChain() }
    return unwrap(this._elseChain.elseChainSatisfied)
  }

  readElseChain () {
    let node = this.$element
    do {
      node = node.previousSibling
    } while (node && node.nodeType !== 1 && node.nodeType !== 8)

    if (!node) { return false }

    if (node.nodeType === 8) {
      node = virtualElements.previousSibling(node)
    }

    return domData.get(node, 'conditional') || {}
  }
}
