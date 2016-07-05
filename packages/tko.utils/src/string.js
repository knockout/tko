//
// String (and JSON)
//


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
    return JSON.stringify(typeof data === 'function' ? data() : data, replacer, space);
}
