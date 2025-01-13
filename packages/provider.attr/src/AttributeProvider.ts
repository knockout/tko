
import {
  Provider
} from '@tko/provider'

/**
 * Convert attributes with ko-* to bindings.
 *
 * e.g.
 * <div ko-visible='value'></div>
 */
export default class AttrProvider extends Provider {
  get FOR_NODE_TYPES () { return [ 1 ] } // document.ELEMENT_NODE

  get PREFIX () { return 'ko-' }

  getBindingAttributesList (node: HTMLElement) {
    if (!node.hasAttributes()) { return [] }
    return Array.from(node.attributes)
      .filter(attr => attr.name.startsWith(this.PREFIX))
  }

  nodeHasBindings (node: HTMLElement) {
    return this.getBindingAttributesList(node).length > 0
  }

  getBindingAccessors (node: HTMLElement, context) {
    return Object.assign({}, ...this.handlersFromAttributes(node, context))
  }

  * handlersFromAttributes (node: HTMLElement, context) {
    for (const attr of this.getBindingAttributesList(node)) {
      const name = attr.name.substr(this.PREFIX.length)
      yield {[name]: () => this.getValue(attr.value, context, node)}
    }
  }

  getValue (token, $context, node: HTMLElement) {
    /* FIXME: This duplicates Identifier.prototype.lookup_value; it should
       be refactored into e.g. a BindingContext method */
    if (!token) { return }
    const $data = $context.$data

    switch (token) {
      case '$element': return node
      case '$context': return $context
      case 'this': case '$data': return $context.$data
    }

    if ($data instanceof Object && token in $data) { return $data[token] }
    if (token in $context) { return $context[token] }
    if (token in this.globals) { return this.globals[token] }

    throw new Error(`The variable '${token} not found.`)
  }
}
