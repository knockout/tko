Knockout Secure Binding
=======================

 [![Build Status](https://secure.travis-ci.org/brianmhunt/knockout-secure-binding.png?branch=master)](https://travis-ci.org/brianmhunt/knockout-secure-binding)

<!--  [![Selenium Test Status](https://saucelabs.com/browser-matrix/brianmhunt.svg)](https://saucelabs.com/u/brianmhunt)
 -->

Knockout Secure Binding (KSB) adds a binding provider that looks for the
property `data-sbind`. It is a drop-in alternative to `data-bind`, but KSB
does not violate the restrictions imposed by the default *script-src*
[Content Security Policy](http://www.w3.org/TR/CSP/).

This project exists because Knockout's `data-bind` uses `new Function` to
parse bindings, as discussed in
[knockout/knockout#903](https://github.com/knockout/knockout/issues/903).

Using Knockout Secure Binding is as simple as changing `<div data-bind='text: value'></div>` to `<div data-sbind="text: value"></div>`.


The `data-sbind` language
---

The language used in `data-sbind` is a superset of JSON but a subset of Javascript. Let's call it the *sbind* language, for convenience.

The sbind language is closer to JSON than Javascript, so it's easier to describe its differences by comparing it to JSON. The sbind language differs from JSON in that:

1. it understands the `undefined` keyword;
2. it looks up variables on `$data` or `$context` or `globals` (in that order);
3. functions cannot be passed arguments;
4. a subset of Javascript expressions are available (see below);
5. observables that are part of expressions are automatically unwrapped for convenience.

The `data-sbind` binding provider uses Knockout's built-in bindings, so
`text`, `foreach`, and all the others should work as expected.


Security implications
---

One cannot use the default `data-bind` provided by Knockout when a
Content Security Policy prohibits unsafe evaluations (`eval`,
`new Function`, `setTimeout(string)`, `setInterval(string)`).

Prohibiting unsafe evaluations with a Content Security Policy substantially reduces the risk
of a cross-site scripting attack. See for example [Preventing XSS with Content Security Policy](http://benvinegar.github.io/csp-talk-2013/).

By using `data-sbind` in place of `data-bind` one can continue use
Knockout in an environment with a Content Security Policy.

Independent of a Content Security Policy, KSB prevents the execution of arbitrary code in a Knockout binding. A malicious script such as
`text: $.getScript('a.bad.bad.thing')` could be executed in Knockout on a DOM element that is having bindings applied. However this script
will not execute in KSB because:

1. The `$` is a global, and unless explicitly added to the binding context it will not be accessible;
2. Functions in KSB do not accept arguments.

The `data-sbind` differs from `data-bind` as follows:

|           | `data-bind` | `data-sbind`
| --- | --- | ---
| Language  | Executes Javascript  | Parsed JSON-like language
| Globals | Accessible | Must be added to the [Knockout binding context](http://knockoutjs.com/documentation/binding-context.html)
| Functions  | Accepts arbitrary arguments | Arguments are prohibited


Getting started
---

Custom Knockout binding providers follow the same general rules of
application as [knockout-classBindingProvider](https://github.com/rniemeyer/knockout-classBindingProvider).

Here is an example that would mimic the native `data-bind`:

```
options = { globals: window, attribute: "data-bind" };
ko.bindingProvider.instance = new ko.secureBindingsProvider(options);
```

Bear in mind that if you are using an AMD loader, then KSB is exported
(have a look at the example in [knockout-classBindingProvider](https://github.com/rniemeyer/knockout-classBindingProvider)).

**Options**

The `ko.secureBindingsProvider` constructor accepts one argument,
an object that may contain the following options:

- `attribute` – the DOM attribute for the binding, defaults
    to `data-sbind`
- `globals` - Globals accessible in the attributes
- `bindings` - The bindings to use, defaults to `ko.bindingHandlers`

For example, `ko.secureBindingsProvider({ globals: { "$": jQuery }})`.

Expressions
---

KSB supports some [Javascript operations](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence#Table), namely:

| Type | Operators  |
| ---: | :-------- |
| Negation | `!`          |
| Multiplication | `*` `/` `%`      |
| Addition | `+` `-` |
| Comparison | `<` `<=` `>` `>=` |
| Equality | `==` `!=` `===` `!==` |
| Logic | `&&` `||` |


Note that unlike the ordinary `data-bind`, if you refer to an item in an expression in `data-sbind` it will unwrap it. For example:

```
text: a > b
```

where `a` and `b` are observables, they will be unwrapped.

In Knockout if `a` and `b` are observables the comparison will not work as expected. However KSB will unwrap both `a` and `b` before the comparison. This is purely a convenience.

If the varaible referred to is not part of an expression (e.g. `text: a`) then the variable will not be unwrapped before being passed to a binding. This is the expected behaviour.


Tests
---

You can run a standalone server with `npm test`. It will
print the URL for the server to the console. You can connect
to it with any browser and the tests will be executed.

Automated tests with `chromedriver` can be initiated with
`npm start`.

You will need to independently start `chromedriver` with
`chromedriver --url-base=/wd/hub --port=4445`.


Requires
---

Knockout 2.0+

KSB uses some ES5 functions, namely:

- `Array::forEach` and `Array::some`
- `Function::bind`
- `Object::defineProperty`


LICENSE
---

The MIT License (MIT)

Copyright (c) 2013–2014 Brian M Hunt

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

