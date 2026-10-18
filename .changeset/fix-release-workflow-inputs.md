---
"@tko/utils.parser": minor
---

Fix parsing of unquoted and quoted binding names in `@tko/utils.parser`.

- An ES6 shorthand object property directly followed by `}` (e.g. `x: {a}`)
  now parses instead of running past the end of the object literal.
- The name terminators (`:`, whitespace, `,`, `|`, `}`) no longer end a
  quoted binding name early, so bindings such as `"a b": 1` or `"a}b": 1`
  keep their full name.
