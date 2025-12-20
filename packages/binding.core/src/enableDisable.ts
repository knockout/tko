import { unwrap } from '@tko/observable'

export const enable = {
  update: function (element, valueAccessor) {
    let value = unwrap(valueAccessor())
    if (value && element.disabled) {
      element.removeAttribute('disabled')
    } else if (!value && !element.disabled) {
      element.disabled = true
    }
  }
}

export const disable = {
  update: function (element, valueAccessor) {
    enable.update(element, function () {
      return !unwrap(valueAccessor())
    })
  }
}
