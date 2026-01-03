export const uniqueName = {
  init: function (element, valueAccessor) {
    if (valueAccessor()) {
      const name = 'ko_unique_' + ++uniqueName.currentIndex
      element.name = name
    }
  },
  currentIndex: 0
}
