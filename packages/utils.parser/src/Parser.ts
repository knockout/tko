/**
 * Originally based on (public domain):
 * https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js
 */

import {
  options, objectForEach, clonePlainObjectDeep, extend, hasOwnProperty
} from '@tko/utils'

import {default as Expression} from './Expression'
import {default as Identifier} from './Identifier'
import {default as Arguments} from './Arguments'
import {default as Parameters} from './Parameters'
import {default as Ternary} from './Ternary'
import {default as Node} from './Node'
import {default as operators} from './operators'

const escapee = {
  "'": "'",
  '"': '"',
  '`': '`',
  '\\': '\\',
  '/': '/',
  '$': '$',
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t'
}

/**
 * Construct a new Parser instance with new Parser(node, context)
 * @param {Node} node    The DOM element from which we parsed the
 *                         content.
 * @param {object} context The Knockout context.
 * @param {object} globals An object containing any desired globals.
 */
export default class Parser {
  white () {
    var ch = this.ch
    while (ch && ch <= ' ') {
      ch = this.next()
    }
    return this.comment(ch)
  }

/**
 * Slurp any C or C++ style comments
 */
  comment (ch) {
    if (ch !== '/') { return ch }
    var p = this.at
    var second = this.lookahead()
    if (second === '/') {
      while (ch) {
        ch = this.next()
        if (ch === '\n' || ch === '\r') { break }
      }
      ch = this.next()
    } else if (second === '*') {
      while (ch) {
        ch = this.next()
        if (ch === '*' && this.lookahead() === '/') {
          this.next()
          break
        }
      }
      if (!ch) {
        this.error('Unclosed comment, starting at character ' + p)
      }
      this.next()
      return this.white()
    }
    return ch
  };

  next (c) {
    if (c && c !== this.ch) {
      this.error("Expected '" + c + "' but got '" + this.ch + "'")
    }
    this.ch = this.text.charAt(this.at)
    this.at += 1
    return this.ch
  }

  lookahead () {
    return this.text[this.at]
  }

  error (m) {
    if (m instanceof Error) { throw m }
    let [name, msg] = m.name ? [m.name, m.message] : [m, '']
    const message = `\n${name} ${msg} of
    ${this.text}\n` + Array(this.at).join(' ') + '_/ 🔥 \\_\n'
    throw new Error(message)
  }

  name () {
  // A name of a binding
    var name = ''
    var enclosedBy
    this.white()

    var ch = this.ch

    if (ch === "'" || ch === '"') {
      enclosedBy = ch
      ch = this.next()
    }

    while (ch) {
      if (enclosedBy && ch === enclosedBy) {
        this.white()
        ch = this.next()
        if (ch !== ':' && ch !== ',') {
          this.error(
          'Object name: ' + name + ' missing closing ' + enclosedBy
        )
        }
        return name
      } else if (ch === ':' || ch <= ' ' || ch === ',' || ch === '|') {
        return name
      }
      name += ch
      ch = this.next()
    }

    return name
  }

  number () {
    let number
    let string = ''
    let ch = this.ch

    if (ch === '-') {
      string = '-'
      ch = this.next('-')
    }
    while (ch >= '0' && ch <= '9') {
      string += ch
      ch = this.next()
    }
    if (ch === '.') {
      string += '.'
      ch = this.next()
      while (ch && ch >= '0' && ch <= '9') {
        string += ch
        ch = this.next()
      }
    }
    if (ch === 'e' || ch === 'E') {
      string += ch
      ch = this.next()
      if (ch === '-' || ch === '+') {
        string += ch
        ch = this.next()
      }
      while (ch >= '0' && ch <= '9') {
        string += ch
        ch = this.next()
      }
    }
    number = +string
    if (!isFinite(number)) {
      options.onError(new Error('Bad number: ' + number + ' in ' + string))
    } else {
      return number
    }
  }

/**
 * Add a property to 'object' that equals the given value.
 * @param  {Object} object The object to add the value to.
 * @param  {String} key    object[key] is set to the given value.
 * @param  {mixed}  value  The value, may be a primitive or a function. If a
 *                         function it is unwrapped as a property.
 */
  objectAddValue (object, key, value) {
    if (value && value[Node.isExpressionOrIdentifierSymbol]) {
      Object.defineProperty(object, key, {
        get: () => Node.value_of(value, ...this.currentContextGlobals),
        enumerable: true
      })
    } else if (Array.isArray(value)) {
      Object.defineProperty(object, key, {
        get: () => value.map(v => Node.value_of(v, ...this.currentContextGlobals)),
        enumerable: true
      })
    } else {
    // primitives
      object[key] = value
    }
  }

