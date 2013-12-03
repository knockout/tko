Knockout Secure Binding (KSB)
=============================

Knockout Secure Binding (KSB) adds a `data-sbind` binding provider, a drop-in alternative to `data-bind`, that does not violate the restrictions imposed by the default *script-src*
[Content Security Policy](http://www.w3.org/TR/CSP/).

This project exists because Knockout's `data-bind` uses `new Function`
to parse bindings, as discussed in
[knockout/knockout#903](https://github.com/knockout/knockout/issues/903).

This is not to say that any particular binding is free of such a call
to this or other CSP-restricted functions. This only deals with the
parsing portion.


Language
---

The language used in the bindings is a proper superset of JSON, differing in that:

1. the binding understands `undefined` keyword
2. the binding looks up keywords on `$data` or `$context`.


Objectives
---
The `data-sbind` parser is designed to accommodate bindings much like the
regular `data-bind`.

Here are some examples of valid values for `data-sbind`:

- `text: value`
- `text: "string"`
- `text: { object: "string" }`
- `foreach: [1, 2.1, true, false, null, undefined]`
- `text: value()`
- `text: $data.value()`
- `text: $context.obj().value()`

Where the example bindings here (`text` and `foreach`) are Knockout's
built-in bindings. The `data-sbind` binding provider uses Knockout's
built-in bindings, as extended.

Future bindings may expand our language to include:

- `text: value[0]`
- `text: value[0].abc`
- `text: value[0]().abc["str"]`
- `text: value(arg1, "arg2", 3)`


Usage
---

This is a custom binding provider, and follows the same rules of application as, for example, [knockout-classBindingProvider](https://github.com/rniemeyer/knockout-classBindingProvider).

```
ko.bindingProvider.instance = new ko.secureBindingsProvider(bindings, options);
```

Bear in mind that if you are using an AMD loader, then KSB is exported (have a look at the example in the linked `classBindingProvider`).


Requires
---

Knockout 2.0+

KSB may use some ES5isms such as `Array.forEach`.


LICENSE
---

The MIT License (MIT)

Copyright (c) 2013 Brian M Hunt

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

