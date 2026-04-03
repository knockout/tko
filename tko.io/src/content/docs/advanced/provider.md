---
title: Provider
---

# Provider

A provider maps DOM nodes to binding accessors. TKO composes providers so different syntaxes can live side by side.

Common built-in providers include:

| Provider | Example syntax |
| --- | --- |
| `DataBindProvider` | `<span data-bind="text: x"></span>` |
| `VirtualProvider` | `<!-- ko text: x --><!-- /ko -->` |
| `ComponentProvider` | `<custom-hello></custom-hello>` |
| `AttributeProvider` | `<span ko-title="x"></span>` |
| `TextMustacheProvider` | `{% raw %}{{ x_text }}{% endraw %}` |
| `AttributeMustacheProvider` | `{% raw %}<span title="The {{ x }} title"></span>{% endraw %}` |
| `MultiProvider` | Combine multiple providers together |
| `NativeProvider` | `ko-*` attributes attached by JSX or other native render paths |

Most apps use the built-in providers that ship with TKO. If you need custom syntax or preprocessing, implement the provider interface:

| Method | Purpose |
| --- | --- |
| `nodeHasBindings(node)` | Return `true` when this provider should parse the node |
| `getBindingAccessors(node, context)` | Return the binding accessors for the node |
| `FOR_NODE_TYPES` | Declare which node types the provider handles |
| `preprocessNode(node)` | Rewrite or expand nodes before binding starts |

Use `bindingProviderInstance` to choose the provider or provider composition your app runs with.

`NativeProvider` is the bridge for the modern TSX path: it lets JSX-generated nodes carry `ko-*` bindings directly into the provider pipeline without going through `data-bind` strings.
