
import {
    cloneNodes, virtualElements, cleanNode, domData
} from 'tko.utils'

import {
    unwrap, dependencyDetection, observable
} from 'tko.observable'

import {
    applyBindingsToDescendants, AsyncBindingHandler
} from 'tko.bind'

/**
 * Test a node for whether it represents an "else" condition.
 * @param  {HTMLElement}  node to be tested
 * @return {Boolean}      true when
 *
 * Matches <!-- else -->
 */
function isElseNode (node) {
  return node.nodeType === 8 &&
        node.nodeValue.trim().toLowerCase() === 'else'
}

function detectElse (element) {
  var children = virtualElements.childNodes(element)
  for (var i = 0, j = children.length; i < j; ++i) {
    if (isElseNode(children[i])) { return true }
  }
  return false
}

/**
 * Clone the nodes, returning `ifNodes`, `elseNodes`
 * @param  {HTMLElement} element The nodes to be cloned
 * @param  {boolean}    hasElse short-circuit to speed up the inner-loop.
 * @return {object}         Containing the cloned nodes.
 */
function cloneIfElseNodes (element, hasElse) {
  const children = virtualElements.childNodes(element)
  const ifNodes = []
  const elseNodes = []
  let target = ifNodes

  for (var i = 0, j = children.length; i < j; ++i) {
    if (hasElse && isElseNode(children[i])) {
      target = elseNodes
      hasElse = false
    } else {
      target.push(cleanNode(children[i].cloneNode(true)))
    }
  }

  return { ifNodes, elseNodes }
}

/**
 * Create a DOMbinding that controls DOM nodes presence
 *
 * Covers e.g.
 *
 * 1. DOM Nodes contents
 *
 * <div data-bind='if: x'>
 * <!-- else --> ... an optional "if"
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
 */
class ConditionalBindingHandler extends AsyncBindingHandler {
  constructor (params) {
    super(params)
    this.hasElse = detectElse(this.$element)
    const elseChainSatisfied = this.completesElseChain = observable()

    domData.set(this.$element, 'conditional', { elseChainSatisfied })

    this.computed(this.render.bind(this))
  }

  get elseChainIsAlreadySatisfied () { return false }
  get needsRefresh () {
    return this.isFirstRender || this.shouldDisplayIf !== this.didDisplayOnLastUpdate
  }
  get shouldDisplayIf () { return !!unwrap(this.value) }

  render () {
    const isFirstRender = !this.ifElseNodes
    let shouldDisplayIf = this.shouldDisplayIf
    let needsRefresh = this.needsRefresh

    if (this.elseChainIsAlreadySatisfied) {
      shouldDisplayIf = false
      needsRefresh = isFirstRender || this.didDisplayOnLastUpdate
      this.completesElseChain(true)
    } else {
      this.completesElseChain(this.shouldDisplayIf)
    }

    if (!needsRefresh) { return }

    if (isFirstRender && (dependencyDetection.getDependenciesCount() || this.hasElse)) {
      this.ifElseNodes = cloneIfElseNodes(this.$element, this.hasElse)
    }

    if (shouldDisplayIf) {
      if (!isFirstRender || this.hasElse) {
        virtualElements.setDomNodeChildren(this.$element, cloneNodes(this.ifElseNodes.ifNodes))
      }
    } else if (this.ifElseNodes) {
      virtualElements.setDomNodeChildren(this.$element, cloneNodes(this.ifElseNodes.elseNodes))
    } else {
      virtualElements.emptyNode(this.$element)
    }

    applyBindingsToDescendants(this.bindingContext, this.$element)
      .then(this.completeBinding)

    this.didDisplayOnLastUpdate = shouldDisplayIf
  }

  get bindingContext () { return this.$context }
  get controlsDescendants () { return true }
  static get allowVirtualElements () { return true }
}

export class IfBindingHandler extends ConditionalBindingHandler {}

export class UnlessBindingHandler extends ConditionalBindingHandler {
  get shouldDisplayIf () { return !super.shouldDisplayIf }
}

export class ElseBindingHandler extends ConditionalBindingHandler {
  get shouldDisplayIf () { return super.shouldDisplayIf || this.value === undefined }

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

export class WithBindingHandler extends ConditionalBindingHandler {
  get needsRefresh () { return true }
  get bindingContext () {
    return this.$context.createStaticChildContext(this.value)
  }
}

