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
} from 'tko.utils'

import {
  DescendantBindingHandler, contextFor
} from 'tko.bind'

const SLOTS_SYM = Symbol('Knockout Slots')

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
    const nodesForSlot = this.getNodesForSlot(slotNode)
    virtualElements.setDomNodeChildren(nodeInComponentTemplate, nodesForSlot)
  }

  getNodesForSlot (slotNode) {
    if (!slotNode) { return [] }
    if (slotNode instanceof HTMLTemplateElement) {
      return slotNode.content.cloneNode(true).childNodes
    }
    return [slotNode.cloneNode(true)]
  }

  * genSlotsByName (templateNodes) {
    for (const node of templateNodes) {
      if (node.nodeType !== 1) { continue }
      const slotName = node.getAttribute('slot')
      if (!slotName) { continue }
      yield {[slotName]: node}
    }
  }

  getSlot (slotName) {
    const {$componentTemplateNodes} = this.$context
    if (!$componentTemplateNodes[SLOTS_SYM]) {
      $componentTemplateNodes[SLOTS_SYM] = Object.assign({},
        ...this.genSlotsByName($componentTemplateNodes))
    }
    return $componentTemplateNodes[SLOTS_SYM][slotName]
  }

  static get allowVirtualElements () { return true }
}
