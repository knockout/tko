

Identifier = (function () {
  function Identifier(parser, token, dereferences) {
    this.token = token;
    this.dereferences = dereferences;
    this.parser = parser;
  }

  Identifier.prototype.lookup_value = function (parent) {
    var token = this.token,
        parser = this.parser,
        $context = parser.context,
        $data = $context.$data || {},
        globals = parser.globals || {};

    // parent is an optional source of the identifier e.g. for membership
    // `a.b`, one would pass `a` in as the parent when calling lookup_value
    // for `b`.
    if (parent) {
      return value_of(parent)[token];
    }

    // short circuits
    switch (token) {
      case '$element': return parser.node;
      case '$context': return $context;
      case '$data': return $data;
      default:
    }

    return $data[token] || $context[token] || globals[token];
  };

  /**
   * Apply all () and [] functions on the identifier to the lhs value e.g.
   * a()[3] has deref functions that are essentially this:
   *     [_deref_call, _deref_this where this=3]
   *
   * @param  {mixed} value  Should be an object.
   * @return {mixed}        The dereferenced value.
   */
  Identifier.prototype.dereference = function (value) {
    var i, n, member, refs = this.dereferences || [];
    for (i = 0, n = refs.length; i < n; ++i) {
      member = refs[i];
      if (member === true) {
        value = value();
      } else {
        value = value[value_of(member)];
      }
    }
    return value;
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

  Identifier.prototype.set_value = function (new_value) {
    var parser = this.parser,
        $context = parser.context,
        $data = $context.$data || {},
        globals = parser.globals || {},
        refs = this.dereferences || [],
        leaf = this.token,
        i, n, root;

    if (Object.hasOwnProperty.call($data, leaf)) {
      root = $data;
    } else if (Object.hasOwnProperty.call($context, leaf)) {
      root = $context;
    } else if (Object.hasOwnProperty.call(globals, leaf)) {
      root = globals;
    } else {
      throw new Error("Identifier::set_value -- " +
        "The property '" + leaf + "' does not exist " +
        "on the $data, $context, or globals.");
    }

    n = refs.length;
    if (n === 0) {
      root[leaf] = new_value;
    }

    // First dereference is $data/$context/global[token].
    root = root[leaf];

    // We cannot use this.dereference because that gives the leaf; to evoke
    // the ES5 setter we have to call `obj[leaf] = new_value`
    for (i = 0; i < n - 1; ++i) {
      leaf = refs[i];
      if (leaf === true) {
        root = root();
      } else {
        root = root[value_of(leaf)];
      }
    }

    // We indicate that a dereference is a function when it is `true`.
    if (refs[i] === true) {
      throw new Error("Cannot assign a value to a function.")
    }

    // Call the setter for the leaf.
    root[value_of(refs[i])] = new_value;
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
