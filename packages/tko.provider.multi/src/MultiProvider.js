
import {
  Provider
} from 'tko.provider'

export default class MultiProvider extends Provider {
  constructor (params = {}) {
    super(params)
    const providers = params.providers || []
    this.providers = []
    providers.forEach(p => this.addProvider(p))
  }

  addProvider (provider) {
    this.providers.push(provider)
    provider.bindingHandlers = this.bindingHandlers
    provider.globals = this.globals
  }

  nodeHasBindings (node) {
    return this.providers.some(p => p.nodeHasBindings(node))
  }

  preprocessNode (node) {
    for (const provider of this.providers) {
      const newNodes = provider.preprocessNode(node)
      if (newNodes) { return newNodes }
    }
  }

  getBindingAccessors (node, ctx) {
    node = this.preprocessNode(node) || node
    // `bindings` is e.g. {text: accessorFunction, visible: accessorFunction2}
    const bindings = this.providers.map(p => p.getBindingAccessors(node, ctx))
    return Object.assign({}, ...bindings)
  }
}
