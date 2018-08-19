/**
 * Slots work as follows (you'll note a similarity to vue).
 *
 * Component template definitions have <slot name='abc'> tags.
 *
 *    <template id='custom-component-template'>
 *      <slot name='abc'>
 *
 * Component use these slots with e.g.
 *
 *    <custom-component>
 *       <template slot='abc'>
 *
 * When the component template is rendered, the `slot` binding will map
 * every binding to its respective slot.
 */
import {
  virtualElements
} from '@tko/utils'

import {
  cloneNodeFromOriginal
} from '@tko/utils.jsx'

import {
  DescendantBindingHandler, contextFor
} from '@tko/bind'

/**
 * SlotBinding replaces a slot with
 */
export default class SlotBinding extends DescendantBindingHandler {
  constructor (...params) {
    super(...params)
    const slotNode = this.getSlot(this.value)
    const $slotContext = contextFor(slotNode)

    const childContext = this.$context.extend({
      $slotContext,
      $slotData: $slotContext && $slotContext.$data
    })

    this.replaceSlotWithNode(this.$element, slotNode)

    this.applyBindingsToDescendants(childContext)
  }

  /**
   *
   * @param {HTMLElement} nodeToReplace
   * @param {HTMLElement}} slotValue
   */
  replaceSlotWithNode (nodeInComponentTemplate, slotNode) {
    const nodesForSlot = cloneNodeFromOriginal(slotNode)
    virtualElements.setDomNodeChildren(nodeInComponentTemplate, nodesForSlot)
  }

  getSlot (slotName) {
    const {$componentTemplateSlotNodes} = this.$context

    if (!slotName) {
      return $componentTemplateSlotNodes[''] ||
        [...this.$context.$componentTemplateNodes]
          .filter(n => !n.getAttribute || !n.getAttribute('slot'))
    }

    return $componentTemplateSlotNodes[slotName]
  }

  static get allowVirtualElements () { return true }
}