  object () {
    let key
    let object = {}
    let ch = this.ch

    if (ch === '{') {
      this.next('{')
      ch = this.white()
      if (ch === '}') {
        ch = this.next('}')
        return object
      }
      while (ch) {
        if (ch === '"' || ch === "'" || ch === '`') {
          key = this.string()
        } else {
          key = this.name()
        }
        if (hasOwnProperty(object, key)) {
          this.error('Duplicate key "' + key + '"')
        }
        if (this.white() === ':') {
          ch = this.next(':')
          this.objectAddValue(object, key, this.singleValueExpression())
        } else {
          const objectKeyIsValue = new Identifier(this, key, [])
          this.objectAddValue(object, key, objectKeyIsValue)
        }

        ch = this.white()
        if (ch === '}') {
          ch = this.next('}')
          return object
        }

        this.next(',')
        ch = this.white()
        if (ch === '}') {
          ch = this.next('}')
          return object
        }
      }
    }
    this.error('Bad object')
  }

/**
 * Read up to delim and return the string
 * @param  {string} delim The delimiter, either ' or "
 * @return {string}       The string read.
 */
  readString (delim) {
    let string = ''
    let nodes = ['']
    let plusOp = operators['+']
    let hex
    let i
    let uffff
    let interpolate = delim === '`'
    let ch = this.next()

    while (ch) {
      if (ch === delim) {
        ch = this.next()
        if (interpolate) { nodes.push(plusOp) }
        nodes.push(string)
        return nodes
      }
      if (ch === '\\') {
        ch = this.next()
        if (ch === 'u') {
          uffff = 0
          for (i = 0; i < 4; i += 1) {
            hex = parseInt(ch = this.next(), 16)
            if (!isFinite(hex)) {
              break
            }
            uffff = uffff * 16 + hex
          }
          string += String.fromCharCode(uffff)
        } else if (typeof escapee[ch] === 'string') {
          string += escapee[ch]
        } else {
          break
        }
      } else if (interpolate && ch === '$') {
        ch = this.next()
        if (ch === '{') {
          this.next('{')
          nodes.push(plusOp)
          nodes.push(string)
          nodes.push(plusOp)
          nodes.push(this.expression())
          string = ''
        // this.next('}');
        } else {
          string += '$' + ch
        }
      } else {
        string += ch
      }
      ch = this.next()
    }

    this.error('Bad string')
  }

  string () {
    var ch = this.ch
    if (ch === '"') {
      return this.readString('"').join('')
    } else if (ch === "'") {
      return this.readString("'").join('')
    } else if (ch === '`') {
      return Node.create_root(this.readString('`'))
    }

    this.error('Bad string')
  }

  array () {
    let array = []
    let ch = this.ch

    if (ch === '[') {
      ch = this.next('[')
      this.white()
      if (ch === ']') {
        ch = this.next(']')
        return array
      }
      while (ch) {
        array.push(this.singleValueExpression())
        ch = this.white()
        if (ch === ']') {
          ch = this.next(']')
          return array
        }
        this.next(',')
        ch = this.white()
      }
    }
    this.error('Bad array')
  }

