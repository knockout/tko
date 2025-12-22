import { tagNameLower } from './info'
import * as domData from './data'

const hasDomDataExpandoProperty = Symbol('Knockout selectExtensions hasDomDataProperty')

// Normally, SELECT elements and their OPTIONs can only take value of type 'string' (because the values
// are stored on DOM attributes). ko.selectExtensions provides a way for SELECTs/OPTIONs to have values
// that are arbitrary objects. This is very convenient when implementing things like cascading dropdowns.
//
export const selectExtensions = {
  optionValueDomDataKey: domData.nextKey(),

  readValue: function (element: HTMLElement) {
    switch (tagNameLower(element)) {
      case 'option': {
        if (element[hasDomDataExpandoProperty] === true) {
          return domData.get(element, selectExtensions.optionValueDomDataKey)
        }
        return (element as HTMLOptionElement).value
      }
      case 'select': {
        const selectElement = element as HTMLSelectElement
        return selectElement.selectedIndex >= 0
          ? selectExtensions.readValue(selectElement.options[selectElement.selectedIndex])
          : undefined
      }
      default:
        return (element as HTMLInputElement).value
    }
  },

  writeValue: function (element: HTMLElement, value?: any, allowUnset?: boolean) {
    switch (tagNameLower(element)) {
      case 'option':
        if (typeof value === 'string') {
          domData.set(element, selectExtensions.optionValueDomDataKey, undefined)
          if (hasDomDataExpandoProperty in element) {
            // IE <= 8 throws errors if you delete non-existent properties from a DOM node
            delete element[hasDomDataExpandoProperty]
          }
          ;(element as HTMLOptionElement).value = value
        } else {
          const el = element as any //TODO Custom-Type with hasDomDataExpandoProperty
          // Store arbitrary object using DomData
          domData.set(element, selectExtensions.optionValueDomDataKey, value)
          el[hasDomDataExpandoProperty] = true
          // Special treatment of numbers is just for backward compatibility. KO 1.2.1 wrote numerical values to element.value.
          el.value = typeof value === 'number' ? value : ''
        }

        break
      case 'select':
        {
          if (value === '' || value === null) {
            // A blank string or null value will select the caption
            value = undefined
          }
          let selection = -1

          const selectElement = element as HTMLSelectElement

          for (let i = 0, n = selectElement.options.length, optionValue; i < n; ++i) {
            optionValue = selectExtensions.readValue(selectElement.options[i])
            // Include special check to handle selecting a caption with a blank string value
            // Note that the looser == check here is intentional so that integer model values will match string element values.
            const strictEqual = optionValue === value
            const blankEqual = optionValue === '' && value === undefined
            const numericEqual = typeof value === 'number' && Number(optionValue) === value
            if (strictEqual || blankEqual || numericEqual) {
              selection = i
              break
            }
          }
          if (allowUnset || selection >= 0 || (value === undefined && selectElement.size > 1)) {
            selectElement.selectedIndex = selection
          }
        }
        break
      default:
        if (value === null || value === undefined) {
          value = ''
        }
        ;(element as HTMLInputElement).value = value
        break
    }
  }
}
