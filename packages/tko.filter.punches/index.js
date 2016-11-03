
import {
    unwrap, toJS
} from 'tko.observable';

var sproto = String.prototype;

var filters = {};

// Convert value to uppercase
filters.uppercase = function(value) {
    return sproto.toUpperCase.call(unwrap(value));
};

// Convert value to lowercase
filters.lowercase = function(value) {
    return sproto.toLowerCase.call(unwrap(value));
};

// Return default value if the input value is empty or null
filters['default'] = function (value, defaultValue) {
    value = unwrap(value);
    if (typeof value === "function") {
        return value;
    }
    if (typeof value === "string") {
        return sproto.trim.call(value) === '' ? defaultValue : value;
    }
    return value == null || value.length == 0 ? defaultValue : value;
};

// Return the value with the search string replaced with the replacement string
filters.replace = function(value, search, replace) {
    return sproto.replace.call(unwrap(value), search, replace);
};

filters.fit = function(value, length, replacement, trimWhere) {
    value = unwrap(value);
    if (length && ('' + value).length > length) {
        replacement = '' + (replacement || '...');
        length = length - replacement.length;
        value = '' + value;
        switch (trimWhere) {
            case 'left':
                return replacement + value.slice(-length);
            case 'middle':
                var leftLen = Math.ceil(length / 2);
                return value.substr(0, leftLen) + replacement + value.slice(leftLen-length);
            default:
                return value.substr(0, length) + replacement;
        }
    } else {
        return value;
    }
};

// Convert a model object to JSON
filters.json = function(rootObject, space, replacer) {
       // replacer and space are optional
    return JSON.stringify(toJS(rootObject), replacer, space);
};

// Format a number using the browser's toLocaleString
filters.number = function(value) {
    return (+unwrap(value)).toLocaleString();
};

// Export the filters object for general access
export { filters };
