## Knockout Specifications

The `spec/` directory in the tko monorepo includes all the specifications from Knockout 3.X, modified accordingly.

Notes:

- `with` is disabled in strict mode, so:
	- tests that use renderTemplateSource are disabled at templatingBehaviours:43.
  - skip expressionRewritingBehaviours:43 / (Private API) Should convert writable values to property accessors
- `observableArrays.trackArrayChanges` exposes the `compareArrays` function, for testing
