
##  🐚   Alpha-0  (9 Nov 2016)

For TODO see https://github.com/knockout/tko/issues/1

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
