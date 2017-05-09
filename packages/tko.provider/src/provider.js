
import BindingHandlerObject from './BindingHandlerObject'

export default class Provider {
  constructor (params = {}) {
    this.bindingHandlers = params.bindingHandlers || new BindingHandlerObject()
    this.globals = {}
  }

  nodeHasBindings (/* node */) {}
  getBindingAccessors (/* node, context */) {}
  preprocessNode (/* node */) {}
  postProcess (/* node */) {}
}
