import { setElementName } from '@tko/utils'

export const uniqueName = {
  init: function (element, valueAccessor) {
    if (valueAccessor()) {
      const name = 'ko_unique_' + ++uniqueName.currentIndex
      setElementName(element, name)
    }
  },
  currentIndex: 0
}
