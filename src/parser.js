/**
 * Originally based on (public domain):
 * https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js
 */

import {
  options, objectForEach, clonePlainObjectDeep, extend
} from 'tko.utils';

import Expression from './expression';
import Identifier from './identifier';
import Arguments from './arguments';
import Ternary from './ternary';
import Node from './node';

var escapee = {
    "'": "'",
    '"':  '"',
    "`":  "`",
    '\\': '\\',
    '/':  '/',
    '$':  '$',
    b:    '\b',
    f:    '\f',
    n:    '\n',
    r:    '\r',
    t:    '\t'
  },
  operators = Node.operators;

/**
 * Construct a new Parser instance with new Parser(node, context)
 * @param {Node} node    The DOM element from which we parsed the
 *                         content.
 * @param {object} context The Knockout context.
 * @param {object} globals An object containing any desired globals.
 */
export default function Parser(node, context, globals) {
  this.node = node;
  this.context = context;
  this.globals = globals || {};
}

// Exposed for testing.
Parser.Expression = Expression;
Parser.Identifier = Identifier;
Parser.Arguments = Arguments;
Parser.Node = Node;

Parser.prototype.white = function () {
  var ch = this.ch;
  while (ch && ch <= ' ') {
    ch = this.next();
  }
  return this.comment(ch);
};

/**
 * Slurp any C or C++ style comments
 */
