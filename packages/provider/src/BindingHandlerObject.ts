
import {
  options
} from '@tko/utils'

export default class BindingHandlerObject {
  set (nameOrObject: string|object, value?: string|object) {
    if (typeof nameOrObject === 'string') {
      this[nameOrObject] = value
    } else if (typeof nameOrObject === 'object') {
      if (value !== undefined) {
        options.onError(
          new Error('Given extraneous `value` parameter (first param should be a string, but it was an object).' + nameOrObject))
      }
      Object.assign(this, nameOrObject)
    } else {
      options.onError(
        new Error('Given a bad binding handler type: ' + nameOrObject))
    }
  }

  /**
   * The handler may have a `.` in it, e.g. `attr.title`, in which case the
   * handler is `attr`.  Otherwise it's the name given
   */
  get (nameOrDotted) {
    const [name] = nameOrDotted.split('.')
    return this[name]
  }
}
