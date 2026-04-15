---
"@tko/utils": patch
"@tko/utils.parser": patch
"@tko/build.reference": patch
---

Fix `==` and `!=` parser error in binding expressions (#290)

The `==` and `!=` operators in the reference build threw "unexpected nodes remain in shunting yard output stack" because the operator functions were missing `.precedence` metadata. Now all equality operator functions have correct precedence.

Also adds `ko.options.strictEquality` — a configuration setter that controls whether `==`/`!=` use strict (`===`/`!==`) comparison in binding expressions. `@tko/build.reference` enables this by default.
