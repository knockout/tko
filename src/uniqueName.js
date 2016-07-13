


export var uniqueName = {
    init: function (element, valueAccessor) {
        if (valueAccessor()) {
            var name = "ko_unique_" + (++uniqueName.currentIndex);
            ko.utils.setElementName(element, name);
        }
    },
    currentIndex: 0
};
