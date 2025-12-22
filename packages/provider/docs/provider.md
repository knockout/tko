
# Provider

The `Provider` is a class that is responsible for linking nodes to binding handlers.  Several are built into Knockout, including:

| Provider  | Sample
| --------   | --- |
| `DataBindProvider` | `<span data-bind='text: x'></span>`
| `VirtualProvider`  | `<!-- ko text: x --><!-- /ko -->`
| `ComponentProvider` | `<custom-hello></custom-hello>`
| `AttributeProvider` | `<span ko-title='x'></span>`
| `TextMustacheProvider` | `{{ x_text }}` <br> `{{{ x_html }}}` <br> `{{# text: thing /}}`
| `AttributeMustacheProvider` | `<span title='The {{ x }} title'></span>`
| `MultiProvider` | Combines more than one provider together.

When building custom versions of tko, one can choose to use one or more binding providers, or to create a custom binding provider.

The `Provider` class is an abstract interface, whose subclasses must contain:

| Attribute | Reason |
| -- | -- |
| `nodeHasBindings(node)` | A method that returns true when the `node` is one that this provider can link.
| `getBindingAccessors(node, context)` | A method that returns an object containing one or more `{handler: accessor}` where `handler` is a the name of a registered BindingHandler and `accessor` is a function that returns the `valueAccessor`.
| `FOR_NODE_TYPES` | An array of integers corresponding to the `nodeType` attributes of nodes that shall match (i.e. `1` for `Node.ELEMENT_NODE`, `3` for `Node.TEXT_NODE`, `8` for `Node.COMMENT_NODE`)
| `preprocessNode(node)` | Perform any preprocessing on the `node`; may replace the `node` with one or more substitute nodes or append `nodes` after it.
