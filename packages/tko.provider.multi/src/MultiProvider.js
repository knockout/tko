
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

  * enumerateProviderBindings (node, ctx) {
    for (const provider of this.providers) {
      const bindings = provider.getBindingAccessors(node, ctx) || {}
      for (const [key, accessor] of Object.entries(bindings || {})) {
        yield [key, accessor]
      }
    }
  }

  getBindingAccessors (node, ctx) {
    node = this.preprocessNode(node) || node
    const bindings = {}
    for (const [key, accessor] of this.enumerateProviderBindings(node, ctx)) {
      if (key in bindings) {
        throw new Error(`The binding "${key}" is duplicated by multiple providers`)
      }
      bindings[key] = accessor
    }
    return bindings
  }
}
