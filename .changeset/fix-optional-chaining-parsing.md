---
"@tko/utils.parser": patch
---

Fix parsing of the optional-chaining operator (`?.`) in binding expressions.
`dereference()` now consumes `a?.b` member access the same way as `a.b`
(Identifier dereferencing is already null-safe, so a nullish base
short-circuits to the base value, matching plain `.`), and the expression
loop stops at terminators (`}`, `)`, `:`, `,`, backtick) after a member
dereference, so bindings like
`css: {x: $root.server()?.enable}` no longer throw `Bad operator: '}'`.
Optional index/call forms (`?.[`, `?.(`) remain unsupported and still error
loudly. Fixes knockout/tko#410.
