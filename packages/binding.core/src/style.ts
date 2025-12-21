import { objectForEach, options } from '@tko/utils'

import { unwrap } from '@tko/observable'

export const style = {
  update: function (element, valueAccessor) {
    let value = unwrap(valueAccessor() || {})
    objectForEach(value, function (styleName, styleValue) {
      styleValue = unwrap(styleValue)

      if (styleValue === null || styleValue === undefined || styleValue === false) {
        // Empty string removes the value, whereas null/undefined have no effect
        styleValue = ''
      }

      if (options.jQuery) {
        jQuery(element).css(styleName, styleValue)
      } else {
        styleName = styleName.replace(/-(\w)/g, (all, letter) => letter.toUpperCase())
        const previousStyle = element.style[styleName]
        element.style[styleName] = styleValue
        if (styleValue !== previousStyle && element.style[styleName] === previousStyle && !isNaN(styleValue)) {
          element.style[styleName] = styleValue + 'px'
        }
      }
    })
  }
}
