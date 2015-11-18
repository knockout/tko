/**
 * Originally based on (public domain):
 * https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js
 */
/* jshint -W083 */
Parser = (function () {
  var escapee = {
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
    operators = Expression.operators;

  /**
   * Construct a new Parser instance with new Parser(node, context)
   * @param {Node} node    The DOM element from which we parsed the
   *                         content.
   * @param {object} context The Knockout context.
   * @param {object} globals An object containing any desired globals.
   */
  function Parser(node, context, globals) {
    this.node = node;
    this.context = context;
    this.globals = globals || {};
  }

  // exported for testing.
  Parser.Expression = Expression;
  Parser.Identifier = Identifier;
  Parser.Node = Node;

  Parser.prototype.white = function () {
    var ch = this.ch;
    while (ch && ch <= ' ') {
      ch = this.next();
    }
    return ch;
  };

  Parser.prototype.next = function (c) {
    if (c && c !== this.ch) {
      this.error("Expected '" + c + "' but got '" + this.ch + "'");
    }
    this.ch = this.text.charAt(this.at);
    this.at += 1;
    return this.ch;
  };

  Parser.prototype.error = function (m) {
      // console.trace()
      throw {
          name:    'SyntaxError',
          message: m,
          at:      this.at,
          text:    this.text
      };
  };

  Parser.prototype.name = function () {
    // A name of a binding
    var name = '';
    this.white();

    var ch = this.ch;

    while (ch) {
      if (ch === ':' || ch <= ' ' || ch === ',') {
          return name;
      }
      name += ch;
      ch = this.next();
    }

    return name;
  };

  Parser.prototype.number = function () {
    var number,
        string = '',
        ch = this.ch;

    if (ch === '-') {
      string = '-';
      ch = this.next('-');
    }
    while (ch >= '0' && ch <= '9') {
      string += ch;
      ch = this.next();
    }
    if (ch === '.') {
      string += '.';
      ch = this.next();
      while (ch && ch >= '0' && ch <= '9') {
        string += ch;
        ch = this.next();
      }
    }
    if (ch === 'e' || ch === 'E') {
      string += ch;
      ch = this.next();
      if (ch === '-' || ch === '+') {
        string += ch;
        ch = this.next();
      }
      while (ch >= '0' && ch <= '9') {
        string += ch;
        ch = this.next();
      }
    }
    number = +string;
    if (!isFinite(number)) {
      error("Bad number");
    } else {
      return number;
    }
  };

  /**
   * Add a property to 'object' that equals the given value.
   * @param  {Object} object The object to add the value to.
   * @param  {String} key    object[key] is set to the given value.
   * @param  {mixed}  value  The value, may be a primitive or a function. If a
   *                         function it is unwrapped as a property.
   */
  Parser.prototype.object_add_value = function (object, key, value) {
    if (value instanceof Identifier || value instanceof Expression) {
      Object.defineProperty(object, key, {
        get: function () {
          return value.get_value();
        },
        enumerable: true,
      });
    } else {
      // primitives
      object[key] = value;
    }
  };

  Parser.prototype.object = function () {
    var key,
        object = {},
        ch = this.ch;

    if (ch === '{') {
      this.next('{');
      ch = this.white();
      if (ch === '}') {
        ch = this.next('}');
        return object;
      }
      while (ch) {
        if (ch === '"' || ch === "'") {
          key = this.string();
        } else {
          key = this.name();
        }
        this.white();
        ch = this.next(':');
        if (Object.hasOwnProperty.call(object, key)) {
          this.error('Duplicate key "' + key + '"');
        }

        this.object_add_value(object, key, this.expression());

        ch = this.white();
        if (ch === '}') {
          ch = this.next('}');
          return object;
        }

        this.next(',');
        ch = this.white();
      }
    }
    this.error("Bad object");
  };


  /**
   * Read up to delim and return the string
   * @param  {string} delim The delimiter, either ' or "
   * @return {string}       The string read.
   */
  Parser.prototype.read_string = function (delim) {
    var string = '',
        hex,
        i,
        uffff,
        ch = this.next();

    while (ch) {
      if (ch === delim) {
        ch = this.next();
        return string;
      }
      if (ch === '\\') {
        ch = this.next();
        if (ch === 'u') {
          uffff = 0;
          for (i = 0; i < 4; i += 1) {
            hex = parseInt(ch = this.next(), 16);
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
      ch = this.next();
    }

    this.error("Bad string");
  };

  Parser.prototype.string = function () {
    var ch = this.ch;
    if (ch === '"') {
      return this.read_string('"');
    } else if (ch === "'") {
      return this.read_string("'");
    }

    this.error("Bad string");
  };

  Parser.prototype.array = function () {
    var array = [],
        ch = this.ch;
    if (ch === '[') {
      ch = this.next('[');
      this.white();
      if (ch === ']') {
        ch = this.next(']');
        return array;
      }
      while (ch) {
        array.push(this.expression());
        ch = this.white();
        if (ch === ']') {
          ch = this.next(']');
          return array;
        }
        this.next(',');
        ch = this.white();
      }
    }
    this.error("Bad array");
  };

  Parser.prototype.value = function () {
    var ch;
    this.white();
    ch = this.ch;
    switch (ch) {
      case '{': return this.object();
      case '[': return this.array();
      case '"': case "'": return this.string();
      case '-': return this.number();
      default:
      return ch >= '0' && ch <= '9' ? this.number() : this.identifier();
    }
  };

  /**
   * Get the function for the given operator.
   * A `.precedence` value is added to the function, with increasing
   * precedence having a higher number.
   * @return {function} The function that performs the infix operation
   */
  Parser.prototype.operator = function () {
    var op = '',
        op_fn,
        ch = this.white();

    while (ch) {
      if (is_identifier_char(ch) || ch <= ' ' || ch === '' ||
          ch === '"' || ch === "'" || ch === '{' || ch === '[' ||
          ch === '(') {
        break;
      }
      op += ch;
      ch = this.next();
    }

    if (op !== '') {
      op_fn = operators[op];

      if (!op_fn) {
        this.error("Bad operator: '" + op + "'.");
      }
    }

    return op_fn;
  };

  /**
   * Parse an expression – builds an operator tree, in something like
   * Shunting-Yard.
   *   See: http://en.wikipedia.org/wiki/Shunting-yard_algorithm
   *
   * @return {function}   A function that computes the value of the expression
   *                      when called or a primitive.
   */
  Parser.prototype.expression = function () {
    var root,
        nodes = [],
        node_value,
        ch = this.white();

    while (ch) {
      // unary prefix operators
      op = this.operator();
      if (op) {
        nodes.push(undefined);  // padding.
        nodes.push(op);
      }

      if (ch === '(') {
        this.next();
        nodes.push(this.expression());
        this.next(')');
      } else {
        node_value = this.value();
        nodes.push(node_value);
      }
      ch = this.white();
      if (ch === ':' || ch === '}' || ch === ',' || ch === ']' ||
          ch === ')' || ch === '') {
        break;
      }
      // infix operators
      op = this.operator();
      if (op) {
        nodes.push(op);
      }
      ch = this.white();
    }

    if (nodes.length === 0) {
      return undefined;
    }

    if (nodes.length === 1) {
      return nodes[0];
    }

    return new Expression(nodes);
  };

  /**
   * A dereference applies to an identifer, being either a function
   * call "()" or a membership lookup with square brackets "[member]".
   * @return {fn or undefined}  Dereference function to be applied to the
   *                            Identifier
   */
  Parser.prototype.dereference = function () {
    var member,
        ch = this.white();

    while (ch) {
      if (ch === '(') {
        // a() function call
        this.next('(');
        this.white();
        this.next(')');
        return true;  // in Identifier::dereference we check this
      } else if (ch === '[') {
        // a[x] membership
        this.next('[');
        member = this.expression();
        this.white();
        this.next(']');

        return member;
      } else if (ch === '.') {
        // a.x membership
        member = '';
        this.next('.');
        ch = this.white();
        while (ch) {
          if (!is_identifier_char(ch)) {
            break;
          }
          member += ch;
          ch = this.next();
        }
        return member;
      } else {
        break;
      }
      ch = this.white();
    }
    return;
  };

  Parser.prototype.identifier = function () {
    var token = '', ch, deref, dereferences = [];
    ch = this.white();
    while (ch) {
      if (!is_identifier_char(ch)) {
        break;
      }
      token += ch;
      ch = this.next();
    }
    switch (token) {
      case 'true': return true;
      case 'false': return false;
      case 'null': return null;
      // we use `void 0` because `undefined` can be redefined.
      case 'undefined': return void 0;
      default:
    }
    while (ch) {
      deref = this.dereference();
      if (deref !== undefined) {
        dereferences.push(deref);
      } else {
        break;
      }
    }
    return new Identifier(this, token, dereferences);
  };

  Parser.prototype.bindings = function () {
    var key,
        bindings = {},
        sep,
        ch = this.ch;

    while (ch) {
      key = this.name();
      sep = this.white();
      if (!sep || sep === ',') {
        if (sep) {
          ch = this.next(',');
        } else {
          ch = '';
        }
        // A "bare" binding e.g. "text"; substitute value of 'null'
        // so it becomes "text: null".
        bindings[key] = null;
      } else {
        ch = this.next(':');
        bindings[key] = this.expression();
        this.white();
        if (this.ch) {
          ch = this.next(',');
        } else {
          ch = '';
        }
      }
    }
    return bindings;
  };

/**
 * Convert result[name] from a value to a function (i.e. `valueAccessor()`)
 * @param  {object} result [Map of top-level names to values]
 * @return {object}        [Map of top-level names to functions]
 *
 * Accessors may be one of constAccessor (below), identifierAccessor or
 * expressionAccessor.
 */
  Parser.prototype.convert_to_accessors = function (result) {
    var propertyWriters = {};
    ko.utils.objectForEach(result, function (name, value) {
      if (value instanceof Identifier) {
        // use _twoWayBindings so the binding can update Identifier
        // See http://stackoverflow.com/questions/21580173
        result[name] = function () {
          return value.get_value();
        };

        if (ko.expressionRewriting._twoWayBindings[name]) {
          propertyWriters[name] = function(new_value) {
            value.set_value(new_value);
          };
        }
      } else if (value instanceof Expression) {
        result[name] = function expressionAccessor() {
          return value.get_value();
        };
      } else if (typeof(value) != 'function') {
        result[name] = function constAccessor() {
          return value;
        };
      }
    });

    if (Object.keys(propertyWriters).length > 0) {
      result._ko_property_writers = function () {
        return propertyWriters;
      };
    }

    return result;
  };

  /**
   * Get the bindings as name: accessor()
   * @param  {string} source The binding string to parse.
   * @return {object}        Map of name to accessor function.
   */
  Parser.prototype.parse = function (source) {
    this.text = (source || '').trim();
    this.at = 0;
    this.ch = ' ';

    if (!this.text) {
      return null;
    }

    var result = this.bindings();

    this.white();
    if (this.ch) {
      this.error("Syntax Error");
    }

    return this.convert_to_accessors(result);
  };

  return Parser;
})();
