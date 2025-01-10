/* eslint semi: 0 */

import {
  options, triggerEvent
} from '@tko/utils';

import {
  observable
} from '@tko/observable';

import {
  applyBindings
} from '@tko/bind';

import {
  DataBindProvider
} from '@tko/provider.databind'

import {
  bindings as coreBindings
} from '@tko/binding.core';

import {
  Parser
} from '../dist';

import { assert } from "chai"

function ctxStub (ctx) {
  return { lookup (v) { return ctx ? ctx[v] : null } }
}

function makeBindings (binding, context) {
  return new Parser().parse(binding, ctxStub(context))
}

describe('Parser Namespace', function () {
  function trial (context, binding, expect) {
    var p = makeBindings(binding, context)
    assert.deepEqual(p.on(), expect)
  }

  it('namespace.attr returns an object', function () {
    trial({v: 't'}, 'on.p: v', { p: 't' })
  })

  it('mixes x: {} and x.y: v styles', function () {
    trial({v: 't'}, 'on.p: v, on: { r: 123 }', { p: 't', r: 123 })
  })

  it('dereferences a Node result', function () {
    trial({v: 't'}, 'on.p: `${v}`', { p: 't' })
  })

  it('throws an error with { x: identifier, x.y: val }', function () {
    assert.throws(function () {
      trial({}, "on.p: '1', on: '2'", {})
    }, /Expected plain object/)
  })

  describe('Specific handlers', function () {
    var node
    beforeEach(function () {
      options.bindingProviderInstance = new DataBindProvider()
      options.bindingProviderInstance.bindingHandlers.set(coreBindings)
      node = document.createElement('div')
    })

    it('Supplies the event to event.click', function () {
      var clickCalled = false
      var model = { onClick: function () { clickCalled = true } }
      node.innerHTML = "<button data-bind='event.click: onClick'>hey</button>"
      applyBindings(model, node)
      triggerEvent(node.children[0], 'click')
      assert.ok(clickCalled)
    })

    it('Should set css.classname', function () {
      var observable1 = new observable();
      node.innerHTML = "<div data-bind='css.myRule: someModelProperty'>Hallo</div>";
      applyBindings({ someModelProperty: observable1 }, node);

      assert.equal(node.children[0].className, '');
      observable1(true);
      assert.equal(node.children[0].className, 'myRule');
    })

    it('Should set style with style.stylename', function () {
      var myObservable = new observable('red');
      node.innerHTML = "<div data-bind='style.backgroundColor: colorValue'>Hallo</div>";
      applyBindings({ colorValue: myObservable }, node);

      assert.include(['red', '#ff0000'], node.children[0].style.backgroundColor)
      // Opera returns style color values in #rrggbb notation, unlike other browsers
      myObservable('green');
      assert.include(['green', '#008000'], node.children[0].style.backgroundColor)
      myObservable(undefined);
      assert.equal(node.children[0].style.backgroundColor, '');
    })
  })
})
