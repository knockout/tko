
import Node from './Node'
import Arguments from './Arguments'

import { hasOwnProperty } from '@tko/utils'

import {
  isWriteableObservable, isObservable
} from '@tko/observable'

export default class Identifier {
  constructor (parser, token, dereferences) {
    this.token = token
    this.dereferences = dereferences
    this.parser = parser
  }

  /**
   * Apply all () and [] functions on the identifier to the lhs value e.g.
   * a()[3] has deref functions that are essentially this:
   *     [_deref_call, _deref_this where this=3]
   *
   * @param  {mixed} value  Should be an object.
   * @return {mixed}        The dereferenced value.
   *
   * [1] We want to bind any function that is a method of an object, but not
   *     corrupt any values (e.g. computed()s).   e.g. Running x.bind(obj) where
   *     we're given `data-bind='binding: obj.x'` and x is a computed will
   *     break the computed's `this` and it will stop working as expected.
   *
   *     The test `!last_value.hasOwnProperty(member)`
   *     distinguishes between functions on the prototype chain (prototypal
   *     members) and value-members added directly to the object.  This may
   *     not be the canonical test for this relationship, but it succeeds
   *     in the known test cases.
   *
   *     See: `this` tests of our dereference function.
   */
  dereference (value, $context, globals, node) {
    let member
    let refs = this.dereferences || []
    const $data = $context.$data || {}
    let lastValue  // becomes `this` in function calls to object properties.
    let i, n

    for (i = 0, n = refs.length; i < n; ++i) {
      member = Node.value_of(refs[i], $context, globals, node)

      if (typeof value === 'function' && refs[i] instanceof Arguments) {
        // fn(args)
        value = value.apply(lastValue || $data, member)
        lastValue = value
      } else {
        // obj[x] or obj.x dereference.  Note that obj may be a function.
        lastValue = value
        value = Node.value_of(value[member], $context, globals, node)
      }
    }

    // [1] See note above.
    if (typeof value === 'function' && n > 0 && lastValue !== value &&
        !hasOwnProperty(lastValue, member)) {
      return value.bind(lastValue)
    }

    return value
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
  get_value (parent, context, globals, node) {
    const intermediate = parent && !(parent instanceof Identifier)
      ? Node.value_of(parent, context, globals, node)[this.token]
      : context.lookup(this.token, globals, node)
    return this.dereference(intermediate, context, globals, node)
  }

  assign (object, property, value) {
    if (isWriteableObservable(object[property])) {
      object[property](value)
    } else if (!isObservable(object[property])) {
      object[property] = value
    }
  };

  /**
   * Set the value of the Identifier.
   *
   * @param {Mixed} new_value The value that Identifier is to be set to.
   */
  set_value (new_value, $context, globals) {
    const $data = $context.$data || {}
    const refs = this.dereferences || []
    let leaf = this.token
    let i, n, root

    if (hasOwnProperty($data, leaf)) {
      root = $data
    } else if (hasOwnProperty($context, leaf)) {
      root = $context
    } else if (hasOwnProperty(globals, leaf)) {
      root = globals
    } else {
      throw new Error('Identifier::set_value -- ' +
        "The property '" + leaf + "' does not exist " +
        'on the $data, $context, or globals.')
    }

    // Degenerate case. {$data|$context|global}[leaf] = something;
    n = refs.length
    if (n === 0) {
      this.assign(root, leaf, new_value)
      return
    }

    // First dereference is {$data|$context|global}[token].
    root = root[leaf]

    // We cannot use this.dereference because that gives the leaf; to evoke
    // the ES5 setter we have to call `obj[leaf] = new_value`
    for (i = 0; i < n - 1; ++i) {
      leaf = refs[i]
      if (leaf instanceof Arguments) {
        root = root()
      } else {
        root = root[Node.value_of(leaf)]
      }
    }

    // We indicate that a dereference is a function when it is `true`.
    if (refs[i] === true) {
      throw new Error('Cannot assign a value to a function.')
    }

    // Call the setter for the leaf.
    if (refs[i]) {
      this.assign(root, Node.value_of(refs[i]), new_value)
    }
  };

  /**
   * Determine if a character is a valid item in an identifier.
   * Won't catch reserved words iterating through one char at a time.
   *
   * @param  {String}  ch  The character
   * @param {Boolean} start   Is the first character?
   * @return {Boolean}     True if this is a valid identifier
   */
  static is_valid_char(ch, start) {
    let name = start ? ch
    : '_'+ch
    try {
      Function('var ' + name)
    } catch( e ) {
      return false
    }
    return true
  }
  static is_valid_start_char (ch) {
    return Identifier.is_valid_char(ch,true)
  }

  static is_valid_continue_char (ch) {
    return Identifier.is_valid_char(ch,false)
  }

  get [Node.isExpressionOrIdentifierSymbol] () { return true }
}
