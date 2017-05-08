import {
  stringTrim
} from 'tko.utils';

/* eslint no-cond-assign: 0 */

// The following regular expressions will be used to split an object-literal string into tokens

// These two match strings, either with double quotes or single quotes
var stringDouble = '"(?:[^"\\\\]|\\\\.)*"',
  stringSingle = "'(?:[^'\\\\]|\\\\.)*'",
  // Matches a regular expression (text enclosed by slashes), but will also match sets of divisions
  // as a regular expression (this is handled by the parsing loop below).
  stringRegexp = '/(?:[^/\\\\]|\\\\.)*/\w*',
  // These characters have special meaning to the parser and must not appear in the middle of a
  // token, except as part of a string.
  specials = ',"\'{}()/:[\\]',
  // Match text (at least two characters) that does not contain any of the above special characters,
  // although some of the special characters are allowed to start it (all but the colon and comma).
  // The text can contain spaces, but leading or trailing spaces are skipped.
  everyThingElse = '[^\\s:,/][^' + specials + ']*[^\\s' + specials + ']',
  // Match any non-space character not matched already. This will match colons and commas, since they're
  // not matched by "everyThingElse", but will also match any other single character that wasn't already
  // matched (for example: in "a: 1, b: 2", each of the non-space characters will be matched by oneNotSpace).
  oneNotSpace = '[^\\s]',

  // Create the actual regular expression by or-ing the above strings. The order is important.
  bindingToken = RegExp(stringDouble + '|' + stringSingle + '|' + stringRegexp + '|' + everyThingElse + '|' + oneNotSpace, 'g'),

  // Match end of previous token to determine whether a slash is a division or regex.
  divisionLookBehind = /[\])"'A-Za-z0-9_$]+$/,
  keywordRegexLookBehind = {
    'in': 1,
    'return': 1,
    'typeof': 1
  };

/**
 * Break a binding string (data-bind='x: val, y: ..') into a stable array
 * of {key: value}.
 */
export default function parseObjectLiteral(objectLiteralString) {
  // Trim leading and trailing spaces from the string
  var str = stringTrim(objectLiteralString);

  // Trim braces '{' surrounding the whole object literal
  if (str.charCodeAt(0) === 123) str = str.slice(1, -1);

  // Split into tokens
  var result = [],
    toks = str.match(bindingToken),
    key, values = [],
    depth = 0;

  if (!toks) { return [] }

  // Append a comma so that we don't need a separate code block to deal with the last item
  toks.push(',');

  for (var i = 0, tok; tok = toks[i]; ++i) {
    var c = tok.charCodeAt(0);
    // A comma signals the end of a key/value pair if depth is zero
    if (c === 44) { // ","
      if (depth <= 0) {
        result.push((key && values.length) ? {
          key: key,
          value: values.join('')
        } : {
          'unknown': key || values.join('')
        });
        key = depth = 0;
        values = [];
        continue;
      }
      // Simply skip the colon that separates the name and value
    } else if (c === 58) { // ":"
      if (!depth && !key && values.length === 1) {
        key = values.pop();
        continue;
      }
      // A set of slashes is initially matched as a regular expression, but could be division
    } else if (c === 47 && i && tok.length > 1) { // "/"
      // Look at the end of the previous token to determine if the slash is actually division
      var match = toks[i - 1].match(divisionLookBehind);
      if (match && !keywordRegexLookBehind[match[0]]) {
        // The slash is actually a division punctuator; re-parse the remainder of the string (not including the slash)
        str = str.substr(str.indexOf(tok) + 1);
        toks = str.match(bindingToken);
        toks.push(',');
        i = -1;
        // Continue with just the slash
        tok = '/';
      }
      // Increment depth for parentheses, braces, and brackets so that interior commas are ignored
    } else if (c === 40 || c === 123 || c === 91) { // '(', '{', '['
      ++depth;
    } else if (c === 41 || c === 125 || c === 93) { // ')', '}', ']'
      --depth;
      // The key will be the first token; if it's a string, trim the quotes
    } else if (!key && !values.length && (c === 34 || c === 39)) { // '"', "'"
      tok = tok.slice(1, -1);
    }
    values.push(tok);
  }

  return result;
}
