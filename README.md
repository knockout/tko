
# TKO (“Technical Knockout”)

[![npm version](https://badge.fury.io/js/@tko%2Fbuild.reference.svg)](https://badge.fury.io/js/@tko%2Fbuild.reference)
[![Join the chat at https://gitter.im/knockout/tko](https://badges.gitter.im/knockout/tko.svg)](https://gitter.im/knockout/tko?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

[![Check 'Main' (build+tsc)](https://github.com/knockout/tko/actions/workflows/run-tsc.yml/badge.svg)](https://github.com/knockout/tko/actions/workflows/run-tsc.yml)
[![Coverage Status](https://coveralls.io/repos/knockout/tko/badge.svg?branch=master&service=github)](https://coveralls.io/github/knockout/tko?branch=master)
[![Circle CI](https://circleci.com/gh/knockout/tko.svg?style=shield)](https://circleci.com/gh/knockout/tko)
<!-- [![Sauce Test Status](https://saucelabs.com/browser-matrix/tko.svg)](https://saucelabs.com/u/tko) -->

**TKO** houses the monorepo of [Knockout](https://github.com/knockout/knockout).
TKO, or Technical Knockout, is a JavaScript web framework for data binding and templating. It is a fork of the original Knockout.js, which was created to enhance and modernize the framework while maintaining its core principles. TKO and Knockout implement the [MVVM pattern](http://en.wikipedia.org/wiki/Model_View_ViewModel) (a modern variant of MVC) as a zero-dependency and small sized library. TKO makes it easy to create rich, desktop-like user interfaces with JavaScript/Typescript and HTML. It uses *observers* to automatically keep your UI in sync with an underlying data model, along with a powerful and extensible set of *declarative bindings* to enable productive development. 

TKO aims to provide developers with a more robust, modular, and maintainable codebase in [Typescript](https://www.typescriptlang.org/), making it easier to build rich, responsive, and maintainable web applications.



## Getting Started

To install use one of the usual package managers e.g.

- $ `yarn add @tko/build.reference`
- $ `npm install @tko/build.reference`
- $ `pnpm install @tko/build.reference`


Over CDN

- Reference Build: https://cdn.jsdelivr.net/npm/@tko/build.reference/dist/build.reference.min.js

For more details, see

 * TKO - Documentation (https://tko.io)
 * Knockout - Documentation (http://knockoutjs.com/documentation/introduction.html)
 * Online examples at [http://knockoutjs.com/examples/](http://knockoutjs.com/examples/)
 * Stackoverflow https://stackoverflow.com/questions/tagged/knockout.js

## Knockout Build

The Knockout build has some backwards compatibility that is not in the reference build.  See the build differences, here: https://tko.io/3to4

It's available as `@tko/build.knockout`, and over CDN:

- Knockout Build https://cdn.jsdelivr.net/npm/@tko/build.knockout/dist/build.knockout.min.js

### Using the Monorepo

| Command | Effect |
| ------- | ------ |
| $ `git clone git@github.com:knockout/tko` | Clone the repository. |
| $ `npm install` | Ensure that all packages available |
| $ `make` | **Currently TKO use a make file** / no scripts at package.json |
| $ `make test` | Run all tests with electron. See below. |
| $ `make test-headless` | Run all tests with chromium. See below. |
| $ `lerna publish` | Bump versions and publish to npm registry |

Checkout the `Makefile` for more commands that can be executed with `make {command}`.

In each individual `packages/*/` directory, you can also run:

| Command | Effect |
| --- | --- |
| $ `karma COMMAND ../../karma.conf.js [--once]`  | Test the local package, where COMMAND is e.g. `start` or `run` |
| $ `make test-debug` | Runs all tests in the current package in debug- and watch-mode: Attach vscode, set a breakpoint, press save and debug |

### Testing

Start tests with electron: `make test`

Start tests with headless-chrome: `make test-headless`

The test setup has naturally grown and been ported from knockout.js. Some tests use Jasmine 1.3, newer ones use Mocha, Chai and Sinon. Karma is used as test runner rather as test pipeline

Other options:

- `make ci` — use Sauce Labs to test a variety of platforms; requires an account at Sauce Labs and `SAUCE_USERNAME` and `SAUCE_ACCESS_KEY` to be set in the environment.

#### `visual.html` (possibly outdated)

Note that running `karma` will create a `visual.html` file that shows the proportional size of imports into each package.

## Objectives

TKO aims to become a base for future versions of Knockout.  The objectives include:

- Modularization into ES6 and separate projects, with compilation using an ES6 compiler like [Esbuild](https://esbuild.github.io/).  This solves several problems with Knockout, including:
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
- Type-safe with Typescript
- CSP compliant
- JSX/TSX support

## Overview of the development stack

- **make** -> Build tasks
- **npm** -> Node Package Manager
- **esbuild** -> ts/js compiler and bundler
- **lerna** -> mono-repo build-chain
 
---

- Test-Runner -> Karma
- Test-Environment -> electron and headless-chrome
- TDD/BDD-Frameworks -> 
    - Jasmine 1.3
    - Mocha + Chai
    - sinon (Mocks)
- Testing-Cloud-Service -> sauce
- standard -> Code-Style (outdated for typescript)

## Some WSL tricks

Install electron-deps for "make test":

```bash
sudo apt-get install build-essential clang libdbus-1-dev libgtk-3-dev \
libnotify-dev libasound2-dev libcap-dev \
libcups2-dev libxtst-dev \
libxss1 libnss3-dev gcc-multilib g++-multilib curl \
gperf bison python3-dbusmock openjdk-8-jre
```

Install Chrome for "make test-headless":

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt -y install ./google-chrome-stable_current_amd64.deb
```

## Next steps

There's an [issue for that](https://github.com/knockout/tko/issues/1).

## License

MIT license - [http://www.opensource.org/licenses/mit-license.php.](http://www.opensource.org/licenses/mit-license.php)

## Shout Outs

<div>
  <a href='http://browserstack.com'>
    Browser Stack
  </a>
<div>
