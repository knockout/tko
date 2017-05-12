
import BindingHandlerObject from './BindingHandlerObject'

export default class Provider {
  constructor (params = {}) {
    if (this.constructor === Provider) {
      throw new Error('Provider is an abstract base class.')
    }
    this.bindingHandlers = params.bindingHandlers || new BindingHandlerObject()
    this.globals = params.globals || {}
  }

  nodeHasBindings (/* node */) {}
  getBindingAccessors (/* node, context */) {}
  preprocessNode (/* node */) {}
  postProcess (/* node */) {}
}
