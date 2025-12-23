import { Provider } from '@tko/provider'

/**
 * Convert attributes with ko-* to bindings.
 *
 * e.g.
 * <div ko-visible='value'></div>
 */
export default class AttrProvider extends Provider {
  override get FOR_NODE_TYPES() {
    return [Node.ELEMENT_NODE]
  }

  get PREFIX() {
    return 'ko-'
  }

  getBindingAttributesList(node: Node) {
    if (!(node instanceof Element)) {
      return []
    }

    if (!node.hasAttributes()) {
      return []
    }
    return Array.from(node.attributes).filter(attr => attr.name.startsWith(this.PREFIX))
  }

  override nodeHasBindings(node: Node) {
    return this.getBindingAttributesList(node).length > 0
  }

  override getBindingAccessors(node: Node, context) {
    return Object.assign({}, ...this.handlersFromAttributes(node, context))
  }

  *handlersFromAttributes(node: Node, context) {
    for (const attr of this.getBindingAttributesList(node)) {
      const name = attr.name.substring(this.PREFIX.length)
      yield { [name]: () => this.getValue(attr.value, context, node) }
    }
  }

  getValue(token, $context, node: Node) {
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
