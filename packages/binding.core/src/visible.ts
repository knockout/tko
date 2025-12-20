import { unwrap } from '@tko/observable'

export const visible = {
  update: function (element, valueAccessor) {
    let value = unwrap(valueAccessor())
    let isCurrentlyVisible = !(element.style.display === 'none')
    if (value && !isCurrentlyVisible) {
      element.style.display = ''
    } else if (!value && isCurrentlyVisible) {
      element.style.display = 'none'
    }
  }
}

export const hidden = {
  update: function (element, valueAccessor) {
    visible.update.call(this, element, () => !unwrap(valueAccessor()))
  }
}
