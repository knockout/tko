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
  JsxObserver, getOriginalJsxForNode
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
    const nodes = this.cloneNodeFromOriginal(slotNode)
    virtualElements.emptyNode(nodeInComponentTemplate)
    this.addDisposable(new JsxObserver(nodes, nodeInComponentTemplate))
  }

  cloneNodeFromOriginal (node) {
    if (!node) { return [] }
    const jsx = getOriginalJsxForNode(node)
    if (jsx) { return jsx.children }

    if ('content' in node) {
      const clone = document.importNode(node.content, true)
      return [...clone.childNodes]
    }

    const nodeArray = Array.isArray(node) ? node : [node]
    return nodeArray.map(n => n.cloneNode(true))
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
