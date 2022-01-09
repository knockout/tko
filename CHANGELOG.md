For TODO between alpha and release, see https://github.com/knockout/tko/issues/1

## upcoming

- fix equality comparison for select option values (#155/#163 @danieldickison)
- fix identifier set_value in parser (#157/#161 @danieldickison)
- remove mustache from text/attr bindings by default (#156 @danieldickison)
- knockout function rewrite improvements (#156 @danieldickison)
- change parsing algorithm to Shunting Yard (#151 @danieldickison)
- Switch to `esbuild`
- add `preventDefault` to event handler bindings
- switch source to Typescript (but no types exported yet)
- change build.reference & build.knockout build export strategy

## 👑 `alpha 9` (28 Feb 2020)

* Fix JSX observable properties being overwritten with observed value on the NativeProvider

## 🐇 `alpha 8.4a` (24 Oct 2019)

* Make the `NativeProvider` less preemptive i.e. allow other bindings to proceed if there are no native (JSX) bindings.  This means `data-bind` and other attributes can be used inside JSX.

## 🐇 `alpha 8.4` (24 Oct 2019)

* [Security] Make the `NativeProvider` preemptive so that observables passed to JSX won't be double-bound (preventing XSS attacks of the form `<div>{jsxObservable}</div>` where `jsxObservable` is `{{ some_variable }}`).

## 🧤  `alpha 8.3` (28 Sept 2019)

* Queue JSX node cleaning in batches

## 🥿 `alpha8.2 ` (22 Sept 2019)

* Fix `SlotBinding` being called twice via JSX/Observables

## 🥾 `alpha8.1 ` (20 Sept 2019)

* Add support for passing generators to JSX
* Fix parsing of objects with trailing commas (e.g. `{ a: 1, }`)
* Fix nested JSX observers not binding children

## 👢 `alpha8.0` (1 July 2019)

* Update build system (experimenting)
* Change JSX behaviour so Node instances in observables are not cloned.  This behaviour allows injecting `HTMLCanvasElement` instances without losing the canvas content.
* Fix case where JSX `computed` value is initially `null` or `undefined`

## 🎇 `alpha7`

* Make node cleaning upon removal with JSX asynchronous
* Add `createElement` to the `tko` reference build, that (essentially) mimics `React.createElement`
* Fix and add test for `applyBindingsToNode` being used in delegation (i.e. with computeds)
* Fix typo in `ieAutoCompleteHackNeeded` for `value` binding

## 🎒 `alpha-5a..alpha6.x`  (ongoing)

* JSX now supports infinitely nestable observables/arrays
* JSX now uses `trackArrayChanges` to give O(1) updates to arrays
* LifeCycle::subscribe now binds to the current class instance
* The `tko` package will now be published as `@tko/build.reference`, and knockout as `@tko/build.knockout`
* Mass move of `tko.*` to the `@tko` organization i.e. `@tko/`
* Test release
* Fix auto-unwrapping of Jsx attributes
* Allow JSX to be used with SVG elements, and respect xmlns attribute
* Refresh JSX node when it's subscribable
* Make `<slot>` elements and JSX play better together
* Fix JSX computed not working when returning an array of observables
* Fix futures resolving to observables
* Fix node subscriptions not being properly disposed

## 🎩  `alpha-5` (4 July 2018)

* (observable) When supported, `observable.length` will now be undefined (was `0` before), and `observableArray.length` will now be the length of the wrapped array
* (observableArraty) `observableArray` is now iterable (has a `Symbol.iterator` property)
* (utils) Several array utilities use native functions now (`arrayPushAll`, `arrayFilter`, `arrayGetDistinctValues`, `arrayFirst`, `arrayIndexOf`)
* (various) forward-ports per #5
* (components) Warn with custom-element names that cannot be used with custom elements re. #43 & knockout/knockout#1603
* (`event` binding) Add object-based event handler e.g. `event.click: { handler: fn, once: true, capture: true, bubble: false, passive: false}`.  Also, bubbling can be prevented with `event.click: {bubble: false }` re #32
* (`event` binding) Add `throttle` and `debounce` parameters
* The `throttle` and `debounce` utilities now pass arguments to the target functions
* (components) Allow Component-specific binding handlers from `component.prototype.getBindingHandler`
* (components) Issue a warning if `ignoreCustomElementWarning` is not passed to a component registration and the component name is not usable for custom elements.
* (observable) Removed `then` from `observable.fn` because it'll likely cause a lot of confusing issues with implicit unwrapping from `async` functions.
* (observable) Add `ko.proxy` and related functions `ko.proxy.peek(obj, prop)`, `ko.proxy.isProxied(obj)`, `ko.proxy.getObservable(obj, prop)`.
* Fix missing `ko.when` and `ko.isObservableArray`
* Add `options.bindingStringPreparsers` array of functions that mutate binding strings before they are parsed
* Parse ES2015 object initializer shorthands e.g. `{name}` = `{name: name}`
* Expose `ko.computedContext` as alias of `ko.dependencyDetection`
* Support JSX for component templates, so the `template` can consume the output of [babel-plugin-transform-jsx](https://www.npmjs.com/package/babel-plugin-transform-jsx)
* Support component template slots, much like those in Vue.js.
* Support `template` properties on Component View models (previously they had to be static properties)
* Numerous forward-ports from Knockout 3.x (#54)
* Expose `createViewModel` on Components registered with `Component.register`
* Changed `Component.elementName` to `Component.customElementName` and use a kebab-case version of the class name for the custom element name by default
* Pass `{element, templateNodes}` to the `Component` constructor as the second parameter of descendants of the `Component` class
* Add support for `<ko binding='...'>`
* Add basic support for `ko.subscribable` as TC39-Observables

## 🚚  Alpha-4a (8 Nov 2017)

* (build) Change the `tko` export to `global.ko` for backwards compatibility (instead of global.tko).

## 🚜  Alpha-4 (8 Nov 2017)

* (components) Add `ko.Component`, an abstract base class that simplifies the Component creation and registration API (see `tko.utils.component/src/ComponentABC.js`)
* (with binding) Fix dependency count for function-arguments [knockout/knockout#2285]
* (options) Allow importing `ko` in node
* (components) Add `getBindingHandler(key)` to use binding handlers local to a component
* (docs) Add `/tko.io` with structure for building and deploying documentation website
* (npm) Publishing all packages as 4.0.0-alpha4

## 🏰  Alpha-3 (30 June 2017)

* (build) Compiles to `dist/ko.js` (via Babel)
* (build) The `dist/tko.js` (that exported `tko`) has been deprecated/removed
* (internal) Add the ES6 LifeCycle class (see tko.lifecycle)
* (binding handlers) Add new-style ES6 Binding Handler class (see custom-bindings documentation and tko.bind/src/BindingHandler.js), descended from the LifeCycle class
* (lifecycle) Fix error with event handler type
* (provider) Add & document the Provider base class
* (subscribable) Add the `once`, `then`, `when`, `yet`, and `next` functions
* (parser) Fix early-out for logical (&& / ||) operators
* (binding) `ko.applyBindings` now returns a Promise that resolves when bindings are completed
* (attr) Support namespaced attributes with `attr` binding #27
* (options) Add the `options.Promise`, so users can use a their own or a safe Promise variant of A+/Promises (defaults to `window.Promise`)
* (attribute-interpolation) Fix interpolation of `styles` attribute (e.g. `style="color: {{color}}"`) in the `AttributeMustacheProvider`, by adding `attributesBindingMap` parameter.

## 🐋   Alpha-2  (3 May 2017)

* (API) Expose `dependencyDetection.ignore` as `ignoreDependencies`
* (foreach binding) When using the `as` parameter, the `$data` remains unchanged (i.e. the context inside a `foreach` is no longer a "child" context, but an extension of the current context); this deprecates the `noContext` parameter
* (foreach binding) Expose the `conditional` on the `domData` for use by the `else` binding (when the array is empty, the `else` binding will be rendered)
* (foreach binding) Expose `$list` inside the foreach
* (foreach binding) Allow `noIndex` as a peer binding parameter (e.g. `foreach: items, noIndex: true`)
* (bind) String errors on binding are now propagated
* (provider) Fix dereferencing of namespaced items e.g. attr.title: `${v}`
* (parser) Fix unary negation
* (foreach) Preserve focus when items are deleted and re-added (i.e. moved) in the same animation frame.
* (observable array) Incorporate 3.4 fix for memory leak
* (parser) Fix array values not being unwrapped/called e.g. `data-bind="x: [f(), observable, 1 + 6, `a ${x} c`]"`
* (parser) Fix interpretation of unicode characters as identifiers / variables

##  🏹  Alpha-1  (20 Dec 2016)

* Fix negation operator (-) application - integers/floats e.g. `-1` work, as well as variables `-x` and expressions `-(x + y)`
* Use tko.binding.foreach for the `foreach` binding (based on brianmhunt/knockout-fast-foreach)
* Add `each` as an alias of `foreach`

* Parser
  * Correct behavior with dereferencing members of expressions (e.g. `(x || y).z` or `(abc || {x: null})['x']`)
  * Fix canonical (`() => ...`) lambdas
  * Support C & C++ style comments (knockout/knockout#1524)
  * Fix filter/or ambiguity on pipe `|`
  * Raise an error with anonymous functions
  * Fix && and || operator precedence

* Updated Rollup - changes order of compilation, smaller output
* Fix issue with first rendering of an elseif binding
* Make the `template` binding expose a conditional for else-binding
* Expose ko.dependencyDetection
* Make sure `obj.x` uses `this` of `obj` where `x` is a function (e.g. `click: model.onClick` has `this` of `model`)
* Ensure `obj.x` only uses `obj` as `this` when `x` is a prototypal method (and not just a value)
* Honour explicit references to `this` (as `$data`)
* Ensure bindings with multiple filters work as expected
* If available, use a WeakMap for DOM node data (resolves knockout/knockout#2141)
* Fix filters not separated by whitespace (e.g. `value|filter1|filter2`)

##  🐚   Alpha-0  (9 Nov 2016)

The following are short-hands for the changes from Knockout 3.4(.1).

* various new [`options`](https://github.com/knockout/tko.utils/blob/master/src/options.js)

* rewritten as ES6 in multiple packages, so it can be mixed/matched
  * e.g. observables are usable independently from knockout/tko.observable

* rewritten data-bind parser
  * add "naked" `=>` lambdas (even in legacy browsers e.g. `data-bind='click: => was_clicked(true)'`
  * inline functions are no longer supported (e.g. `data-bind='click: function (){...}'` will fail)
  * Can be used with Content-Security-Policy `unsafe-eval`
  * No longer uses `with` statements
  * No longer uses `eval`/`new Function`
  * support template literals (``) in bindings (even in legacy browsers)
  * `==` and `===` use `===` for comparison (same for `!=` and `!==`); fuzzy equality ~== / ~!= for the evil twins
  * add the `@` prefix operator that calls/unwrap functions (i.e. `obs()()` is the same as `@obs`)

* incorporate punches `{{ }}` and `{{{}}}` text and attribute interpolation

* utils
  * utils.domNodeDisposal is now exposed as domNodeDisposal
  * arguments to setHtml that are functions are called (not just observables)
  * cleanExternalData now exposed in domNodeDisposal.otherNodeCleanerFunctions

* error handling
  * onError no longer throws if overloaded; default function is to re-throw.
  * error is thrown when an extender is not found

* bindings
  * add `<!-- else -->` inside the `if` binding, and add an `else` binding (following the brianmhunt/knockout-else plugin)
  * add `hidden` binding (knockout/knockut#2103)
  * `using` binding in tko.binding.core
  * `html` binding in virtual elements (from punches)
  * punches-like `value|filter` filtering
  * incorporate punches namespacing i.e. `data-bind='event.click: => thing(true)'` is equivalent to `data-bind='event: {click: => thing(true)}'`

* bindng handler updates
    * the `valueAccessor` passed to a binding handler is now callable, the first argument being a 'setter' of the object property or observable (this replaces `twoWayBinding`)
    * `allowVirtualElements` can now be set with a property on a bindingHandler

* Updated preprocessor API

* Deprecated
  * Template binding options are deprecated
  * expressionWriting (twoWayBinding)
  * ‘.’ in binding handler names
  * jsonExpressionRewriting (expressionRewriting)
  * form parsing
  * `bind` shim
  * ko.utils.parseJson
  * getFormFields
  * fieldsIncludedWithJsonPost
  * postJson
