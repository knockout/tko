knockout-fast-foreach
=====================

An experiment in faster foreach binding.

Include in your project in the usual ways, then instead of `foreach` use
`fastForEach`.

[Demo on JSBin](http://jsbin.com/dakihezega/2)

Testing
---

Run tests from the command line with `npm test`, or on Windows `npm run test_win`.


Run tests in Chrome by installing `karma-chrome-launcher` then
`$ ./node_modules/karma/bin/karma start --browsers Chrome`; the same applies
for other browsers supported by Karma.

Changes
---
16 Dec 2016 – 🔭 0.6.0
  - Reuse DOM nodes when array items move [#33, #34]
  - Improve internal nodes handling [#31, #32]

27 Sep 2015 – 📇 0.5.5
  - Improved batch addition (closes #30)

27 Sep 2015 - ⛵️  0.5.4
  - add `afterAdd` and `beforeRemove`

25 Sep 2015 – 🍭 0.5.3
  - fix `$index` when list is made from virtual elements

23 Sep 2015 - 👽 0.5.2
  - fix `$index` not working when template starts with a text node

22 Sep 2015 – 🐝 0.5.0
  - add `$index()` support (disable by passing `noIndex: true`)

16 Jul 2015 - 🌕  0.4.1
  - fix `push.apply` not working on `NodeList` in older Webkit versions

14 Jul 2015 – 🎂 0.4.0
  - uses `documentFragment` when possible
  - use karma for testing
  - add `.eslintrc` and clean up source

License
---

*MIT* Licensed.
