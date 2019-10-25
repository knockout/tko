
import {
  Provider
} from '@tko/provider'

export default class MultiProvider extends Provider {
  get FOR_NODE_TYPES () { return this.nodeTypes }

  constructor (params = {}) {
    super(params)
    const providers = params.providers || []
    this.nodeTypeMap = {}
    this.nodeTypes = []
    this.providers = []
    providers.forEach(p => this.addProvider(p))
  }

  setGlobals (globals) {
    [this, ...this.providers].forEach(p => (p.globals = globals))
  }

  addProvider (provider) {
    this.providers.push(provider)
    provider.bindingHandlers = this.bindingHandlers
    provider.globals = this.globals
    const nodeTypeMap = this.nodeTypeMap
    for (const nodeType of provider.FOR_NODE_TYPES) {
      if (!nodeTypeMap[nodeType]) { nodeTypeMap[nodeType] = [] }
      nodeTypeMap[nodeType].push(provider)
    }
    this.nodeTypes = Object.keys(this.nodeTypeMap).map(k => parseInt(k, 10))
  }

  providersFor (node) {
    return this.nodeTypeMap[node.nodeType] || []
  }

  nodeHasBindings (node) {
    return this.providersFor(node).some(p => p.nodeHasBindings(node))
  }

  preprocessNode (node) {
    for (const provider of this.providersFor(node)) {
      const newNodes = provider.preprocessNode(node)
      if (newNodes) { return newNodes }
    }
  }

  * enumerateProviderBindings (node, ctx) {
    for (const provider of this.providersFor(node)) {
      const bindings = provider.getBindingAccessors(node, ctx)
      if (!bindings) { continue }
      yield * Object.entries(bindings || {})
      if (provider.preemptive) { return }
    }
  }

  getBindingAccessors (node, ctx) {
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
