/**
 * Originally based on (public domain):
 * https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js
 */
/* jshint -W083 */

 var Parser = (function () {
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

  identifier_strategies = {
    id: function (name, obj) {
      return obj ? obj[name] : void 0;
    },
    fn: function (name, obj) {
      return obj ? obj[name]() : void 0;
    },
  },

  prefix_ops = {
    '!': function (v) { return !v; },
    '~': function (v) { return ~v; },
    '-': function (v) { return -v; },
  },

  operators = {
    // mul/div
    '*': function (a, b) { return a * b; },
    '/': function (a, b) { return a / b; },
    '%': function (a, b) { return a % b; },
    // sub/add
    '+': function (a, b) { return a + b; },
    '-': function (a, b) { return a - b; },
    // relational
    '<': function (a, b) { return a < b; },
    '<=': function (a, b) { return a <= b; },
    '>': function (a, b) { return a > b; },
    '>=': function (a, b) { return a >= b; },
    'in': function (a, b) { return a in b; },
    'instanceof': function (a, b) { return a instanceof b; },
    // equality
    '==': function (a, b) { return a == b; },
    '!=': function (a, b) { return a != b; },
    '===': function (a, b) { return a === b; },
    '!==': function (a, b) { return a !== b; },
    // logic
    '&&': function (a, b) { return a && b; },
    '||': function (a, b) { return a || b; },
  };

  /* In order of precedence, see:
    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence#Table
  */
    // multiply/divide/mod
  operators['*'].precedence = 5;
  operators['/'].precedence = 5;
  operators['%'].precedence = 5;
    // add/sub
  operators['+'].precedence = 6;
  operators['-'].precedence = 6;
    // relational
  operators['<'].precedence = 8;
  operators['<='].precedence = 8;
  operators['>'].precedence = 8;
  operators['>='].precedence = 8;
  operators['in'].precedence = 8;
  operators['instanceof'].precedence = 8;
    // equality
  operators['=='].precedence = 9;
  operators['!='].precedence = 9;
  operators['==='].precedence = 9;
  operators['!=='].precedence = 9;
    // logic
  operators['&&'].precedence = 13;
  operators['||'].precedence = 14;


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

  Parser.operators = operators;

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
        throw {
            name:    'SyntaxError',
            message: m,
            at:      this.at,
            text:    this.text
        };
  };

  Parser.prototype.name = function () {
    // A name of a binding
    // [_A-Za-z][_A-Za-z0-9]*
    var name = '';
    this.white();

    ch = this.ch;

    while (ch) {
      if (ch === ':' || ch === ' ') {
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
    if (typeof(value) !== 'function') {
      // primitives
      object[key] = value;
    } else {
      // Handle cases where object[key] is not a primitive.
      Object.defineProperty(object, key, {
        get: function () { return value(); },
        enumerable: true
      });
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
   * Return the $context, $context.$data, $element where we find the
   * given element.
   * @param  {string} name      The property name sought.
   * @param  {array} strategies  An array of keys/methods to look up the
   *                             desired value.
   * @return {object}  The object containing the name.
   */
  Parser.prototype.get_lookup_root = function (name, strategies) {
    var context = this.context,
        node = this.node;

    if (name === "$context") {
      // unshift $context
      strategies.shift();
      return context;
    }

    if (name === "$element") {
      // $element is the node bound
      strategies.shift();
      return node;
    }

    if (context && context.$data &&
      Object.hasOwnProperty.call(context.$data, name)) {

      // Return $data if the first-dotted value is defined
      // emulates with(context){with(context.$data){...}}
      return context.$data;
    }

    if (context && Object.hasOwnProperty.call(context, name)) {
      return context;
    }

    return this.globals;
  };

  /**
   * Generate a function that looks up a value
   * @param  {string} id  The value to be looked up e.g. x.y.z
   * @return {function}   An accessor that returns the looked up value.
   */
  Parser.prototype.make_accessor = function (id) {
    var keys = id.split("."),
        negation = void 0,
        strategies = [],
        get_lookup_root = this.get_lookup_root.bind(this);

    // negation operator(s)
    while (keys[0][0] === '!') {
      negation = !negation;
      keys[0] = keys[0].substring(1);
    }

    keys.forEach(function (key) {
        var name,
            strategy,
            keyLen = key.length;

        if (key.substr(keyLen - 2) === "()") {
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
        });
    });

    function identifierAccessor() {
        var value = get_lookup_root(strategies[0].name, strategies);

        strategies.forEach(function (strategy) {
            value = strategy.execute(strategy.name, value);
        });

        if (typeof(negation) == 'undefined') {
          return value;
        }

        // !!observable only works if we unwrap the value, so if we saw a
        // '!' we unwrap the result.
        return negation ? !ko.unwrap(value) : ko.unwrap(value);
    }

    return identifierAccessor;
  };

  Parser.prototype.lookup = function (id) {
    switch (id) {
      case 'true': return true;
      case 'false': return false;
      case 'null': return null;
      case 'undefined': return void 0;
      default: return this.make_accessor(id);
    }
  };

  /**
   * Get the function for the given operator.
   * A `.precedence` value is added to the function, with increasing
   * precedence having a higher number.
   * @return {function} The function that performs the infix operation
   */
  Parser.prototype.infix_operator = function () {
    var op = '',
        op_fn,
        ch = this.white();

    while (ch) {
      if (ch == ' ') {
        break;
      }
      op += ch;
      ch = this.next();
    }

    op_fn = operators[op];

    if (!op_fn) {
      this.error("Bad operator: '" + op + "'.");
    }

    return op_fn;
  };

  /**
   * Return a function that calculates and returns an expression when called.
   * @param  {array} ops  The operations to perform
   * @return {function}   The function that calculates the expression.
   */
  Parser.prototype.make_expression_accessor = function (root) {
    function node_value(node) {
      var lhs, rhs;
      if (typeof(node) === 'function') {
        // Expressions on observables are nonsensical, so we unwrap any
        // function values (e.g. identifiers).
        return ko.unwrap(node());
      }
      if (typeof(node) !== 'object') {
        return node;
      }
      lhs = node.lhs;
      rhs = node.rhs;
      // The node could be a regular object - weird though that may be.
      // If it has a 'rhs', 'llhs' and 'op' properties, we take it as a node.
      //  ^^^ TODO/FIXME - Practical, but arbitrary & perhaps not strict enough.
      if (lhs && rhs && node.op) {
        return node.op(node_value(lhs), node_value(rhs));
      }
      return node;
    }
    function expressionAccessor() {
      return node_value(root);
    }
    return expressionAccessor;
  };

  /**
   *  Convert an array of nodes to an executable tree.
   *  @return {object} An object with a `lhs`, `rhs` and `op` key, corresponding
   *                      to the left hand side, right hand side, and
   *                      operation function.
   */
  Parser.prototype.expression_nodes_to_tree = function (nodes) {
    var root,
        leaf,
        op,
        value;

    // primer
    leaf = root = {
      lhs: nodes.shift(),
      op: nodes.shift(),
      rhs: nodes.shift(),
    };

    while (nodes) {
      op = nodes.shift();
      value = nodes.shift();
      if (!op) {
        return root;
      }
      if (op.precedence > root.op.precedence) {
        // rebase
        root = {
          lhs: root,
          op: op,
          rhs: value,
        };
        leaf = root;
      } else {
        leaf.rhs = {
          lhs: leaf.rhs,
          op: op,
          rhs: value,
        };
        leaf = leaf.rhs;
      }
    }

    return root;
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
        ch = this.white();

    while (ch) {
      if (ch === '(') {
        this.next();
        nodes.push(this.expression());
        this.next(')');
      } else {
        nodes.push(this.value());
      }
      ch = this.white();
      if (ch === ':' || ch === '}' || ch === ',' || ch === ']' ||
          ch === ')' || ch === '') {
        break;
      }
      op = this.infix_operator();
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

    return this.make_expression_accessor(
      this.expression_nodes_to_tree(nodes)
    );
  };

  Parser.prototype.identifier = function () {
    var id = '', ch;
    ch = this.white();

    while (ch) {
      if (ch === ':' || ch === '}' || ch === ',' || ch === ' ' ||
          ch === ']' || ch === ')') {
        return this.lookup(id);
      }
      id += ch;
      ch = this.next();
    }
    return this.lookup(id);
  };

  Parser.prototype.bindings = function () {
    var key,
        bindings = {},
        ch = this.ch;

    while (ch) {
      key = this.name();
      this.white();
      ch = this.next(":");
      bindings[key] = this.expression();
      this.white();
      if (this.ch) {
        ch = this.next(',');
      } else {
        ch = '';
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
    ko.utils.objectForEach(result, function (name, value) {
      if (typeof(value) != 'function') {
        result[name] = function constAccessor() {
          return value;
        };
      }
    });
    return result;
  };

  /**
   * Get the bindings as name: accessor()
   * @param  {string} source The binding string to parse.
   * @return {object}        Map of name to accessor function.
   */
  Parser.prototype.parse = function (source) {
    this.text = source;
    this.at = 0;
    this.ch = ' ';

    result = this.bindings();

    this.white();
    if (this.ch) {
      this.error("Syntax Error");
    }

    return this.convert_to_accessors(result);
  };

  return Parser;
})();

