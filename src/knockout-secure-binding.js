;(function(factory) {
    //AMD
    if (typeof define === "function" && define.amd) {
        define(["knockout", "exports"], factory);
        //normal script tag
    } else {
        factory(ko);
    }
}(function(ko, exports, undefined) {
    var NAME_REX_0 = new RegExp("[_A-Za-z]"),
    NAME_REX_N = new RegExp("_A-Za-z0-9]"),
    IDENTIFIER_REX_0 = new RegExp("_A-Za-z]"),
    IDENTIFIER_REX_N = new RegExp("_A-Za-z0-9\.]"),
    identifier_strategies = {
        id: function (name, obj) {
            return obj ? obj[name] : void 0
        },
        fn: function (name, obj) {
            return obj ? obj[name]() : void 0
        },
    }

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
        this.bindings = bindings || ko.bindingHandlers;
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

    // return a function that performs a lookup on context
    function make_accessor(string, context, node) {
        var keys = string.split("."),
        strategies = [];

        keys.forEach(function (key) {
            var name,
            strategy,
            keyLen = key.length;

            if (key.substr(keyLen - 2) == "()") {
                // function
                name = key.slice(0, keyLen - 2);
                strategy = 'fn';
            } else {
                name = key;
                strategy = 'id';
            }

            strategies.push({
                name: name,
                execute: identifier_strategies[strategy]
            })
        });

        function identifierAccessor() {
            var value;

            if (strategies[0].name === "$context") {
                // unshift $context
                strategies.shift();
                value = context;
            } else if (strategies[0].name === "$element") {
                // $element is the node bound
                strategies.shift();
                value = node;
            } else if (context && context.$data) {
                // Return $data if the first-dotted value is defined
                // emulates with(context){with(context.$data){...}}
                value = Object.hasOwnProperty.call(context.$data,
                    strategies[0].name) ? context.$data : context;
            } else {
                // The default is the $context.
                value = context;
            }

            strategies.forEach(function (strategy) {
                value = strategy.execute(strategy.name, value)
            })

            return value
        }

        return identifierAccessor
    }

    /* Based on (public domain):
    https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js
    */
    parse = (function () {
        var at,     // The index of the current character
            ch,     // The current character
            escapee = {
                "'": "'",
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
            name = function () {
                // A name of a binding
                // [_A-Za-z][_A-Za-z0-9]*
                var name = '';
                white();

                while (ch) {
                    if (ch === ':' || ch === ' ') {
                        return name;
                    }
                    name += ch;
                    next()
                }
                return name;
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
                } else if (ch === "'") {
                    while (next()) {
                        if (ch === "'") {
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
            lookup = function (node, context, id) {
                switch (id) {
                    case 'true': return true;
                    case 'false': return false;
                    case 'null': return null;
                    case 'undefined': return void 0;
                    default:
                }

                return make_accessor(id, context, node);
            },
            identifier = function (node, context) {
                // an identifier we look up
                var id = '';
                white();

                while (ch) {
                    if (ch === ':' || ch === '}' || ch === ',' || ch === ' ' || ch === ']') {
                        return lookup(node, context, id);
                    }
                    id += ch;
                    next()
                }
                return lookup(node, context, id);
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
                        if (ch === '"' || ch === "'") {
                            key = string();
                        } else {
                            key = name();
                        }
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
            },
            bindings = function (node, context) {
                // parse a set of name: value pairs
                var key,
                bindings = {};
                while (ch) {
                    key = name();
                    white()
                    next(":")
                    bindings[key] = value(node, context);
                    white()
                    if (ch) {
                        next(',')
                    }
                }
                return bindings;
            };
            value = function (node, context) {
                // Parse a JSON value.
                white();
                switch (ch) {
                    case '{': return object();
                    case '[': return array();
                    case '"': case "'": return string();
                    case '-': return number();
                    default:
                    return ch >= '0' && ch <= '9' ? number()
                    : identifier(node, context);
                }
            };
            // Return the parse function. It will have access to all
            // of the above functions and variables.
            return function (source, node, context) {
                var result;
                text = source;
                at = 0;
                ch = ' ';
                result = bindings(node, context);

                white();
                if (ch) {
                    error("Syntax error");
                }

                ko.utils.objectForEach(result, function (name, value) {
                    if (typeof(value) != 'function') {
                        result[name] = function constAccessor() {
                            return value
                        }
                    }
                })
                return result;
            };
        }());

    // Return the name/valueAccessor pairs.
    // (undocumented replacement for getBindings)
    // see https://github.com/knockout/knockout/pull/742
    function getBindingAccessors(node, context) {
        var bindings = {},
        sbind_string;

        if (node.nodeType === node.ELEMENT_NODE) {
            sbind_string = node.getAttribute(this.attribute);
        }

        if (sbind_string) {
            bindings = parse(sbind_string, node, context);
        }

        return bindings;
    }

    ko.utils.extend(secureBindingsProvider.prototype, {
        registerBindings: registerBindings,
        nodeHasBindings: nodeHasBindings,
        getBindingAccessors: getBindingAccessors,
        parse: parse,
        make_accessor: make_accessor,
    })

    if (!exports) {
        ko.secureBindingsProvider = secureBindingsProvider;
    }

    return secureBindingsProvider;
}));
