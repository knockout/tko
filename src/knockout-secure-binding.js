;(function(factory) {
    //AMD
    if (typeof define === "function" && define.amd) {
        define(["knockout", "exports"], factory);
        //normal script tag
    } else {
        factory(ko);
    }
}(function(ko, exports, undefined) {
    function secureBindingsProvider(bindings, options) {
        var existingProvider = new ko.bindingProvider();
        options = options || {};

        // override the attribute
        this.attribute = options.attribute || "data-sbind";

        // override the virtual attribute
        this.virtualAttribute = options.virtualAttribute || "ksb ";

        // fallback to the existing binding provider
        // if bindings are not found
        this.fallback = options.fallback;

        // the binding classes -- defaults to ko bindingsHandlers
        this.bindings = bindings || ko.bindingsHandlers;
    }

    function registerBindings(newBindings) {
        ko.utils.extend(this.bindings, newBindings);
    }

    function nodeHasBindings(node) {
        var result, value;

        if (node.nodeType === node.ELEMENT_NODE) {
            result = node.getAttribute(this.attribute);
        } else if (node.nodeType === node.COMMENT_NODE) {
            value = "" + node.nodeValue || node.text;
            result = value.indexOf(this.virtualAttribute) > -1;
        }

        if (!result && this.fallback) {
            result = existingProvider.nodeHasBindings(node);
        }

        return result;
    }

    // Characters that can make up an identifier.
    // Regex of [_A-Za-z][_A-Za-z0-9\.]*
    //
    // FIXME - lots of room for improvement, here.
    //
    function valid_identifier_char(ch, is_first_char) {
        if (ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z" || ch === '_') {
            return true;
        }
        if (is_first_char) {
            return false;
        }
        return (ch >= '0' && ch <= '9' || ch == '.')
    }

    /* Based on (public domain), with modified `word`:
    https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js
    */
    parse = (function () {
        var at,     // The index of the current character
            ch,     // The current character
            escapee = {
                '"':  '"',
                '\\': '\\',
                '/':  '/',
                b:    '\b',
                f:    '\f',
                n:    '\n',
                r:    '\r',
                t:    '\t'
            },
            text,
            error = function (m) {
                throw {
                    name:    'SyntaxError',
                    message: m,
                    at:      at,
                    text:    text
                };
            },
            next = function (c) {
                // If a c parameter is provided, verify that it matches
                // the current character.
                if (c && c !== ch) {
                    error("Expected '" + c + "' instead of '" + ch + "'");
                }

                // Get the next character. When there are no more
                // characters, return the empty string.

                ch = text.charAt(at);
                at += 1;
                return ch;
            },
            number = function () {
                // Parse a number value.
                var number,
                string = '';
                if (ch === '-') {
                    string = '-';
                    next('-');
                }
                while (ch >= '0' && ch <= '9') {
                    string += ch;
                    next();
                }
                if (ch === '.') {
                    string += '.';
                    while (next() && ch >= '0' && ch <= '9') {
                        string += ch;
                    }
                }
                if (ch === 'e' || ch === 'E') {
                    string += ch;
                    next();
                    if (ch === '-' || ch === '+') {
                        string += ch;
                        next();
                    }
                    while (ch >= '0' && ch <= '9') {
                        string += ch;
                        next();
                    }
                }
                number = +string;
                if (!isFinite(number)) {
                    error("Bad number");
                } else {
                    return number;
                }
            },
            string = function () {
                // Parse a string value.
                var hex,
                i,
                string = '',
                uffff;
                // When parsing for string values, we must look for " and
                // \ characters.
                if (ch === '"') {
                    while (next()) {
                        if (ch === '"') {
                            next();
                            return string;
                        }
                        if (ch === '\\') {
                            next();
                            if (ch === 'u') {
                                uffff = 0;
                                for (i = 0; i < 4; i += 1) {
                                    hex = parseInt(next(), 16);
                                    if (!isFinite(hex)) {
                                        break;
                                    }
                                    uffff = uffff * 16 + hex;
                                }
                                string += String.fromCharCode(uffff);
                            } else if (typeof escapee[ch] === 'string') {
                                string += escapee[ch];
                            } else {
                                break;
                            }
                        } else {
                            string += ch;
                        }
                    }
                }
                error("Bad string");
            },
            white = function () {
                // Skip whitespace.
                while (ch && ch <= ' ') {
                    next();
                }
            },
            word = function () {
                // a word we look up
                var word = '',
                lookup_fn;

                while (valid_identifier_char(ch)) {
                    word += ch;
                    next()
                }

                switch (word) {
                    case 'true': return true;
                    case 'false': return false;
                    case 'null': return null;
                    case 'undefined': return void 0;
                    default: return lookup_value(word)
                }
            },
            value,  // Place holder for the value function.
            array = function () {
                // Parse an array value.
                var array = [];
                if (ch === '[') {
                    next('[');
                    white();
                    if (ch === ']') {
                        next(']');
                        return array;   // empty array
                    }
                    while (ch) {
                        array.push(value());
                        white();
                        if (ch === ']') {
                            next(']');
                            return array;
                        }
                        next(',');
                        white();
                    }
                }
                error("Bad array");
            },
            object = function () {
            // Parse an object value.
            var key,
            object = {};

            if (ch === '{') {
                next('{');
                white();
                if (ch === '}') {
                    next('}');
                    return object;   // empty object
                }
                while (ch) {
                    key = string();
                    white();
                    next(':');
                    if (Object.hasOwnProperty.call(object, key)) {
                        error('Duplicate key "' + key + '"');
                    }
                    object[key] = value();
                    white();
                    if (ch === '}') {
                        next('}');
                        return object;
                    }
                    next(',');
                    white();
                }
            }
            error("Bad object");
        };
        value = function () {
                // Parse a JSON value. It could be an object, an array, a
                // string, a number, or a word.
                white();
                switch (ch) {
                    case '{': return object();
                    case '[': return array();
                    case '"': return string();
                    case '-': return number();
                    default:
                    return ch >= '0' && ch <= '9' ? number() : word();
                }
            };
            // Return the parse function. It will have access to all
            // of the above functions and variables.
            return function (source) {
                var result;
                text = source;
                at = 0;
                ch = ' ';
                result = value();
                white();
                if (ch) {
                    error("Syntax error");
                }
                return result;
            };
        }());

    // return the binding
    function getBindings(node, context) {

    }

    ko.utils.extend(secureBindingsProvider.prototype, {
        registerBindings: registerBindings,
        nodeHasBindings: nodeHasBindings,
        getBindings: getBindings,
        parse: parse,
    })

    if (!exports) {
        ko.secureBindingsProvider = secureBindingsProvider;
    }

    return secureBindingsProvider;
}));
