---
title: Introduction
kind: Title
---

## Welcome.

This is the landing page and future home of the documentation for [`tko`](https://github.com/knockout/tko),
candidate for Knockout 4.0.

This page is presently a work in progress.


<h2>Key Concepts</h2>
<div class='pure-g'>
  <div class='pure-u-1 pure-u-sm-5-24 pad'>
    <i class='fa fa-link fa-4x'></i>
    <h4>Declarative bindings</h4>
    Easily associate DOM elements with model data using a
    concise, readable syntax
  </div>
  <div class='pure-u-1 pure-u-sm-1-4 pad'>
    <i class='fa fa-refresh fa-4x'></i>
    <h4>Automatic UI refresh</h4>
    When your data model's state changes, your UI updates automatically
  </div>
  <div class='pure-u-1 pure-u-sm-1-4 pad'>
    <i class='fa fa-code-fork fa-4x'></i>
    <h4>Dependency Tracking</h4>
    Implicitly set up chains of relationships between model data, to
    transform and combine it
  </div>
  <div class='pure-u-1 pure-u-sm-1-4 pad'>
    <i class='fa fa-newspaper-o fa-4x'></i>
    <h4>Templating</h4>
    Quickly generate sophisticated, nested UIs as a function of your
    model data
  </div>
</div>


<h2>Some ways to get started</h2>

<div class='pure-g'>
  <div class='pure-u-1 pure-u-sm-1-2'>
    <a class='pure-button button-learn' href='http://learn.knockoutjs.com'>
      <i class='fa fa-university fa-2x'></i>
      Interactive tutorial
      <small>&lt;learn.knockoutjs.com&gt;</small>
    </a>
  </div>
  <div class='pure-u-1 pure-u-sm-1-2'>
    <a href='books.html' class='pure-button button-literature'>
      <i class='fa fa-2x fa-book'></i>
      Literature
      <small>Blogs, books, etc.</small>
    </a>
  </div>
</div>


<h2>Live example</h2>

```example
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
