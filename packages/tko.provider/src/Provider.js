
import BindingHandlerObject from './BindingHandlerObject'

export default class Provider {
  constructor (params = {}) {
    if (this.constructor === Provider) {
      throw new Error('Provider is an abstract base class.')
    }
    if (!('FOR_NODE_TYPES' in this)) {
      // FOR_NODE_TYPES must return a list of integers corresponding to the
      // node.nodeType's that the provider handles.
      throw new Error('Providers must have FOR_NODE_TYPES property')
    }
    this.bindingHandlers = params.bindingHandlers || new BindingHandlerObject()
    this.globals = params.globals || {}
  }

  nodeHasBindings (/* node */) {}
  getBindingAccessors (/* node, context */) {}
  preprocessNode (/* node */) {}
  postProcess (/* node */) {}
}
