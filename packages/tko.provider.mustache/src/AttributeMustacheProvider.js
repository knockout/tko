
import {
  unwrap
} from 'tko.observable'

import {
  Provider
} from 'tko.provider'

import {
  parseInterpolation
} from './mustacheParser'

/**
 *  Interpret {{ }} inside DOM attributes e.g. <div class='{{ classes }}'>
 */
export default class AttributeMustacheProvider extends Provider {
  static get FOR_NODE_TYPES () { return [document.ELEMENT_NODE] }

  constructor (params = {}) {
    super(params)
    this.ATTRIBUTES_TO_SKIP = new Set(params.attributesToSkip || ['data-bind'])
  }

  * attributesToInterpolate (attributes) {
    for (const attr of Array.from(attributes)) {
      if (this.ATTRIBUTES_TO_SKIP.has(attr.name)) { continue }
      if (attr.specified && attr.value.includes('{{')) { yield attr }
    }
  }

  nodeHasBindings (node) {
    return !this.attributesToInterpolate(node.attributes).next().done
  }

  partsTogether (parts, context, ...valueToWrite) {
    if (parts.length > 1) {
      return parts.map(p => unwrap(p.asAttr(context, this.globals))).join('')
    }
    // It may be a writeable observable e.g. value="{{ value }}".
    const part = parts[0].asAttr(context, this.globals)
    if (valueToWrite.length) { part(valueToWrite[0]) }
    return part
  }

  * yieldBindings (node, context) {
    for (const attr of this.attributesToInterpolate(node.attributes)) {
      const parts = Array.from(parseInterpolation(attr.value))
      if (!parts.length) { continue }
      const hasBinding = this.bindingHandlers.get(attr.name)
      const accessorFn = hasBinding
        ? (...v) => this.partsTogether(parts, context, ...v)
        : (...v) => ({[attr.name]: this.partsTogether(parts, context, ...v)})
      const binding = hasBinding ? attr.name : `attr.${attr.name}`
      node.removeAttribute(attr)
      yield { [binding]: accessorFn }
    }
  }

  getBindingAccessors (node, context) {
    return Object.assign({}, ...this.yieldBindings(node, context))
  }
}
