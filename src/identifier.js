

var Identifier = (function () {
  function Identifier(token, parser) {
    this.token = token;
    this.parser = parser;
  }

  /**
   * Return the value as one would get it from the top-level i.e.
   * $data.token/$context.token/globals.token; this does not return intermediate
   * values on a chain of members i.e. $data.hello.there -- requesting the
   * Identifier('there').value will return $data/$context/globals.there
   *
   * @return {mixed}  Return the primitive or an accessor.
   */
  Identifier.prototype.get_value = function () {
    var parser = this.parser,
        context = parser.context,
        token = this.token;

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
  }

  return Identifier;
})();

/**
 * Determine if a character is a valid item in an identifier
 * @param  {[type]}  ch  The character
 * @return {Boolean}     True if [A-Za-z0-9_]
 */
function is_identifier_char(ch) {
  return (ch >= 'A' && ch <= 'Z') ||
         (ch >= 'a' && ch <= 'z') ||
         (ch >= '0' && ch <= 9) ||
          ch === '_' || ch === '$';
}
