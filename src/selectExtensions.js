
import { domData, tagNameLower } from 'tko.utils';


var hasDomDataExpandoProperty = '__ko__hasDomDataOptionValue__';

// Normally, SELECT elements and their OPTIONs can only take value of type 'string' (because the values
// are stored on DOM attributes). ko.selectExtensions provides a way for SELECTs/OPTIONs to have values
// that are arbitrary objects. This is very convenient when implementing things like cascading dropdowns.
export var selectExtensions = {
    optionsValueDomDataKey: undefined,

    readValue : function(element) {
        switch (tagNameLower(element)) {
        case 'option':
            if (element[hasDomDataExpandoProperty] === true)
                return domData.get(element, selectExtensions.optionValueDomDataKey);
            return element.value;
        case 'select':
            return element.selectedIndex >= 0 ? selectExtensions.readValue(element.options[element.selectedIndex]) : undefined;
        default:
            return element.value;
        }
    },

    writeValue: function(element, value, allowUnset) {
        switch (tagNameLower(element)) {
        case 'option':
            switch(typeof value) {
            case "string":
                domData.set(element, selectExtensions.optionValueDomDataKey, undefined);
                if (hasDomDataExpandoProperty in element) { // IE <= 8 throws errors if you delete non-existent properties from a DOM node
                    delete element[hasDomDataExpandoProperty];
                }
                element.value = value;
                break;
            default:
                // Store arbitrary object using DomData
                domData.set(element, selectExtensions.optionValueDomDataKey, value);
                element[hasDomDataExpandoProperty] = true;

                // Special treatment of numbers is just for backward compatibility. KO 1.2.1 wrote numerical values to element.value.
                element.value = typeof value === "number" ? value : "";
                break;
            }
            break;
        case 'select':
            if (value === "" || value === null)       // A blank string or null value will select the caption
                value = undefined;
            var selection = -1;
            for (var i = 0, n = element.options.length, optionValue; i < n; ++i) {
                optionValue = selectExtensions.readValue(element.options[i]);
                // Include special check to handle selecting a caption with a blank string value
                if (optionValue == value || (optionValue === "" && value === undefined)) {
                    selection = i;
                    break;
                }
            }
            if (allowUnset || selection >= 0 || (value === undefined && element.size > 1)) {
                element.selectedIndex = selection;
            }
            break;
        default:
            if ((value === null) || (value === undefined))
                value = "";
            element.value = value;
            break;
        }
    }
};
