/*! knockout-secure-binding - v0.2.2 - 2014-1-31
 *  https://github.com/brianmhunt/knockout-secure-binding
 *  Copyright (c) 2014 Brian M Hunt; License: MIT */
;(function(factory) {
    //AMD
    if (typeof define === "function" && define.amd) {
        define(["knockout", "exports"], factory);
        //normal script tag
    } else {
        factory(ko);
    }
}(function(ko, exports, undefined) {



var Identifier = (function () {
  function Identifier(parser, token, dereferences) {
    this.token = token;
    this.dereferences = dereferences;
    this.parser = parser;
  }

  Identifier.prototype.lookup_value = function (parent) {
    var parser = this.parser,
        context = parser.context,
        token = this.token;

    // parent is an optional source of the identifier e.g. for membership
    // `a.b`, one would pass `a` in as the parent when calling lookup_value
    // for `b`.
    if (parent) {
      if (typeof parent.get_value === 'function') {
        parent = parent.get_value()[token];
      } else if (typeof parent === 'object') {
        return parent[token];
      }
      throw new Error("Identifier given a bad parent " + parent);
    }

    switch (token) {
      case '$element': return parser.node;
      case '$context': return context;
      case '$data': return context.$data;
      default:
    }

    // $data.token
    if (context && context.$data &&
      Object.hasOwnProperty.call(context.$data, token)) {
      // Return $data if the first-dotted value is defined
      // emulates with(context){with(context.$data){...}}
      return context.$data[token];
    }

    // $context.token
    if (context && Object.hasOwnProperty.call(context, token)) {
      return context[token];
    }

    // globals.token
    return parser.globals && parser.globals[token];
  };

  function _deref(value, deref_fn) {
    return deref_fn(value);
  }

  /**
   * Apply all () and [] functions on the identifier to the lhs value e.g.
   * a()[3] has deref functions that are essentially this:
   *     [operators['()'], function () { return a[3] }]
   *
   * @param  {mixed} value  Should be an object.
   * @return {mixed}        The dereferenced value.
   */
  Identifier.prototype.dereference = function (value) {
    return (this.dereferences || []).reduce(_deref, value);
  };

  /**
   * Return the value as one would get it from the top-level i.e.
   * $data.token/$context.token/globals.token; this does not return intermediate
   * values on a chain of members i.e. $data.hello.there -- requesting the
   * Identifier('there').value will return $data/$context/globals.there.
   *
   * This will dereference using () or [arg] member.
   * @param  {object | Identifier | Expression} parent
   * @return {mixed}  Return the primitive or an accessor.
   */
  Identifier.prototype.get_value = function (parent) {
    return this.dereference(this.lookup_value(parent));
  };

  return Identifier;
})();

/**
 * Determine if a character is a valid item in an identifier.
 * Note that we do not check whether the first item is a number, nor do we
 * support unicode identifiers here.
 * See: http://docstore.mik.ua/orelly/webprog/jscript/ch02_07.htm
 * @param  {[type]}  ch  The character
 * @return {Boolean}     True if [A-Za-z0-9_]
 */
function is_identifier_char(ch) {
  return (ch >= 'A' && ch <= 'Z') ||
         (ch >= 'a' && ch <= 'z') ||
         (ch >= '0' && ch <= 9) ||
          ch === '_' || ch === '$';
}


var Node = (function () {
  function Node(lhs, op, rhs) {
    this.lhs = lhs;
    this.op = op;
    this.rhs = rhs;
  }

  var operators =  {
    // members
    '.': function member_dot(a, b) { return a[b]; },
    '[]': function member_bkt(a, b) { return a[b]; },
    // function call
    '()': function fn_call(a, b) { return a(); },
    // unary
    '!': function not(a, b) { return !b; },
    '!!': function notnot(a, b) { return !!b; },
    // mul/div
    '*': function mul(a, b) { return a * b; },
    '/': function div(a, b) { return a / b; },
    '%': function mod(a, b) { return a % b; },
    // sub/add
    '+': function add(a, b) { return a + b; },
    '-': function sub(a, b) { return a - b; },
    // relational
    '<': function lt(a, b) { return a < b; },
    '<=': function le(a, b) { return a <= b; },
    '>': function gt(a, b) { return a > b; },
    '>=': function ge(a, b) { return a >= b; },
    // 'in': function (a, b) { return a in b; },
    // 'instanceof': function (a, b) { return a instanceof b; },
    // equality
    '==': function equal(a, b) { return a == b; },
    '!=': function ne(a, b) { return a != b; },
    '===': function sequal(a, b) { return a === b; },
    '!==': function sne(a, b) { return a !== b; },
    // logic
    '&&': function logic_and(a, b) { return a && b; },
    '||': function logic_or(a, b) { return a || b; },
  };

  /* In order of precedence, see:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence#Table
  */
    // member lookup
  operators['.'].precedence = 1;
  operators['[]'].precedence = 1;
    // function call
    // usually 2, but a().b() is a() . b() not a.b()()
  operators['()'].precedence = 0;
    // logical not
  operators['!'].precedence = 4;
  operators['!!'].precedence = 4; // explicit double-negative
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
  // operators['in'].precedence = 8;
  // operators['instanceof'].precedence = 8;
    // equality
  operators['=='].precedence = 9;
  operators['!='].precedence = 9;
  operators['==='].precedence = 9;
  operators['!=='].precedence = 9;
    // logic
  operators['&&'].precedence = 13;
  operators['||'].precedence = 14;

  Node.operators = operators;


  Node.prototype.get_leaf_value = function (leaf, member_of) {
    if (typeof(leaf) === 'function') {
      // Expressions on observables are nonsensical, so we unwrap any
      // function values (e.g. identifiers).
      return ko.unwrap(leaf());
    }

    // primitives
    if (typeof(leaf) !== 'object') {
      return member_of ? member_of[leaf] : leaf;
    }

    // Identifiers and Expressions
    if (leaf instanceof Identifier || leaf instanceof Expression) {
      // lhs is passed in as the parent of the leaf. It will be defined in
      // cases like a.b.c as 'a' for 'b' then as 'b' for 'c'.
      return ko.unwrap(leaf.get_value(member_of));
    }

    if (leaf instanceof Node) {
      return leaf.get_node_value(member_of);
    }

    throw new Error("Invalid type of leaf node: " + leaf);
  };

  /**
   * Return a function that calculates and returns an expression's value
   * when called.
   * @param  {array} ops  The operations to perform
   * @return {function}   The function that calculates the expression.
   *
   * Exported for testing.
   */
  Node.prototype.get_node_value = function (member_of) {
    var lhs, rhs, member_op;

    member_op = this.op === operators['.'];

    lhs = this.get_leaf_value(this.lhs, member_of);
    rhs = this.get_leaf_value(this.rhs, member_op ? lhs : undefined);

    // It is already computed in this case right-to-left.
    if (member_op) {
      return rhs;
    }

    return this.op(lhs, rhs);
  };

  return Node;
})();

var Expression = (function () {
  function Expression(nodes) {
    this.nodes = nodes;
    this.root = this.build_tree(nodes);
  }

  // Exports for testing.
  Expression.operators = Node.operators;
  Expression.Node = Node;

  /**
   *  Convert an array of nodes to an executable tree.
   *  @return {object} An object with a `lhs`, `rhs` and `op` key, corresponding
   *                      to the left hand side, right hand side, and
   *                      operation function.
   */
  Expression.prototype.build_tree = function (nodes) {
    var root,
        leaf,
        op,
        value;

    // console.log("build_tree", nodes.slice(0))

    // primer
    leaf = root = new Node(nodes.shift(), nodes.shift(), nodes.shift());

    while (nodes) {
      op = nodes.shift();
      value = nodes.shift();
      if (!op) {
        break;
      }
      if (op.precedence > root.op.precedence) {
        // rebase
        root = new Node(root, op, value);
        leaf = root;
      } else {
        leaf.rhs = new Node(leaf.rhs, op, value);
        leaf = leaf.rhs;
      }
    }
    // console.log("tree", root)
    return root;
  }; // build_tree

  Expression.prototype.get_value = function () {
    if (!this.root) {
      this.root = this.build_tree(this.nodes);
    }
    return this.root.get_node_value();
  };

  return Expression;
})();


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
    // [_A-Za-z][_A-Za-z0-9]*
    var name = '';
    this.white();

    ch = this.ch;

    while (ch) {
      if (ch === ':' || ch <= ' ') {
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
        get: function () { return value.get_value(); },
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
    var dereferences = [],
        ch = this.white();

    while (ch) {
      if (ch === '(') {
        // () dereferences
        this.next('(');
        this.white();
        this.next(')');
        return operators['()'];
      } else if (ch === '[') {
        this.next('[');
        expr = this.expression();
        this.white();
        this.next(']');

        op_fn = function (a) {
          var v;
          if (expr instanceof Identifier || expr instanceof Expression) {
            v = expr.get_value();
          } else {
            v = expr;
          }
          return a[ko.unwrap(v)];
        };

        op_fn.precedence = operators['[]'];
        op_fn.operator = operators['[]'];
        return op_fn;
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
      if (ch === ':' || ch === '}' || ch === ',' || ch <= ' ' || ch === '[' ||
          ch === ']' || ch === '(' || ch === ')' || ch === '.') {
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
      if (deref) {
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
      if (value instanceof Identifier || value instanceof Expression) {
        result[name] = value.get_value.bind(value);
      } else if (typeof(value) != 'function') {
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




function secureBindingsProvider(options) {
    var existingProvider = new ko.bindingProvider();
    options = options || {};

    // override the attribute
    this.attribute = options.attribute || "data-sbind";

    // do we bind to the ko: virtual elements
    this.noVirtualElements = options.noVirtualElements || false;

    // set globals
    this.globals = options.globals || {};

    // the binding classes -- defaults to ko bindingsHandlers
    this.bindings = options.bindings || ko.bindingHandlers;
}

function registerBindings(newBindings) {
    ko.utils.extend(this.bindings, newBindings);
}

function nodeHasBindings(node) {
    var result, value;

    if (node.nodeType === node.ELEMENT_NODE) {
        return node.getAttribute(this.attribute);
    } else if (node.nodeType === node.COMMENT_NODE) {
        // If this is a comment node, Knockout has already filtered it as
        // one matching <!-- ko: ... -->. We always assume binding
        // responsibility (unless noVirtualElements is set).
        // See: knockout/src/virtualElements.js
        return !this.noVirtualElements;
    }
}

// Return the name/valueAccessor pairs.
// (undocumented replacement for getBindings)
// see https://github.com/knockout/knockout/pull/742
function getBindingAccessors(node, context) {
    var bindings = {},
    sbind_string;

    if (node.nodeType === node.ELEMENT_NODE) {
        sbind_string = node.getAttribute(this.attribute);
    } else if (node.nodeType === node.COMMENT_NODE) {
        sbind_string = node.nodeValue.replace("ko ", "");
    }

    if (sbind_string) {
        bindings = new Parser(node, context,this.globals)
                             .parse(sbind_string);
    }

    return bindings;
}

ko.utils.extend(secureBindingsProvider.prototype, {
    registerBindings: registerBindings,
    nodeHasBindings: nodeHasBindings,
    getBindingAccessors: getBindingAccessors,
    Parser: Parser
});

    if (!exports) {
        ko.secureBindingsProvider = secureBindingsProvider;
    }

    return secureBindingsProvider;
}));
