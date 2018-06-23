
import {
  tagNameLower, objectMap
} from 'tko.utils'

import registry from 'tko.utils.component'

import {
  unwrap, isWriteableObservable
} from 'tko.observable'

import {
  computed
} from 'tko.computed'

import {
  Provider
} from 'tko.provider'

import {
  Parser
} from 'tko.utils.parser'

export default class ComponentProvider extends Provider {
  get FOR_NODE_TYPES () { return [ 1 ] } // document.ELEMENT_NODE

  /**
   * Convert <slot name='X'> to <!-- ko slot: 'X' --><!-- /ko -->
   * @param {HTMLElement} node
   */
  preprocessNode (node) {
    if (node.tagName === 'SLOT') {
      const parent = node.parentNode
      const slotName = node.getAttribute('name') || ''
      const openNode = document.createComment(`ko slot: "${slotName}"`)
      const closeNode = document.createComment('/ko')
      parent.insertBefore(openNode, node)
      parent.insertBefore(closeNode, node)
      parent.removeChild(node)
      return [openNode, closeNode]
    }
  }

  nodeHasBindings (node) {
    return Boolean(this.getComponentNameForNode(node))
  }

  getBindingAccessors (node, context) {
    const componentName = this.getComponentNameForNode(node)
    if (!componentName) { return }
    const component = () => ({
      name: componentName,
      params: this.getComponentParams(node, context)
    })
    return { component }
  }

  getComponentNameForNode (node) {
    if (node.nodeType !== node.ELEMENT_NODE) { return }
    const tagName = tagNameLower(node)
    if (registry.isRegistered(tagName)) {
      const hasDash = tagName.includes('-')
      const isUnknownEntity = ('' + node) === '[object HTMLUnknownElement]'
      if (hasDash || isUnknownEntity) { return tagName }
    }
  }

  getComponentParams (node, context) {
    const parser = new Parser(node, context, this.globals)
    const paramsString = (node.getAttribute('params') || '').trim()
    const accessors = parser.parse(paramsString, context, node)
    if (!accessors || Object.keys(accessors).length === 0) {
      return { $raw: {} }
    }
    const $raw = objectMap(accessors,
      (value) => computed(value, null, { disposeWhenNodeIsRemoved: node })
    )
    const params = objectMap($raw, (v) => this.makeParamValue(node, v))
    return Object.assign({ $raw }, params)
  }

  makeParamValue (node, paramValueComputed) {
    const paramValue = paramValueComputed.peek()
    // Does the evaluation of the parameter value unwrap any observables?
    if (!paramValueComputed.isActive()) {
      // No it doesn't, so there's no need for any computed wrapper. Just pass through the supplied value directly.
      // Example: "someVal: firstName, age: 123" (whether or not firstName is an observable/computed)
      return paramValue
    }
    // Yes it does. Supply a computed property that unwraps both the outer (binding expression)
    // level of observability, and any inner (resulting model value) level of observability.
    // This means the component doesn't have to worry about multiple unwrapping. If the value is a
    // writable observable, the computed will also be writable and pass the value on to the observable.
    const isWriteable = isWriteableObservable(paramValue)

    return computed({
      read: () => unwrap(paramValueComputed()),
      write: isWriteable ? (v) => paramValueComputed()(v) : null,
      disposeWhenNodeIsRemoved: node
    })
  }
}