  value () {
    this.white()
    let ch = this.ch
    switch (ch) {
      case '{': return this.object()
      case '[': return this.array()
      case '"': case "'": case '`': return this.string()
      case '-': return this.number()
      default:
        return ch >= '0' && ch <= '9' ? this.number() : this.identifier()
    }
  }

/**
 * Get the function for the given operator.
 * A `.precedence` value is added to the function, with increasing
 * precedence having a higher number.
 * @return {function} The function that performs the infix operation
 */
  operator (opts) {
    let op = ''
    let opFn
    let ch = this.white()
    let isIdentifierChar = Identifier.is_valid_start_char

    while (ch) {
      if (isIdentifierChar(ch) || ch <= ' ' || ch === '' ||
        ch === '"' || ch === "'" || ch === '{' || ch === '(' ||
        ch === '`' || ch === ')' || (ch <= '9' && ch >= '0')) {
        break
      }

      if (!opts.not_an_array && ch === '[') {
        break
      }

      op += ch
      ch = this.next()

    // An infix followed by the prefix e.g. a + @b
    // TODO: other prefix unary operators
      if (ch === '@') {
        break
      }

      isIdentifierChar = Identifier.is_valid_continue_char
    }

    if (op !== '') {
      if (opts.prefix && op === '-') { op = '&-' }
      opFn = operators[op]

      if (!opFn) {
        this.error("Bad operator: '" + op + "'.")
      }
    }

    return opFn
  }

/**
 * Filters
 * Returns what the Node interprets as an "operator".
 * e.g.
 *   <span data-bind="text: name | fit:20 | uppercase"></span>
 */
  filter () {
    let ch = this.next()
    let args = []
    let nextFilter = function (v) { return v }
    let name = this.name()

    if (!options.filters[name]) {
      options.onError('Cannot find filter by the name of: ' + name)
    }

    ch = this.white()

    while (ch) {
      if (ch === ':') {
        ch = this.next()
        args.push(this.singleValueExpression('|'))
      }

      if (ch === '|') {
        nextFilter = this.filter()
        break
      }

      if (ch === ',') { break }

      ch = this.white()
    }

    var filter = function filter (value, ignored, context, globals, node) {
      var argValues = [value]

      for (var i = 0, j = args.length; i < j; ++i) {
        argValues.push(Node.value_of(args[i], context, globals, node))
      }

      return nextFilter(options.filters[name].apply(null, argValues))
    }

  // Lowest precedence.
    filter.precedence = 1
    return filter
  }

/**
 * Parse an expression – builds an operator tree, in something like
 * Shunting-Yard.
 *   See: http://en.wikipedia.org/wiki/Shunting-yard_algorithm
 *
 * @param filterable - Whether the expression can include jinga-style filters.
 *    An argument of '|' is used only by the filter() method to parse subsequent
 *    filters.
 * @param allowMultipleValues - Whether multiple values separated by commas are
 *    allowed in this expression. When true (default), this method consumes
 *    subsequent comma-separated values.
 * @see {@link Parser.singleValueExpression}
 * 
 * @returns a function that computes the value of the expression
 *    when called or a primitive.
 */
  expression (filterable: string | bool = false, allowMultipleValues: bool = true) {
    let op
    let nodes = []
    let ch = this.white()

    while (ch) {
    // unary prefix operators
      op = this.operator({ prefix: true })
      if (op) {
        nodes.push(undefined)  // LHS Tree node.
        nodes.push(op)
        ch = this.white()
      }

      if (ch === '(') {
        this.next()
        nodes.push(this.expression())
        this.next(')')
      } else {
        nodes.push(this.value())
      }
      ch = this.white()

      if (ch === ':' || ch === '}' || ch === ']' ||
        ch === ')' || ch === '' || ch === '`' ||
        (ch === '|' && filterable === '|') ||
        (ch === ',' && !allowMultipleValues)) {
        break
      }

    // filters
      if (ch === '|' && this.lookahead() !== '|' && filterable) {
        nodes.push(this.filter())
        nodes.push(undefined)
        break
      }

    // infix or postfix operators
      op = this.operator({ not_an_array: true })

      if (op === operators['?']) {
        this.ternary(nodes)
        break
      } else if (op === operators['.']) {
        nodes.push(op)
        nodes.push(this.member())
        op = null
      } else if (op === operators['[']) {
        nodes.push(op)
        nodes.push(this.expression())
        ch = this.next(']')
        op = null
      } else if (op === operators['=>']) {
        // convert the last node to Parameters
        nodes[nodes.length-1] = new Parameters(this, nodes[nodes.length-1])
        nodes.push(op)
      } else if (op) {
        nodes.push(op)
      }

      ch = this.white()

      if (ch === ']' || (!op && ch === '(')) { break }
    }

    if (nodes.length === 0) {
      return undefined
    }

    var dereferences = this.dereferences()

    if (nodes.length === 1 && !dereferences.length) {
      return nodes[0]
    }

    for (var i = 0, j = dereferences.length; i < j; ++i) {
      var deref = dereferences[i]
      if (deref.constructor === Arguments) {
        nodes.push(operators.call)
      } else {
        nodes.push(operators['.'])
      }
      nodes.push(deref)
    }

    return new Expression(nodes)
  }

/**
 * Use this method to parse expressions that can be followed by additional markup
 * seperated by a comma, such as in bindings strings.
 * 
 * @returns an expression that cannot contain multiple values separated by commas.
 * @see {@link Parser.expression}
 */
  singleValueExpression (filterable: bool | string) {
    return this.expression(filterable, false)
  }

