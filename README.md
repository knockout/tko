
### TKO (“Technically Knockout”)

[![npm version](https://badge.fury.io/js/tko.svg)](https://badge.fury.io/js/tko)
[![Join the chat at https://gitter.im/knockout/knockout](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/knockout/knockout?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Libscore](https://img.shields.io/libscore/s/ko.svg)](http://libscore.com/#ko)
[![devDependency Status](https://david-dm.org/knockout/tko/dev-status.svg)](https://david-dm.org/knockout/tko#info=devDependencies)
[![Circle CI](https://circleci.com/gh/knockout/tko.svg?style=shield)](https://circleci.com/gh/knockout/tko)
[![Coverage Status](https://coveralls.io/repos/knockout/tko/badge.svg?branch=master&service=github)](https://coveralls.io/github/knockout/tko?branch=master)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/brianmhunt.svg)](https://saucelabs.com/u/brianmhunt)

**TKO** is an experimental fork of [Knockout](https://github.com/knockout/knockout) (version 3.4.0).

TKO aims to become a base for future versions of Knockout.  The objectives include:

- Modularization into ES6 and separate projects, with compilation using an ES6 compiler like [Rollup](http://rollupjs.org/).  This solves several problems with Knockout, including:
  - Some folks want to roll-their-own with e.g. removing components
  - Compilation is now with Closure compiler, which is actually transliterating – meaning the *debug* and *minified* versions have different code paths (mostly in the form of things exposed in *debug* being missing in the *minified* version)
  - The compilation of Knockout is just concatenation, leading to difficulties with maintainance, severance, and replacement
- Documentation inline in the source code.  This aims to make it easier to document, by making documentation adjacent to the code about-which it speaks.  Also, we aim to have examples in the documentation.
- A more comprehensive home page.  The hope is to have something fun and fancy, and we have [a rough prototype](http://brianmhunt.github.io/knockout).
- Better setup for plugins.  The problems with Knockout include:
  - There's no central, searchable repository for knockout
  - What should be simple plugins (e.g. binding handlers or providers) are complex, including:
    - Built-ins have first-class access to quite a bit of good Knockout code, but plugins generally have second-class access and often have to duplicate Knockout internals
    - Quality plugins have lots of boilerplate for compilation, release, documentation, and testing
 
When complete, the hope is that Knockout will become an *opinionated expression* of TKO, in other words, Knockout will simply be a set of popular and sensible choices from a list of TKO-based HTML-bindings, utilities, observables, and other plugins e.g.:

- [tko-policy](https://github.com/knockout/tko.tools) — Tools and settings for every TKO-based package
- [tko.bind](https://github.com/knockout/tko.bind) — HTML bindings
- [tko.observable](https://github.com/knockout/tko.observable) — Observable variables
- [tko.computed](https://github.com/knockout/tko.computed) — Computed/dependant observable variables
- [tko.components](https://github.com/knockout/tko.components) — Web-components
- [tko.utils](https://github.com/knockout/tko.utils) — Common TKO Utilities

## Next steps

There's an [issue for that](https://github.com/knockout/tko/issues/1).

## License

MIT license - [http://www.opensource.org/licenses/mit-license.php.](http://www.opensource.org/licenses/mit-license.php)
