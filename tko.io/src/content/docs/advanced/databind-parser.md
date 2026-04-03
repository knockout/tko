---
title: DataBind Parser
---

# DataBind Parser

The `data-bind` parser powers the classic Knockout-style binding syntax:

```html
<button data-bind="click: increment, enable: canSave">Save</button>
```

In TKO, parsing is a provider concern. If your UI still uses `data-bind`, use `DataBindProvider` as part of your binding provider stack. For new UI, prefer TSX with `ko-*` attributes so you can avoid binding-string parsing entirely.

One practical advantage of TKO's parser model is that it does not depend on `eval` or `new Function`, which makes classic markup easier to use under stricter Content Security Policies than older Knockout-era approaches.

The parser covers the usual `data-bind` object-literal syntax, including:

* multiple bindings on a single node
* nested object literals such as `attr: { href: url, title: details }`
* expression-style values that read observables or call helpers
* integration with virtual/comment bindings when paired with `VirtualProvider`

If you need `data-bind` syntax, start with [Provider](./provider/) and compose the provider set your app needs. The common building blocks are:

* `DataBindProvider` for `data-bind`
* `VirtualProvider` for comment bindings
* `ComponentProvider` for custom elements
* `AttributeProvider` for `ko-*` attributes
* `TextMustacheProvider` and `AttributeMustacheProvider` for mustache-style syntax
* `MultiProvider` when you want to combine multiple syntaxes in one app

In practice, the provider instance decides how nodes are parsed and which binding accessors they produce.

```javascript
import { DataBindProvider } from '@tko/provider.databind'
import { MultiProvider } from '@tko/provider.multi'
import { VirtualProvider } from '@tko/provider.virtual'

options.bindingProviderInstance = new MultiProvider({
    providers: [new DataBindProvider(), new VirtualProvider()]
})
```

If you need custom parsing rules, build them by implementing the provider interface instead of depending on old parser bundles or build-tool-specific wrappers.

Use the parser when you are:

* migrating or maintaining classic Knockout markup
* keeping an HTML-first template flow that still relies on binding strings
* tightening CSP without rewriting the UI to TSX yet

For new UI, prefer TSX and `ko-*`. For provider composition details, see [Provider](./provider/).
