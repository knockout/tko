Knockout Secure Binding
=======================

Add `data-sbind`, an alternative to `data-bind`, that does not violate
*script-src* Content Security Policy.

Knockout's data-bind provider uses `new Function`, as seen in knockout/knockout#903.

A `data-sbind` would not execute arbitrary javascript, but instead would be limited to lookups.

This is something like [knockout-](`https://github.com/rniemeyer/knockout-classBindingProvider`).

Objectives
---
Re-use as many accessor bindings as we can without having to change them.

Requires
---

Knockout 2.0+

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
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

