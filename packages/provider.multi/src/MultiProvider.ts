
import {
  Provider
} from '@tko/provider'
import { DataBindProvider } from '@tko/provider.databind'
import { AttributeMustacheProvider, TextMustacheProvider } from '@tko/provider.mustache'


export default class MultiProvider extends Provider {
  nodeTypes: any[]
  nodeTypeMap: {}
  providers: any[]

  get FOR_NODE_TYPES () { return this.nodeTypes }

  constructor (params: ProviderParamsInput | null = null) {
    super(params)
    const providers = params?.providers || []
    this.nodeTypeMap = {}
    this.nodeTypes = []
    this.providers = []
    providers.forEach(p => this.addProvider(p))
  }

  setGlobals (globals) {
    [this, ...this.providers].forEach(p => (p.globals = globals))
  }

  addProvider (provider: MultiProvider | DataBindProvider | AttributeMustacheProvider | TextMustacheProvider ) {
    this.providers.push(provider)
    provider.bindingHandlers = this.bindingHandlers
    provider.globals = this.globals
    const nodeTypeMap = this.nodeTypeMap
    for (const nodeType of provider.FOR_NODE_TYPES) {
      if (!nodeTypeMap[nodeType]) { nodeTypeMap[nodeType] = new Array() }
      nodeTypeMap[nodeType].push(provider)
    }
    this.nodeTypes = Object.keys(this.nodeTypeMap).map(k => parseInt(k, 10))
  }

  providersFor (node: Element): any[] {
    return this.nodeTypeMap[node.nodeType] || []
  }

  nodeHasBindings (node: Element) {
    return this.providersFor(node).some(p => p.nodeHasBindings(node))
  }

  preprocessNode (node: Element) {
    for (const provider of this.providersFor(node)) {
      const newNodes = provider.preprocessNode(node)
      if (newNodes) { return newNodes }
    }
  }

  * enumerateProviderBindings (node: Element, ctx) {
    for (const provider of this.providersFor(node)) {
      const bindings = provider.getBindingAccessors(node, ctx)
      if (!bindings) { continue }
      yield * Object.entries(bindings || {})
      if (provider.preemptive) { return }
    }
  }

  getBindingAccessors (node: Element, ctx) {
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
