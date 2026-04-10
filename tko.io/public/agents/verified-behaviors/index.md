# Verified Behaviors Index

Use `/llms.txt` as the index for the full agent docs set.

> Generated from package discovery plus package-local curated unit-test-backed JSON.
> If a behavior is not covered by unit tests, it does not belong in this directory.

Package-scoped behavior summaries for agents. Every package gets a file.

## Packages

- [@tko/bind](./bind.md) - Binding application, binding-handler lifecycle, and completion callbacks.
- [@tko/binding.component](./binding-component.md) - Component binding runtime, slots, virtual elements, and JSX/object templates.
- [@tko/binding.core](./binding-core.md) - Core element bindings such as `event` and descendant-completion hooks.
- [@tko/binding.foreach](./binding-foreach.md) - Standalone `foreach` binding behavior, templates, and else-chain state.
- [@tko/binding.if](./binding-if.md) - Conditional and contextual bindings: `if`, `ifnot`, `with`, `else`, and `elseif`.
- [@tko/binding.template](./binding-template.md) - Template and foreach rendering, including `nodes`, callbacks, and destroyed-item handling.
- [@tko/builder](./builder.md) - Builder construction from explicit provider, binding, filter, and option inputs.
- [@tko/computed](./computed.md) - `computed`, `when`, `throttle`, and `rateLimit` behavior covered by the async/unit specs.
- [@tko/filter.punches](./filter-punches.md) - Built-in string, defaulting, fitting, and JSON filters.
- [@tko/lifecycle](./lifecycle.md) - Lifecycle mixins for subscriptions, computeds, DOM listeners, and anchored disposal.
- [@tko/observable](./observable.md) - Core observable and observableArray notification and mutation behavior.
- [@tko/provider](./provider.md) - Provider base-class behavior and constructor contract.
- [@tko/provider.attr](./provider-attr.md) - Attribute-based `ko-*` binding discovery on elements.
- [@tko/provider.bindingstring](./provider-bindingstring.md) - Binding-string providers that return parseable binding text.
- [@tko/provider.component](./provider-component.md) - Custom-element component provider behavior and component parameter handling.
- [@tko/provider.databind](./provider-databind.md) - `data-bind` parsing, expression lookup, and end-to-end binding accessors.
- [@tko/provider.multi](./provider-multi.md) - Provider composition, preemption, and node-type filtering.
- [@tko/provider.mustache](./provider-mustache.md) - Mustache-style text and attribute interpolation providers.
- [@tko/provider.native](./provider-native.md) - Native `ko-*` binding accessors attached directly to DOM nodes.
- [@tko/provider.virtual](./provider-virtual.md) - Virtual comment-node bindings and `<ko>` preprocessing.
- [@tko/utils](./utils.md) - Task scheduling, DOM disposal, memoization, HTML parsing, and array diff utilities.
- [@tko/utils.component](./utils-component.md) - Class-based component registration through `ComponentABC` and the default component utilities.
- [@tko/utils.functionrewrite](./utils-functionrewrite.md) - Rewriting classic function literals in binding strings.
- [@tko/utils.jsx](./utils-jsx.md) - JSX object-to-DOM conversion, reactive children and attributes, and async child handling.
- [@tko/utils.parser](./utils-parser.md) - Binding-expression parsing, identifier lookup, filters, namespaces, and preprocess hooks.
