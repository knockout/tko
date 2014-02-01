

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
   *     [_deref_call, _deref_this where this=3]
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
