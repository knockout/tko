
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

  partsTogether (parts, context, node, ...valueToWrite) {
    if (parts.length > 1) {
      return parts
        .map(p => unwrap(p.asAttr(context, this.globals, node))).join('')
    }
    // It may be a writeable observable e.g. value="{{ value }}".
    const part = parts[0].asAttr(context, this.globals)
    if (valueToWrite.length) { part(valueToWrite[0]) }
    return part
  }

  attributeBinding (name, parts) {
    return [name, parts]
  }

  * bindingParts (node, context) {
    for (const attr of this.attributesToInterpolate(node.attributes)) {
      const parts = Array.from(parseInterpolation(attr.value))
      if (parts.length) { yield this.attributeBinding(attr.name, parts) }
    }
  }

  * bindingObjects (node, context) {
    for (const [attrName, parts] of this.bindingParts(node, context)) {
      const hasBinding = this.bindingHandlers.get(attrName)
      const handler = hasBinding ? attrName : `attr.${attrName}`
      const accessorFn = hasBinding
        ? (...v) => this.partsTogether(parts, context, node, ...v)
        : (...v) => ({[attrName]: this.partsTogether(parts, context, node, ...v)})
      node.removeAttribute(attrName)
      yield { [handler]: accessorFn }
    }
  }

  getBindingAccessors (node, context) {
    return Object.assign({}, ...this.bindingObjects(node, context))
  }
}
