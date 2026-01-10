import type { Options } from './options'

export interface IBindingHandlerObject {
  set(nameOrObject: string | object, value?: string | object): void
  get(nameOrDotted: string): any
}

export interface IKnockoutInstance {
  utils: any
  options: Options
}

export type BindingAccessors = { [name: string]: Function }

/**
 * Public interface for minimal describing a binding provider.
 *
 * Providers are responsible for detecting bindings on DOM nodes and
 * producing binding-accessor objects that the binding system consumes.
 */
export interface IProvider {
  /**
   * List of nodeType values this provider handles (e.g. [1, 3, 8]).
   */
  FOR_NODE_TYPES: number[]

  /**
   * Configure provider-level global values that are exposed to bindings.
   * @param globals - an object containing global values for binding evaluation
   */
  setGlobals(globals: any): void

  /**
   * If true, the provider is consulted before other providers when checking nodes.
   */
  preemptive: boolean

  /**
   * Returns true when the given node contains bindings that this provider understands.
   * @param node - DOM node to inspect
   * @param context - optional binding context
   */
  nodeHasBindings(node: Node, context?: any): boolean

  /**
   * Return a map of binding accessors for the given node.
   * The result must be an object whose property values are accessor functions.
   */
  getBindingAccessors(node: Node, context?: any): BindingAccessors

  /**
   * Optionally transform a node prior to binding. Return an array of nodes
   * to replace the original node, or null to indicate no change.
   */
  preprocessNode(node: Node): Node[] | null

  /**
   * The provider's registered binding handlers collection.
   */
  bindingHandlers: IBindingHandlerObject

  /**
   * Getter/setter used for legacy compatibility when assigning the global
   * binding provider instance (ko.bindingProvider.instance).
   */
  instance: IProvider

  /**
   * Given a bindings function or object, create and return a new object that contains
   * binding value-accessors functions. This is used by ko.applyBindingsToNode.
   */
  makeBindingAccessors(bindings: any, context: any, node: Node): BindingAccessors
}
