
# TKO (“Technical Knockout”) <a id="intro"></a>

[![npm version](https://badge.fury.io/js/tko.svg)](https://badge.fury.io/js/tko)
[![Join the chat at https://gitter.im/knockout/tko](https://badges.gitter.im/knockout/tko.svg)](https://gitter.im/knockout/tko?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Libscore](https://img.shields.io/libscore/s/ko.svg)](http://libscore.com/#ko)
[![devDependency Status](https://david-dm.org/knockout/tko/dev-status.svg)](https://david-dm.org/knockout/tko#info=devDependencies)
[![Circle CI](https://circleci.com/gh/knockout/tko.svg?style=shield)](https://circleci.com/gh/knockout/tko)
[![Coverage Status](https://coveralls.io/repos/knockout/tko/badge.svg?branch=master&service=github)](https://coveralls.io/github/knockout/tko?branch=master)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

<!-- [![Sauce Test Status](https://saucelabs.com/browser-matrix/tko.svg)](https://saucelabs.com/u/tko) -->

1. [Intro](#intro)
2. [Getting Started](#getting-started)
    1. [Download](#download)
        1. [Reference](#download-reference)
        2. [Compatibility build](#download-compatibility)
        3. [Over CDN](#download-cdn)
    2. [Usage / import](#usage)
        1. [ESM](#imports-esm)
        2. [IIFE](#imports-iife)
        3. [CommonJS](#imports-cjs)
        4. [MJS](#imports-mjs)
    3. [Sites](#sites)
3. [Using the Monporepo](#monorepo)
4. [Objectives](#objectives)
5. [Roadmap](#roadmap)
6. [License](#license)
7. [Shoutouts](#shoutouts)


<br/>

## Getting Started <a id="getting-started"></a>
---

<!-- how it can house original KO monorepo, if the goal of TKO is not KO -->
<!-- **TKO** houses the monorepo of [Knockout](https://github.com/knockout/knockout). -->
**TKO** serves as a foundation for `Knockout 4` which goal is to become a drop-in replacement and a feature-rich expansion of already existing KnockoutJS (3+) while adhering new standarts and paradigms of web developmentent. Its built on top of current KnockoutJS featurelist while being [mostly compatible](https://www.tko.io/3to4) with it, further about it and build differences at [download](#download) section.


### Download <a id="download"></a>
To install use one of the usual package managers e.g.

#### Reference build: <a id="download-reference"></a>
- $ `yarn add @tko/build.reference`
- $ `npm install @tko/build.reference`
This is the canonical build without compatibilities with older KnockoutJS versions

#### Compabibility build: <a id="download-compatibility"></a>
- $ `yarn add @tko/build.knockout`
- $ `npm install @tko/build.knockout`
This Knockout build has some backwards compatibility that is not in the reference build. See the build differences, here: https://tko.io/3to4

#### Over CDN <a id="download-cdn"></a>
> **Note**: Latest version available is `alpha8`

- *Reference* Build: https://cdn.jsdelivr.net/npm/@tko/build.reference@4.0.0-alpha8/dist/build.reference.min.js
- *Compatibility* Build: https://cdn.jsdelivr.net/npm/@tko/build.knockout@4.0.0-alpha8/dist/build.knockout.min.js


<br/>

### Using TKO in a project <a id="usage"></a>
Currently there is no default package root import due to availability of different builds listed below. Every TKO build supports all listed below module types:

* ESM <a id="imports-esm"></a>

  ```js
    import ko from "@tko/build.reference/dist/index.js"
  ```

  `ko` is default export so feel free to change import name on your desired.

* IIFE <a id="imports-iife"></a>

  ```js
    import "@tko/build.reference/dist/browser.js"
    // or use already minified bundle
    import "@tko/build.reference/dist/browser.min.js"
  ```

  Imported namespace is available *only* as `tko`.

* CommonJS <a id="imports-cjs"></a>

  ```js
    "@tko/build.reference/dist/index.cjs"
  ```

  TODO

* MJS <a id="imports-mjs"></a>

  ```js
    "@tko/build.reference/dist/index.mjs"
  ```

  TODO

> **Note**: you can check imported TKO version by looking at its namespace attribute `.version<String>` in runtime.


### Sites <a id="sites"></a>

Currently there are 2 points of interest which further would be considered a wiki:
- https://tko.io - wiki specifically for TKO (*not Knockout 4*)
- https://brianmhunt.github.io/knockout - Work In Profress wiki/docs for Knockout


<br/>

## Using the Monorepo <a id="monorepo"></a>
---

The default package manager for monorepo currently is `npm` with the addition of [Lerna](https://lerna.js.org/docs/getting-started) as a viable choice for monorepo management.

First thing at getting familiar with the project monorepo is to look at `./Makefile` at project root. Since its a separate file spanning entire repo, we will cover only the most commonly used commands:

| Command | Effect |
| ------- | ------ |
| $ `git clone git@github.com:knockout/tko` | Clone the repository.
| $ `make` | Install all dependencies, build *reference* and *compatibility* versions of TKO at `builds/*/dist/*` without any transpilation. It is the `default` makefile behavior calling `all` directive.
| $ `make clean` | empties build directories `.../dist/*` and `package-lock.json`'s inside of every `package/*` and `builds/*`
| $ `npm i` | Install local node packages and link tko modules
| $ `make test` | Run all tests. See below.
| $ `make publish-unpublished` | Bump versions and publish to npm registry


---
> **TODO**: remove rollup info as current version uses ESbuild

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


## Objectives <a id="objectives"></a>

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


## Roadmap / Next steps <a id="roadmap"></a>

There's an [issue for that](https://github.com/knockout/tko/issues/1).


## License <a id="license"></a>

MIT license - [http://www.opensource.org/licenses/mit-license.php.](http://www.opensource.org/licenses/mit-license.php)

## Shout Outs <a id="shotouts"></a>

<div>
  <a href='http://browserstack.com'>
    <img height=150px src='https://p3.zdusercontent.com/attachment/1015988/gTNrZ9vPjL8ThUHOWP7ucklJi?token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0..HkCKDttXKDSGFoV5uaMPQA.ha9NDy63mjLKFcyNeib70TCkqfY0dcwiFwDYpZ8s5h75o-e1_cLjPAHlOUEwvKAbfMUaa1XpOL5F9AQd_B4iyc6JbgvKoKBxxe12aaOdfWFccP7r9iQ2Os6myiqBpP79prDXqFPMSAkF8ybzhVqCnWzxmK-Wvkbav-DGPZm3oS2IPD9ueIvf46bggFsikQhf1pjS5fgmzo07yi9Cf5SzA8zIKAjKX1RKQeFXOhBwxRfh_5SbJprfEZMnKBnGuO_qzP2fsK3BvxbyBKpIEWFdnA.t10i3BbyEpGtFVgyGbvQfw' alt='Browser Stack' />
  </a>
<div>
