
### TKO (“Technical Knockout”)

[![npm version](https://badge.fury.io/js/tko.svg)](https://badge.fury.io/js/tko)
[![Join the chat at https://gitter.im/knockout/tko](https://badges.gitter.im/knockout/tko.svg)](https://gitter.im/knockout/tko?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Libscore](https://img.shields.io/libscore/s/ko.svg)](http://libscore.com/#ko)
[![devDependency Status](https://david-dm.org/knockout/tko/dev-status.svg)](https://david-dm.org/knockout/tko#info=devDependencies)
[![Circle CI](https://circleci.com/gh/knockout/tko.svg?style=shield)](https://circleci.com/gh/knockout/tko)
[![Coverage Status](https://coveralls.io/repos/knockout/tko/badge.svg?branch=master&service=github)](https://coveralls.io/github/knockout/tko?branch=master)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

<!-- [![Sauce Test Status](https://saucelabs.com/browser-matrix/tko.svg)](https://saucelabs.com/u/tko) -->

**TKO** houses the monorepo of [Knockout](https://github.com/knockout/knockout).


### Getting Started

To install use one of the usual package managers e.g.

- $ `yarn add tko`
- $ `npm install tko`

Reference Build over CDN

- https://cdn.jsdelivr.net/npm/@tko/build.reference@4.0.0-alpha8/dist/build.reference.min.js

### Using the Monorepo

| Command | Effect |
| ------- | ------ |
| $ `git clone git@github.com:knockout/tko` | Clone the repository.
| $ `npm install -g yarn` otherwise | Ensure yarn is globally available
| $ `yarn` | Install local node packages and link tko modules
| $ `yarn test` | Run all tests. See below.
| $ `yarn watch` | Run all tests and watch for changes. See below.
| $ `yarn build` | Build tko\[.module\]\[.es6\]\[.min\].js files, where `.es6` version has not been transpiled
| $ `lerna publish` | Bump versions and publish to npm registry

Checkout `package.json => scripts` for more commands that can be executed with `yarn {command}`.

In each individual `packages/*/` directory, you can also run (presuming `rollup` and `karma` are installed globally):

| Command | Effect |
| --- | --- |
| $ `karma COMMAND ../../karma.conf.js [--once]`  | Test the local package, where COMMAND is e.g. `start` or `run`
| $ `rollup -c ../../rollup.config.js`  | Build the package into the local `dist/`


#### Testing with `yarn test` and `yarn watch`

The `yarn test` and `yarn watch` commands can be used in the root directory, where it will run across all tests, or alternatively in any `packages/*/` directory to run tests
specific to that package.

Optional arguments to `yarn test` include:

- `--sauce` — use Sauce Labs to test a variety of platforms; requires an account at Sauce Labs and `SAUCE_USERNAME` and `SAUCE_ACCESS_KEY` to be set in the environment.
- `--noStartConnect` — Do not start a new Sauce Connect proxy instance for every
test; requires that Sauce Connect be already running.


#### `visual.html`

Note that running `karma` or `rollup` will create a `visual.html` file that shows the proportional size of imports into each package.


### Objectives

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


## Next steps

There's an [issue for that](https://github.com/knockout/tko/issues/1).


## License

MIT license - [http://www.opensource.org/licenses/mit-license.php.](http://www.opensource.org/licenses/mit-license.php)

## Shout Outs

<div>
  <a href='http://browserstack.com'>
    <img height=150px src='https://p3.zdusercontent.com/attachment/1015988/gTNrZ9vPjL8ThUHOWP7ucklJi?token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0..HkCKDttXKDSGFoV5uaMPQA.ha9NDy63mjLKFcyNeib70TCkqfY0dcwiFwDYpZ8s5h75o-e1_cLjPAHlOUEwvKAbfMUaa1XpOL5F9AQd_B4iyc6JbgvKoKBxxe12aaOdfWFccP7r9iQ2Os6myiqBpP79prDXqFPMSAkF8ybzhVqCnWzxmK-Wvkbav-DGPZm3oS2IPD9ueIvf46bggFsikQhf1pjS5fgmzo07yi9Cf5SzA8zIKAjKX1RKQeFXOhBwxRfh_5SbJprfEZMnKBnGuO_qzP2fsK3BvxbyBKpIEWFdnA.t10i3BbyEpGtFVgyGbvQfw' alt='Browser Stack' />
  </a>
<div>
