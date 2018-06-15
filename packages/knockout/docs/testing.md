## Knockout Specifications

The `spec/` directory in the tko monorepo includes all the specifications from Knockout 3.X, modified accordingly.

Notes:

- All tests now run in [`Strict mode`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode).
- `with` is disabled in strict mode, so:
	- tests that use renderTemplateSource are disabled at templatingBehaviours:43.
  - skip expressionRewritingBehaviours:43 / (Private API) Should convert writable values to property accessors
- `observableArrays.trackArrayChanges` exposes the `compareArrays` function, for testing
- `ko.expressionRewriting` has been removed (as we now have own CSP-safe parser)
- `ko.expressionRewriting.parseObjectLiteral` is now exposed as `ko.utils.parseObjectLiteral`
- Since `with` is not supported in strict mode, and everything is now compiled in strict mode, the `dummyTemplateEnging` in `templatingBehavior` tests had to be rewritten.
- expose `dependencyDetection` as `computedContext`
- removed `postJson` tests
- expose the Knockout instance from which a `BindingContext` was created as `$context.ko`
- make the Knockout instance changeable, via `ko.options.knockoutInstance`
- .length tests depend on whether .length is overwriteable
