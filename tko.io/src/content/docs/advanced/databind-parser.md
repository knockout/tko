---
title: DataBind Parser
---

# DataBind Parser

TKO treats binding parsing as a provider concern. If you need `data-bind` syntax, start with [Provider](./provider/) and compose the provider set your app needs.

The modern building blocks are:

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

For the interface details, see [Provider](./provider/).