Parser.prototype.comment = function (ch) {
  if (ch !== '/') { return ch; }
  var p = this.at;
  var second = this.lookahead();
  if (second === '/') {
    while(ch) {
      ch = this.next();
      if (ch === '\n' || ch === '\r') { break; }
    }
    ch = this.next();
  } else if (second === '*') {
    while(ch) {
      ch = this.next();
      if (ch === '*' && this.lookahead() === '/') {
        this.next();
        break;
      }
    }
    if (!ch) {
      this.error("Unclosed comment, starting at character " + p);
    }
    this.next();
    return this.white();
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

Parser.prototype.lookahead = function() {
  return this.text[this.at];
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
  var name = '',
    enclosed_by;
  this.white();

  var ch = this.ch;

  if (ch === "'" || ch === '"') {
    enclosed_by = ch;
    ch = this.next();
  }

  while (ch) {
    if (enclosed_by && ch === enclosed_by) {
      this.white();
      ch = this.next();
      if (ch !== ':' && ch !== ',') {
        this.error(
          "Object name: " + name + " missing closing " + enclosed_by
        );
      }
      return name;
    } else if (ch === ':' || ch <= ' ' || ch === ',' || ch === '|') {
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
    options.onError(new Error("Bad number: " + number + " in " + string));
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
  if (value && value[Node.isExpressionOrIdentifierSymbol]) {
    Object.defineProperty(object, key, {
      get: function () {
        return value.get_value();
      },
      enumerable: true
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
      if (ch === '"' || ch === "'" || ch === "`") {
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
    nodes = [''],
    plus_op = operators['+'],
    hex,
    i,
    uffff,
    interpolate = delim === "`",
    ch = this.next();

  while (ch) {
    if (ch === delim) {
      ch = this.next();
      if (interpolate) { nodes.push(plus_op); }
      nodes.push(string);
      return nodes;
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
    } else if (interpolate && ch === "$") {
      ch = this.next();
      if (ch === '{') {
        this.next('{');
        nodes.push(plus_op);
        nodes.push(string);
        nodes.push(plus_op);
        nodes.push(this.expression());
        string = '';
        // this.next('}');
      } else {
        string += "$" + ch;
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
    return this.read_string('"').join('');
  } else if (ch === "'") {
    return this.read_string("'").join('');
  } else if (ch === "`") {
    return Node.create_root(this.read_string("`"));
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
  case '"': case "'": case "`": return this.string();
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
Parser.prototype.operator = function (not_an_array) {
  var op = '',
    op_fn,
    ch = this.white();

  while (ch) {
    if (is_identifier_char(ch) || ch <= ' ' || ch === '' ||
        ch === '"' || ch === "'" || ch === '{' || ch === '(' ||
        ch === "`" || ch === ')') {
      break;
    }

    if (!not_an_array && ch === '[') {
      break;
    }

    op += ch;
    ch = this.next();

    // An infix followed by the prefix e.g. a + @b
    // TODO: other prefix unary operators
    if (ch === '@') {
      break;
    }
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
 * Filters
 * Returns what the Node interprets as an "operator".
 * e.g.
 *   <span data-bind="text: name | fit:20 | uppercase"></span>
 */
Parser.prototype.filter = function() {
  var ch = this.next(),
    args = [],
    next_filter = function(v) { return v; },
    name = this.name();

  if (!options.filters[name]) {
    options.onError("Cannot find filter by the name of: " + name);
  }

  ch = this.white();

  while (ch) {
    if (ch === ':') {
      ch = this.next();
      args.push(this.expression('|'));
    }

    if (ch === '|') {
      next_filter = this.filter();
      break;
    }

    if (ch === ',') { break; }

    ch = this.white();
  }

  var filter = function filter(value) {
    var arg_values = [value];

    for (var i = 0, j = args.length; i < j; ++i) {
      arg_values.push(Node.value_of(args[i]));
    }

    return next_filter(options.filters[name].apply(null, arg_values));
  };

  // Lowest precedence.
  filter.precedence = 1;
  return filter;
};


/**
 * Parse an expression – builds an operator tree, in something like
 * Shunting-Yard.
 *   See: http://en.wikipedia.org/wiki/Shunting-yard_algorithm
 *
 * @return {function}   A function that computes the value of the expression
 *                      when called or a primitive.
 */
Parser.prototype.expression = function (filterable) {
  var op,
    nodes = [],
    ch = this.white();

  while (ch) {
    // unary prefix operators
    op = this.operator();
    if (op) {
      nodes.push(undefined);  // LHS Tree node.
      nodes.push(op);
      ch = this.white();
    }

    if (ch === '(') {
      this.next();
      nodes.push(this.expression());
      this.next(')');
    } else {
      nodes.push(this.value());
    }
    ch = this.white();

    if (ch === ':' || ch === '}' || ch === ',' || ch === ']' ||
        ch === ')' || ch === '' || ch === '`' || (ch === '|' && filterable === '|')) {
      break;
    }

    // filters
    if (ch === '|' && this.lookahead() !== '|' && filterable) {
      nodes.push(this.filter());
      nodes.push(undefined);
      break;
    }

    // infix or postfix operators
    op = this.operator(true);

    if (op === operators['?']) {
      this.ternary(nodes);
      break;
    } else if (op === operators['.']) {
      nodes.push(op);
      nodes.push(this.member());
      op = null;
    } else if (op === operators['[']) {
      nodes.push(op);
      nodes.push(this.expression());
      ch = this.next(']');
      op = null;
    } else if (op) {
      nodes.push(op);
    }

    ch = this.white();

    if (ch === ']' || (!op && ch === '(')) { break; }
  }

  if (nodes.length === 0) {
    return undefined;
  }

  var dereferences = this.dereferences();

  if (nodes.length === 1 && !dereferences.length) {
    return nodes[0];
  }

  for (var i = 0, j = dereferences.length; i < j; ++i) {
    var deref = dereferences[i];
    if (deref.constructor === Arguments) {
      nodes.push(operators.call);
    } else {
      nodes.push(operators['.']);
    }
    nodes.push(deref);
  }

  return new Expression(nodes);
};


Parser.prototype.ternary = function(nodes) {
  var ternary = new Ternary();
  ternary.yes = this.expression();
  this.next(":");
  ternary.no = this.expression();
  nodes.push(operators['?']);
  nodes.push(ternary);
};

/**
 * Parse the arguments to a function, returning an Array.
 *
 */
Parser.prototype.func_arguments = function () {
  var args = [],
    ch = this.next('(');

  while(ch) {
    ch = this.white();
    if (ch === ')') {
      this.next(')');
      return new Arguments(this, args);
    } else {
      args.push(this.expression());
      ch = this.white();
    }
    if (ch !== ')') { this.next(','); }
  }

  this.error("Bad arguments to function");
};


/**
 * The literal string reference `abc` in an `x.abc` expression.
 */
Parser.prototype.member = function () {
  var member = '',
    ch = this.white();
  while (ch) {
    if (!is_identifier_char(ch)) {
      break;
    }
    member += ch;
    ch = this.next();
  }
  return member;
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
      // a(...) function call
      return this.func_arguments();
    } else if (ch === '[') {
      // a[x] membership
      this.next('[');
      member = this.expression();
      this.white();
      this.next(']');

      return member;
    } else if (ch === '.') {
      // a.x membership
      this.next('.');
      return this.member();
    } else {
      break;
    }
  }
  return;
};

Parser.prototype.dereferences = function () {
  var ch = this.white(),
    dereferences = [],
    deref;

  while (ch) {
    deref = this.dereference();
    if (deref !== undefined) {
      dereferences.push(deref);
    } else {
      break;
    }
  }
  return dereferences;
};


Parser.prototype.identifier = function () {
  var token = '', ch;
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
  case 'undefined': return void 0;
  case 'function':
    throw new Error("Knockout: Anonymous functions are no longer supported, but `=>` lambas are.");
    //return this.anonymous_fn();
  }
  return new Identifier(this, token, this.dereferences());
};


/* Parse an anomymous function () {} ...

 NOTE: Anonymous functions are not supported, primarily because
 this is not a full Javascript parser.  While a subset of anonymous
 functions can (and may) be supported, notably lambda-like (a single
 statement), at this time an error is raised to indiate that the binding
 has failed and the => lambda workaround.

Parser.prototype.anonymous_fn = function () {
  var expr;
  this.white();
  this.next("(");
  this.white();
  this.next(")");
  this.white();
  this.next("{");
  this.white();
  if (this.text.substr(this.at - 1, 6) === 'return') {
    this.at = this.at + 5;
  }
  this.next();
  expr = this.expression();
  this.next("}");
  return function () { return expr.get_value(); };
};
*/

Parser.prototype.read_bindings = function () {
  var key,
    bindings = {},
    sep,
    expr,
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

      if (key.indexOf('.') !== -1) {
        // Namespaced – i.e.
        //    `attr.css: x` becomes `attr: { css: x }`
        //     ^^^ - key
        key = key.split('.');
        bindings[key[0]] = bindings[key[0]] || {};

        if (key.length !== 2) {
          options.onError("Binding " + key + " should have two parts (a.b).");
        } else if (bindings[key[0]].constructor !== Object) {
          options.onError("Binding " + key[0] + "." + key[1] + " paired with a non-object.");
        }

        ch = this.next(':');
        this.object_add_value(bindings[key[0]], key[1], this.expression(true));

      } else {
        ch = this.next(':');
        if (bindings[key] && typeof bindings[key] === 'object' && bindings[key].constructor === Object) {
          // Extend a namespaced bindings e.g. we've previously seen
          // on.x, now we're seeing on: { 'abc' }.
          expr = this.expression(true);
          if (typeof expr !== 'object' || expr.constructor !== Object) {
            options.onError("Expected plain object for " + key + " value.");
          } else {
            extend(bindings[key], expr);
          }
        } else {
          bindings[key] = this.expression(true);
        }
      }

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
* Accessors may be one of (below) constAccessor, identifierAccessor,
* expressionAccessor, or nodeAccessor.
*/
Parser.prototype.convert_to_accessors = function (result) {

  objectForEach(result, function (name, value) {
    if (value instanceof Identifier) {
      // Return a function that, with no arguments returns
      // the value of the identifier, otherwise sets the
      // value of the identifier to the first given argument.
      Object.defineProperty(result, name, {
        value: function (optionalValue, options) {
          if (arguments.length === 0) {
            return value.get_value();
          }
          if (options && options.onlyIfChanged && optionalValue === value.get_value()) {
            return;
          }
          return value.set_value(optionalValue);
        }
      });
    } else if (value instanceof Expression) {
      result[name] = function expressionAccessor() {
        return value.get_value();
      };
    } else if (value instanceof Node) {
      result[name] = function nodeAccessor() {
        return value.get_node_value();
      };
    } else if (typeof(value) !== 'function') {
      result[name] = function constAccessor() {
        return clonePlainObjectDeep(value);
      };
    } else if (typeof value === 'function') {
      result[name] = value;
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
  this.text = (source || '').trim();
  this.at = 0;
  this.ch = ' ';

  if (!this.text) {
    return null;
  }

  try {
    var result = this.read_bindings();
  } catch (e) {
    // `e` may be 1.) a proper Error; 2.) a parsing error; or 3.) a string.
    var emsg = typeof e === Error ?
          "\nMessage: <" + e.name + "> " + e.message :
        typeof e === 'object' && 'at' in e ?
          "\n" + e.name + " " + e.message + " of \n"
          + "   " + e.text + "\n"
          + Array(e.at).join(" ") + "_/ 🔥 \\_\n"
        : e;
    options.onError(new Error(emsg));
  }

  this.white();
  if (this.ch) {
    this.error("Syntax Error");
  }

  return this.convert_to_accessors(result);
};


/**
 * Determine if a character is a valid item in an identifier.
 * Note that we do not check whether the first item is a number, nor do we
 * support unicode identifiers here.
 *
 * See: http://docstore.mik.ua/orelly/webprog/jscript/ch02_07.htm
 * @param  {String}  ch  The character
 * @return {Boolean}     True if [A-Za-z0-9_]
 */
function is_identifier_char(ch) {
  return (ch >= 'A' && ch <= 'Z') ||
         (ch >= 'a' && ch <= 'z') ||
         (ch >= '0' && ch <= 9) ||
          ch === '_' || ch === '$';
}