---
title: Introduction
kind: Title
---

TKO is a web framework, and the foundation for Knockout 4.

With TKO you can:

- **Declare bindings**
  Easily associate DOM elements with model data using a concise, readable syntax
- **Two-way observables**
  Data model and DOM stay in sync
- **Computed observables**
  Create chains of calculated variables dependencies
- **Templating**
  Create reusable components and sophisticated web applications



## Getting started

Include *alpha-3* with this `<script>`:

```html
<script src="https://unpkg.com/tko@4.0.0-alpha3/dist/ko.js"
integrity="sha384-W6Un9ta1JSOmCbK7YkdGGfyu+fDGY5e0II5CCyMKKXaYrpiJAt2q5YQH2ICQi4QA"
crossorigin="anonymous"></script>
```

or install the monorepo it locally with

```bash
$ npm install tko
```

Clone the code with

```bash
$ git clone git@github.com/knockout/tko
```

## Learning More

<!-- tutorial -->
<!-- books -->

<h2>Live example</h2>

```example-binding
name: Introduction
html: |-
  Choose a ticket class
  <select data-bind='options: tickets,
                     optionsCaption: "Choose ...",
                     optionsText: "name",
                     value: chosenTicket'></select>

  <button data-bind='enable: chosenTicket,
                     click: resetTicket'>Clear</button>

  <p data-bind='with: chosenTicket'>
    You have chosen <b data-bind='text: name'></b>
    ($<span data-bind='text: price'></span>)
  </p>


javascript: |-
  function TicketsViewModel() {
    this.tickets = [
      { name: "Economy", price: 199.95 },
      { name: "Business", price: 449.22 },
      { name: "First Class", price: 1199.99 }
    ];
    this.chosenTicket = ko.observable();
    this.resetTicket = function () {
      this.chosenTicket(null);
    };
  }

  ko.applyBindings(new TicketsViewModel());
```