  ternary (nodes) {
    var ternary = new Ternary()
    ternary.yes = this.singleValueExpression()
    this.next(':')
    ternary.no = this.singleValueExpression()
    nodes.push(operators['?'])
    nodes.push(ternary)
  }

/**
 * Parse the arguments to a function, returning an Array.
 *
 */
  funcArguments () {
    let args = []
    let ch = this.next('(')

    while (ch) {
      ch = this.white()
      if (ch === ')') {
        this.next(')')
        return new Arguments(this, args)
      } else {
        args.push(this.singleValueExpression())
        ch = this.white()
      }
      if (ch !== ')') { this.next(',') }
    }

    this.error('Bad arguments to function')
  }

/**
 * The literal string reference `abc` in an `x.abc` expression.
 */
  member () {
    let member = ''
    let ch = this.white()
    let isIdentifierChar = Identifier.is_valid_start_char

    while (ch) {
      if (!isIdentifierChar(ch)) {
        break
      }
      member += ch
      ch = this.next()
      isIdentifierChar = Identifier.is_valid_continue_char
    }
    return member
  }

/**
 * A dereference applies to an identifer, being either a function
 * call "()" or a membership lookup with square brackets "[member]".
 * @return {fn or undefined}  Dereference function to be applied to the
 *                            Identifier
 */
  dereference () {
    let member
    let ch = this.white()

    while (ch) {
      if (ch === '(') {
      // a(...) function call
        return this.funcArguments()
      } else if (ch === '[') {
      // a[x] membership
        this.next('[')
        member = this.expression()
        this.white()
        this.next(']')

        return member
      } else if (ch === '.') {
      // a.x membership
        this.next('.')
        return this.member()
      } else {
        break
      }
    }
  }

  dereferences () {
    let ch = this.white()
    let dereferences = []
    let deref

    while (ch) {
      deref = this.dereference()
      if (deref !== undefined) {
        dereferences.push(deref)
      } else {
        break
      }
    }
    return dereferences
  }

  identifier () {
    let token = ''
    let isIdentifierChar = Identifier.is_valid_start_char
    let ch = this.white()

    while (ch) {
      if (!isIdentifierChar(ch)) {
        break
      }
      token += ch
      ch = this.next()
      isIdentifierChar = Identifier.is_valid_continue_char
    }
    switch (token) {
      case 'true': return true
      case 'false': return false
      case 'null': return null
      case 'undefined': return void 0
      case 'function':
        throw new Error('Knockout: Anonymous functions are no longer supported, but `=>` lambdas are. In: ' + this.text)
    // return this.anonymous_fn();
    }
    return new Identifier(this, token, this.dereferences())
  }

