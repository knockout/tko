//
// String (and JSON)
//

import { unwrap } from  './obs.js'
import { tagNameLower, getFormFields } from './dom.js'


export function stringTrim (string) {
    return string === null || string === undefined ? '' :
        string.trim ?
            string.trim() :
            string.toString().replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
}


export function stringStartsWith (string, startsWith) {
    string = string || "";
    if (startsWith.length > string.length)
        return false;
    return string.substring(0, startsWith.length) === startsWith;
}


export function parseJson (jsonString) {
    if (typeof jsonString == "string") {
        jsonString = stringTrim(jsonString);
        if (jsonString) {
            if (JSON && JSON.parse) // Use native parsing where available
                return JSON.parse(jsonString);
            return (new Function("return " + jsonString))(); // Fallback on less safe parsing for older browsers
        }
    }
    return null;
}


export function stringifyJson (data, replacer, space) {   // replacer and space are optional
    if (!JSON || !JSON.stringify)
        throw new Error("Cannot find JSON.stringify(). Some browsers (e.g., IE < 8) don't support it natively, but you can overcome this by adding a script reference to json2.js, downloadable from http://www.json.org/json2.js");
    return JSON.stringify(unwrap(data), replacer, space);
}


// DEPRECATE?
var fieldsIncludedWithJsonPost = [
  'authenticity_token', /^__RequestVerificationToken(_.*)?$/
];

export function postJson (urlOrForm, data, options) {
    options = options || {};
    var params = options['params'] || {};
    var includeFields = options['includeFields'] || this.fieldsIncludedWithJsonPost;
    var url = urlOrForm;

    // If we were given a form, use its 'action' URL and pick out any requested field values
    if((typeof urlOrForm == 'object') && (tagNameLower(urlOrForm) === "form")) {
        var originalForm = urlOrForm;
        url = originalForm.action;
        for (var i = includeFields.length - 1; i >= 0; i--) {
            var fields = getFormFields(originalForm, includeFields[i]);
            for (var j = fields.length - 1; j >= 0; j--)
                params[fields[j].name] = fields[j].value;
        }
    }

    data = unwrap(data);
    var form = document.createElement("form");
    form.style.display = "none";
    form.action = url;
    form.method = "post";
    for (var key in data) {
        // Since 'data' this is a model object, we include all properties including those inherited from its prototype
        var input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = stringifyJson(unwrap(data[key]));
        form.appendChild(input);
    }
    objectForEach(params, function(key, value) {
        var input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
    });
    document.body.appendChild(form);
    options['submitter'] ? options['submitter'](form) : form.submit();
    setTimeout(function () { form.parentNode.removeChild(form); }, 0);
}
