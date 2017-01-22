# TKO `foreach` binding

This is the default `foreach` binding for [`tko`](https://github.com/knockout/tko).  It is based on [`knockout-fast-foreach`](https://github.com/brianmhunt/knockout-fast-foreach)


---
19 Jan 2017 — 🐉  4.0.0-alpha1
  - Expose the `conditional` for `elseChainSatisfied` so the `else` binding will now work with this as expected i.e. when the foreach data is empty, the `else` binding will be rendered.

6 Jan 2017 – 🚡  TKO - master

 - Make compatible with tko style packages.
 - Deprecate `noContext`; if `as` is provided, then the current context is extended.
 - Improve performance of the context generator.

16 Dec 2015 – 🔭 0.6.0
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
