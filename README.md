knockout-fast-foreach
=====================

An experiment in faster foreach binding.

Include in your project in the usual ways, then instead of `foreach` use
`fastForEach`.

[Demo on JSBin](http://jsbin.com/dakihezega/2)

Testing
---

Run tests from the command line with `npm test`

Run tests in Chrome by installing `karma-chrome-launcher` then
`$ ./node_modules/karma/bin/karma start --browsers Chrome`; the same applies
for other browsers supported by Karma.

Changes
---
16 Jul 2015 - 🌕  - 0.4.1
  - fix `push.apply` not working on `NodeList` in older Webkit versions

14 Jul 2015 – 🎂 0.4.0
  - uses `documentFragment` when possible
  - use karma for testing
  - add `.eslintrc` and clean up source

License
---

*MIT* Licensed.
