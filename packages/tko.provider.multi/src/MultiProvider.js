
import {
  Provider
} from 'tko.provider'

export default class MultiProvider extends Provider {
  constructor (params={}) {
    super(params)
    const providers = params.providers || []
    this.providers = []
    providers.forEach(p => this.addProvider(p))
  }

  addProvider (provider) {
    this.providers.push(provider)
    provider.bindingHandlers = this.bindingHandlers
  }

  nodeHasBindings (node) {
    return this.providers.some(p => p.nodeHasBindings(p))
  }

  preprocessNode (node) {
    for (const provider of this.providers) {
      const newNodes = provider.preprocessNode(node)
      if (newNodes) { return newNodes }
    }
    return node
  }

  getBindingAccessors (node, ctx) {
    node = this.preprocessNode(node)
    return this.providers
      .reduce((acc, p) => this.reduceBindings(node, ctx, acc, p), {})
  }

  reduceBindings (node, ctx, bindings, p) {
    return Object.assign(bindings, p.getBindingAccessors(node, ctx, bindings))
  }
}
