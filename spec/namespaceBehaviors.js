/* eslint semi: 0 */

import {
  options, triggerEvent
} from 'tko.utils';

import {
  observable
} from 'tko.observable';

import {
  applyBindings
} from 'tko.bind';

import {
  Provider
} from '../index.js';

import {
  bindings as coreBindings
} from 'tko.binding.core';


var instance, Parser;
beforeEach(function () {
  instance = new Provider();
  Parser = instance.Parser;
})


describe("Parser Namespace", function () {
  function trial(context, binding, expect) {
    var p = new Parser(null, context).parse(binding)
    assert.deepEqual(p.on(), expect)
  }

  it.skip("Should call bindings with a period e.g. x.y") // ?

  it("namespace.attr returns an object", function () {
    trial({v: "t"}, "on.p: v", { p: "t" })
  })

  it("mixes x: {} and x.y: v styles", function () {
    trial({v: "t"}, "on.p: v, on: { r: 123 }", { p: "t", r: 123 })
  })

  it("throws an error with { x: identifier, x.y: val }", function () {
    assert.throws(function () {
      trial({}, "on.p: '1', on: '2'", {})
    }, /Expected plain object/)
  })

  describe("Specific handlers", function () {
    var node
    beforeEach(function () {
      options.bindingProviderInstance = new Provider()
      options.bindingProviderInstance.bindingHandlers.set(coreBindings)
      node = document.createElement('div')
    })

    it("Supplies the event to event.click", function () {
      var clickCalled = false
      var model = { onClick: function() { clickCalled = true } }
      node.innerHTML = "<button data-bind='event.click: onClick'>hey</button>"
      applyBindings(model, node)
      triggerEvent(node.childNodes[0], "click")
      assert.ok(clickCalled)
    })

    it("Should set css.classname", function () {
      var observable1 = new observable();
      node.innerHTML = "<div data-bind='css.myRule: someModelProperty'>Hallo</div>";
      applyBindings({ someModelProperty: observable1 }, node);

      assert.equal(node.childNodes[0].className, "");
      observable1(true);
      assert.equal(node.childNodes[0].className, "myRule");
    })

    it("Should set style with style.stylename", function () {
      var myObservable = new observable("red");
      node.innerHTML = "<div data-bind='style.backgroundColor: colorValue'>Hallo</div>";
      applyBindings({ colorValue: myObservable }, node);

      assert.include(["red", "#ff0000"], node.childNodes[0].style.backgroundColor)
      // Opera returns style color values in #rrggbb notation, unlike other browsers
      myObservable("green");
      assert.include(["green", "#008000"], node.childNodes[0].style.backgroundColor)
      myObservable(undefined);
      assert.equal(node.childNodes[0].style.backgroundColor, "");
    })
  })


})
