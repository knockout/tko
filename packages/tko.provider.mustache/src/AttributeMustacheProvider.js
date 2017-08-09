
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
 * These are bindings that are mapped specific attributes, such as
 * two-way communication (value/checked) or which have anti-collision
 * properties (css).
 */
const DEFAULT_ATTRIBUTE_BINDING_MAP = {
  value: 'value',
  checked: 'checked',
  class: 'css'
}

/**
 *  Interpret {{ }} inside DOM attributes e.g. <div class='{{ classes }}'>
 */
export default class AttributeMustacheProvider extends Provider {
  get FOR_NODE_TYPES () { return [ 1 ] } // document.ELEMENT_NODE

  constructor (params = {}) {
    super(params)
    this.ATTRIBUTES_TO_SKIP = new Set(params.attributesToSkip || ['data-bind'])
    this.ATTRIBUTES_BINDING_MAP = params.attributesBindingMap || DEFAULT_ATTRIBUTE_BINDING_MAP
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

  getPossibleDirectBinding (attrName) {
    const bindingName = this.ATTRIBUTES_BINDING_MAP[attrName]
    return bindingName && this.bindingHandlers.get(attrName)
  }

  * bindingObjects (node, context) {
    for (const [attrName, parts] of this.bindingParts(node, context)) {
      const bindingForAttribute = this.getPossibleDirectBinding(attrName)
      const handler = bindingForAttribute ? attrName : `attr.${attrName}`
      const accessorFn = bindingForAttribute
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
