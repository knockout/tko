import {
    unwrap
} from 'tko.observable';

export var visible = {
    update: function (element, valueAccessor) {
        var value = unwrap(valueAccessor());
        var isCurrentlyVisible = !(element.style.display == "none");
        if (value && !isCurrentlyVisible)
            element.style.display = "";
        else if ((!value) && isCurrentlyVisible)
            element.style.display = "none";
    }
};
