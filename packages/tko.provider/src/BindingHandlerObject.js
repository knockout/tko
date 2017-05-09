
import {
  options
} from 'tko.utils'


// bindingHandlers.set('name', bindingDefinition)
// bindingHandlers.set({ text: textBinding, input: inputBinding })

export default class BindingHandlerObject {
  constructor() {}

  set(nameOrObject, value) {
    if (typeof nameOrObject === 'string') {
      this[nameOrObject] = value;
    } else if (typeof nameOrObject === 'object') {
      if (value !== undefined) {
        options.onError(
          new Error("Given extraneous `value` parameter (first param should be a string, but it was an object)." + nameOrObject));
      }
      Object.assign(this, nameOrObject);
    } else {
      options.onError(
        new Error("Given a bad binding handler type: " + nameOrObject));
    }
  }

  get(name) {
    return this[name]
  }
}
