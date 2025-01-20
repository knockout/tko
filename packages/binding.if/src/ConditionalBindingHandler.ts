import {
    cloneNodes, virtualElements, cleanNode, domData
} from '@tko/utils'

import {
    dependencyDetection, observable
} from '@tko/observable'

import {
    applyBindingsToDescendants, AsyncBindingHandler
} from '@tko/bind'
import { Observable } from 'node_modules/@tko/observable/types/Observable';

/**
 * Create a DOMbinding that controls DOM nodes presence
 *
 * Covers e.g.
 *
 * 1. DOM Nodes contents
 *
 * <div data-bind='if: x'>
 * <!-- else --> ... an optional 'if'
 * </div>
 *
 * 2. Virtual elements
 *
 * <!-- ko if: x -->
 * <!-- else -->
 * <!-- /ko -->
 *
 * 3. Else binding
 * <div data-bind='if: x'></div>
 * <div data-bind='else'></div>
 *
 * Requires `renderStatus` and `get bindingContext` to be overloaded,
 * and this.computed('render') must be called in the child constructor.
 */
export default class ConditionalBindingHandler extends AsyncBindingHandler {
  get bindingContext(): any {
    return;
  }
  completesElseChain: Observable;
  hasElse: boolean;
  ifElseNodes?: any;
  constructor (params) {
    super(params)
    this.hasElse = this.detectElse(this.$element)
    const elseChainSatisfied = this.completesElseChain = observable()
    domData.set(this.$element, 'conditional', { elseChainSatisfied })
  }

  getIfElseNodes () {
    if (this.ifElseNodes) {
      return this.ifElseNodes
    }
    if (dependencyDetection.getDependenciesCount() || this.hasElse) {
      return this.cloneIfElseNodes(this.$element, this.hasElse)
    }
  }

  // Set to hide tsc error for using this in line 63, but must be overriden by design (see line 34)
  renderStatus():any  {};

  render () {
    const isFirstRender = !this.ifElseNodes
    const {shouldDisplay} = this.renderStatus()

    // Save the nodes before we possibly remove them from the DOM.
    this.ifElseNodes = this.getIfElseNodes() || {}

    if (shouldDisplay) {
      const useOriginalNodes = isFirstRender && !this.hasElse
      this.renderAndApplyBindings(this.ifElseNodes.ifNodes, useOriginalNodes)
    } else if (this.hasElse) {
      this.renderAndApplyBindings(this.ifElseNodes.elseNodes)
    } else {
      virtualElements.emptyNode(this.$element)
    }
  }

  async renderAndApplyBindings (nodes: ArrayLike<Node>, useOriginalNodes?: boolean) {
    if (!useOriginalNodes) {
      virtualElements.setDomNodeChildren(this.$element, cloneNodes(nodes))
    }
    const bound = await applyBindingsToDescendants(this.bindingContext, this.$element)
    this.completeBinding(bound)
  }

  /**
   * This may be truthy for the `else` binding.
   */
  get elseChainIsAlreadySatisfied () { return false }

  /**
   * Test a node for whether it represents an 'else' condition.
   * @param  {HTMLElement}  node to be tested
   * @return {Boolean}      true when
   *
   * Matches <!-- else -->
   */
  isElseNode (node) {
    return node.nodeType === 8 &&
          node.nodeValue.trim().toLowerCase() === 'else'
  }

  detectElse (element) {
    var children = virtualElements.childNodes(element)
    for (var i = 0, j = children.length; i < j; ++i) {
      if (this.isElseNode(children[i])) { return true }
    }
    return false
  }

  /**
   * Clone the nodes, returning `ifNodes`, `elseNodes`
   * @param  {HTMLElement} element The nodes to be cloned
   * @param  {boolean}    hasElse short-circuit to speed up the inner-loop.
   * @return {object}         Containing the cloned nodes.
   */
  cloneIfElseNodes (element, hasElse) {
    const children = virtualElements.childNodes(element)
    const ifNodes = new Array()
    const elseNodes = new Array()
    let target = ifNodes

    for (var i = 0, j = children.length; i < j; ++i) {
      if (hasElse && this.isElseNode(children[i])) {
        target = elseNodes
        hasElse = false
      } else {
        target.push(cleanNode(children[i].cloneNode(true)))
      }
    }

    return { ifNodes, elseNodes }
  }

  get controlsDescendants () { return true }
  static get allowVirtualElements () { return true }
}
