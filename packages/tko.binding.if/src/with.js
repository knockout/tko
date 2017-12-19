import {
    unwrap, dependencyDetection
} from 'tko.observable'

import ConditionalBindingHandler from './ConditionalBindingHandler'

import {
    cloneNodes, virtualElements
} from 'tko.utils'

import { computed } from 'tko.computed'
import {
    applyBindingsToDescendants, AsyncBindingHandler
} from 'tko.bind'

/**
 * ⁉️ ⁉️ ⁉️ ⁉️ ⁉️ ⁉️
 * Why this works and the other does not is a problematic quagmire to debug.
 *
 * If you look at _evalIfChanged in computed.js, it's called 9 times for this
 * version, but only 4 for the other version.
 */
export class WithBindingHandler extends AsyncBindingHandler {
  constructor (...args) {
    super(...args)
    const element = this.$element
    let savedNodes

    this.computed(() => {
      const shouldDisplay = !!unwrap(this.value)
      const isFirstRender = !savedNodes

        // Save a copy of the inner nodes on the initial update, but only if we have dependencies.
      if (isFirstRender && dependencyDetection.getDependenciesCount()) {
        savedNodes = cloneNodes(virtualElements.childNodes(element), true /* shouldCleanNodes */)
      }

      if (shouldDisplay) {
        if (!isFirstRender) {
          virtualElements.setDomNodeChildren(element, cloneNodes(savedNodes))
        }
        applyBindingsToDescendants(
          this.$context.createChildContext(this.valueAccessor),
          element)
      } else {
        virtualElements.emptyNode(element)
      }
    })
  }

  get controlsDescendants () { return true }
  static get allowVirtualElements () { return true }
}

/**
 * The following fails somewhere in the `limit` functions of Observables i.e.
 * it's an issue related to async/deferUpdates.
 */
export class WithBindingHandlerFailsInexplicably extends ConditionalBindingHandler {
  constructor (...args) {
    super(...args)
    this.computed('render')
  }

  get bindingContext () {
    return this.$context.createStaticChildContext(this.valueAccessor)
  }

  renderStatus () {
    if (typeof this.value === 'function') { this.value() } // Create dependency
    const shouldDisplay = !!unwrap(this.value)
    return {shouldDisplay}
  }
}
