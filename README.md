Knockout Secure Binding (KSB)
=============================

 [![Build Status](https://secure.travis-ci.org/brianmhunt/knockout-secure-binding.png?branch=master)](https://travis-ci.org/brianmhunt/knockout-secure-binding)

Knockout Secure Binding (KSB) adds a binding provider that looks for the
property `data-sbind`. It is a drop-in alternative to `data-bind`, but KSB
does not violate the restrictions imposed by the default *script-src*
[Content Security Policy](http://www.w3.org/TR/CSP/).

This project exists because Knockout's `data-bind` uses `new Function` to
parse bindings, as discussed in
[knockout/knockout#903](https://github.com/knockout/knockout/issues/903).


Language
---

The language used in the bindings is a proper superset of JSON, differing in that:

1. the binding understands `undefined` keyword
2. the binding looks up variables on `$data` or `$context`.

Some examples of the `data-sbind` are below.

The `data-sbind` differs from `data-bind` as follows:

|           | `data-bind` | `data-sbind`
| --- | --- | ---
| Language  | Executes Javascript  | Parsed Javascript-like language
| --- | --- | ---
| Globals | Any | Must be added to context
| --- | --- | ---
| Function  | Any | Do not accept arguments
| arguments |     |

Globals must be explicitly added to the
[Knockout binding context](http://knockoutjs.com/documentation/binding-
context.html) to be accessible.


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
- `text: $element.id`

The `data-sbind` binding provider uses Knockout's built-in bindings, so
`text`, `foreach`, and the others should work as expected.

Future bindings may expand our language to include:

- Array numerical lookups: `text: value[0]`
- Array string lookups: `text: value['x']`
- Array variable lookups: `text: value[$index()]`
- Compound array values: `text: value[0].abc`


Security implications
---

The default binding provider for Knockout will not apply bindings when
Content Security Policy prohibits the use of `new Function`.

This is a worthwhile CSP prohibition. It prohibits Cross-site scripting (XSS). See e.g.

* [Preventing XSS with Content Security Policy](http://benvinegar.github.io/csp-talk-2013/).

As well, KSB also prevents the execution of arbitrary code in a Knockout
binding. A malicious user could execute `text: $.getScript('...')` in
Knockout on a DOM element that is having bindings applied, but this will not succeed in KSB because:

1. The `$` is a global, and unless explicitly added to the binding context it will not be accessible;
2. Functions in KSB do not accept arguments;
3. A Content Security Policy can be enabled that prevents `script-src` from untrusted sources.

Nevertheless, as you are undoubtedly aware, this is likely just one small
piece of the security strategy applicable to your situation.


Usage
---

This is a custom binding provider, and follows the same rules of application as, for example, [knockout-classBindingProvider](https://github.com/rniemeyer/knockout-classBindingProvider).

```
ko.bindingProvider.instance = new ko.secureBindingsProvider(bindings, options);
```

Bear in mind that if you are using an AMD loader, then KSB is exported (have a look at the example in the linked `classBindingProvider`).


Tests
---

Automated tests with `chromedriver` can be initiated with
`node spec/runner.js`.

You can run a standalone server with `node spec/server.js`. It will
print the URL for the server to the console.


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

