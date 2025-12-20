import { Provider } from '@tko/provider'

/**
 * Convert attributes with ko-* to bindings.
 *
 * e.g.
 * <div ko-visible='value'></div>
 */
export default class AttrProvider extends Provider {
  override get FOR_NODE_TYPES() {
    return [1]
  } // document.ELEMENT_NODE

  get PREFIX() {
    return 'ko-'
  }

  getBindingAttributesList(node: Element) {
    if (!node.hasAttributes()) {
      return []
    }
    return Array.from(node.attributes).filter(attr => attr.name.startsWith(this.PREFIX))
  }

  override nodeHasBindings(node: Element) {
    return this.getBindingAttributesList(node).length > 0
  }

  override getBindingAccessors(node: Element, context) {
    return Object.assign({}, ...this.handlersFromAttributes(node, context))
  }

  *handlersFromAttributes(node: Element, context) {
    for (const attr of this.getBindingAttributesList(node)) {
      const name = attr.name.substr(this.PREFIX.length)
      yield { [name]: () => this.getValue(attr.value, context, node) }
    }
  }

  getValue(token, $context, node: Element) {
    /* FIXME: This duplicates Identifier.prototype.lookup_value; it should
       be refactored into e.g. a BindingContext method */
    if (!token) {
      return
    }
    const $data = $context.$data

    switch (token) {
      case '$element':
        return node
      case '$context':
        return $context
      case 'this':
      case '$data':
        return $context.$data
    }

    if ($data instanceof Object && token in $data) {
      return $data[token]
    }
    if (token in $context) {
      return $context[token]
    }
    if (token in this.globals) {
      return this.globals[token]
    }

    throw new Error(`The variable '${token} not found.`)
  }
}