  readBindings () {
    let key
    let bindings = {}
    let sep
    let expr
    let ch = this.ch

    while (ch) {
      key = this.name()
      sep = this.white()

      if (!sep || sep === ',') {
        if (sep) {
          ch = this.next(',')
        } else {
          ch = ''
        }
      // A "bare" binding e.g. "text"; substitute value of 'null'
      // so it becomes "text: null".
        bindings[key] = null
      } else {
        if (key.indexOf('.') !== -1) {
        // Namespaced – i.e.
        //    `attr.css: x` becomes `attr: { css: x }`
        //     ^^^ - key
          key = key.split('.')
          bindings[key[0]] = bindings[key[0]] || {}

          if (key.length !== 2) {
            options.onError('Binding ' + key + ' should have two parts (a.b).')
          } else if (bindings[key[0]].constructor !== Object) {
            options.onError('Binding ' + key[0] + '.' + key[1] + ' paired with a non-object.')
          }

          ch = this.next(':')
          this.objectAddValue(bindings[key[0]], key[1], this.singleValueExpression(true))
        } else {
          ch = this.next(':')
          if (bindings[key] && typeof bindings[key] === 'object' && bindings[key].constructor === Object) {
          // Extend a namespaced bindings e.g. we've previously seen
          // on.x, now we're seeing on: { 'abc' }.
            expr = this.singleValueExpression(true)
            if (typeof expr !== 'object' || expr.constructor !== Object) {
              options.onError('Expected plain object for ' + key + ' value.')
            } else {
              extend(bindings[key], expr)
            }
          } else {
            bindings[key] = this.singleValueExpression(true)
          }
        }

        this.white()
        if (this.ch) {
          ch = this.next(',')
        } else {
          ch = ''
        }
      }
    }
    return bindings
  }

  valueAsAccessor (value, context, globals, node) {
    if (!value) { return () => value }
    if (typeof value === 'function') { return value }

    if (value[Node.isExpressionOrIdentifierSymbol]) {
      return () => Node.value_of(value, context, globals, node)
    }

    if (Array.isArray(value)) {
      return () => value.map(v => Node.value_of(v, context, globals, node))
    }

    if (typeof (value) !== 'function') {
      return () => clonePlainObjectDeep(value)
    }

    throw new Error('Value has cannot be converted to accessor: ' + value)
  }

  /**
  * Convert result[name] from a value to a function (i.e. `valueAccessor()`)
  * @param  {object} result [Map of top-level names to values]
  * @return {object}        [Map of top-level names to functions]
  *
  * Accessors may be one of (below) constAccessor, identifierAccessor,
  * expressionAccessor, or nodeAccessor.
  */
  convertToAccessors (result, context, globals, node) {
    objectForEach(result, (name, value) => {
      if (value instanceof Identifier) {
        // Return a function that, with no arguments returns
        // the value of the identifier, otherwise sets the
        // value of the identifier to the first given argument.
        Object.defineProperty(result, name, {
          value: function (optionalValue, options) {
            const currentValue = value.get_value(undefined, context, globals, node)
            if (arguments.length === 0) { return currentValue }
            const unchanged = optionalValue === currentValue
            if (options && options.onlyIfChanged && unchanged) { return }
            return value.set_value(optionalValue, context, globals)
          }
        })
      } else {
        result[name] = this.valueAsAccessor(value, context, globals, node)
      }
    })
    return result
  }

  preparse (source = '') {
    const preparsers = options.bindingStringPreparsers || []
    return preparsers.reduce((acc, fn) => fn(acc), source.trim())
  }

  runParse (source, fn) {
    this.text = this.preparse(source)
    this.at = 0
    this.ch = ' '

    try {
      var result = fn()
      this.white()
      if (this.ch) {
        this.error('Syntax Error')
      }
      return result
    } catch (e) {
      options.onError(e)
    }
  }

  /**
   * Get the bindings as name: accessor()
   * @param  {string} source The binding string to parse.
   * @return {object}        Map of name to accessor function.
   */
  parse (source, context = {}, globals = {}, node) {
    if (!source) { return () => null }
    this.currentContextGlobals = [context, globals, node]
    const parseFn = () => this.readBindings()
    const bindingAccessors = this.runParse(source, parseFn)
    return this.convertToAccessors(bindingAccessors, context, globals, node)
  }

  /**
   * Return a function that evaluates and returns the result of the expression.
   */
  parseExpression (source, context = {}, globals = {}, node) {
    if (!source) { return () => '' }
    this.currentContextGlobals = [context, globals, node]
    const parseFn = () => this.singleValueExpression(true)
    const bindingAccessors = this.runParse(source, parseFn)
    return this.valueAsAccessor(bindingAccessors, context, globals, node)
  }
}
