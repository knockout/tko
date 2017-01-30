/* eslint semi: 0 */
/*

  Knockout Else --- Tests

 */
/* globals $ */

import {
  removeNode, arrayForEach, options, domData
} from 'tko.utils';

import {
  observable, observableArray
} from 'tko.observable';

import {
  computed
} from 'tko.computed';

import {
  contextFor, dataFor, applyBindings
} from 'tko.bind';

import {
  Provider
} from 'tko.provider';

import {
  bindings as coreBindings
} from 'tko.binding.core';

import {
  ForEach, foreach
} from '../src/foreach';


beforeEach(function(){
  var provider = new Provider();
  options.bindingProviderInstance = provider;
  provider.bindingHandlers.set(coreBindings);
  provider.bindingHandlers.set({ foreach: foreach });
  // provider.bindingHandlers.set(ifBindings);
});


beforeEach(function () {
  foreach.setSync(true)
})


describe("each binding", function () {

  it("works with a static list", function () {
    var target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>");
    var list = [1, 2, 3];
    applyBindings(list, target[0])
    assert.equal($(target).find("li").length, 3)
  })

  it("works with an observable array", function () {
    var target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>");
    var list = [1, 2, 3];
    applyBindings(observableArray(list), target[0])
    assert.equal($(target).find("li").length, 3)
  })

  it("works with a plain observable with an array", function () {
    var target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>");
    var list = [1, 2, 3];
    applyBindings(observable(list), target[0])
    assert.equal($(target).find("li").length, 3)
  })

  it("works with a computed observable", function () {
    var target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>");
    var list = [1, 2, 3];
    applyBindings(computed({read: function () { return list }}), target[0])
    assert.equal($(target).find("li").length, 3)
  })

  it("processes initial data synchronously", function () {
    foreach.setSync(false)
    var target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>");
    var list = [1, 2, 3];
    applyBindings(computed({ read: function () { return list } }), target[0])
    assert.equal($(target).find("li").length, 3)
  })

  it("processes initial data synchronously but is later asynchronous", function () {
    foreach.setSync(false)
    // reset to the default async animateFrame
    // foreac
    var target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>");
    var list = observableArray([1, 2, 3]);
    applyBindings(list, target[0])
    assert.equal($(target).find("li").length, 3)

    list.push(4);
    assert.equal($(target).find("li").length, 3)

    // TODO: add logic to test if the update really happened
  })

  it("applies bindings to the immediate child", function () {
    var target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>");
    var list = ['a', 'b', 'c'];
    applyBindings(list, target[0])
    assert.equal($(target).find("li").text(), "abc")
  })

  it("applies to inner children", function () {
    var target = $("<ul data-bind='foreach: $data'><li><em data-bind='text: $data'></em></li></div>");
    var list = ['a', 'b', 'c'];
    applyBindings(list, target[0])
    assert.equal($(target).html(), '<li><em data-bind="text: $data">a</em></li>' +
                                   '<li><em data-bind="text: $data">b</em></li>' +
                                   '<li><em data-bind="text: $data">c</em></li>')
  })

  it("works with virtual elements", function () {
    var target = $("<div><!-- ko foreach: $data --><em data-bind='text: $data'></em><!-- /ko --></div>")
    var list = ['A', 'B'];
    applyBindings(list, target[0])
    assert.equal($(target).html(), '<!-- ko foreach: $data -->' +
                                   '<em data-bind="text: $data">A</em>' +
                                   '<em data-bind="text: $data">B</em>' +
                                   '<!-- /ko -->')
  })

  it("bindings only inner (virtual) element", function () {
    var target = $("<ul data-bind='foreach: $data'><!-- ko text: $data -->Z<!-- /ko --></ul>");
    var list = ['E', 'V'];
    applyBindings(list, target[0])
    assert.equal(target.html(), '<!-- ko text: $data -->E<!-- /ko -->' +
                                '<!-- ko text: $data -->V<!-- /ko -->')
  })

  it("bindings mixed inner virtual elements", function () {
    var target = $("<ul data-bind='foreach: $data'>Q<!-- ko text: $data -->Z2<!-- /ko -->R</ul>");
    var list = ['E2', 'V2'];
    applyBindings(list, target[0])
    assert.equal(target.html(), 'Q<!-- ko text: $data -->E2<!-- /ko -->R' +
                                'Q<!-- ko text: $data -->V2<!-- /ko -->R')
  })

  it("uses the name/id of a <template>", function () {
    var target = $("<ul data-bind='foreach: {name: \"tID\", data: $data}'>Zee</ul>");
    var list = ['F1', 'F2'];
    var $template = $("<template id='tID'>X<!-- ko text: $data--><!--/ko--></template>")
      .appendTo(document.body)
    applyBindings(list, target[0])
    assert.equal(target.html(), "X<!-- ko text: $data-->F1<!--/ko-->" +
                                "X<!-- ko text: $data-->F2<!--/ko-->");
    $template.remove();
  })

  it("uses the name/id of a <script>", function () {
    var target = $("<ul data-bind='foreach: {name: \"tID\", data: $data}'>Zee</ul>");
    var list = ['G1', 'G2'];
    var $template = $("<script type='text/ko-template' id='tID'></script>")
      .appendTo(document.body)
    $template.text("Y<!-- ko text: $data--><!--/ko-->");
    applyBindings(list, target[0])
    assert.equal(target.html(), "Y<!-- ko text: $data-->G1<!--/ko-->" +
                                "Y<!-- ko text: $data-->G2<!--/ko-->");
    $template.remove();
  })

  it("uses the name/id of a <div>", function () {
    var target = $("<ul data-bind='foreach: {name: \"tID2\", data: $data}'>Zee</ul>");
    var list = ['H1', 'H2'];
    var $template = $("<div id='tID2'>Z<!-- ko text: $data--><!--/ko--></div>")
      .appendTo(document.body)
    applyBindings(list, target[0])
    assert.equal(target.html(), "Z<!-- ko text: $data-->H1<!--/ko-->" +
                                "Z<!-- ko text: $data-->H2<!--/ko-->");
    $template.remove();
  })

})


describe("is empty/conditional", function () {
  it("sets `elseChainSatisfied` to false for an empty array", function () {
    var div = $("<div data-bind='foreach: obs'><i data-bind='text: $data'></i></div>");
    var obs = [];
    var view = {obs: obs};
    applyBindings(view, div[0]);
    assert.equal(domData.get(div[0], 'conditional').elseChainSatisfied(), false)
  })

  it("sets `elseChainSatisfied` to false for an undefined obs array", function () {
    var div = $("<div data-bind='foreach: obs'><i data-bind='text: $data'></i></div>");
    var obs = observableArray();
    var view = {obs: obs};
    applyBindings(view, div[0]);
    assert.equal(domData.get(div[0], 'conditional').elseChainSatisfied(), false)
  })

  it("sets `elseChainSatisfied` to false for an empty obs array", function () {
    var div = $("<div data-bind='foreach: obs'><i data-bind='text: $data'></i></div>");
    var obs = observableArray([]);
    var view = {obs: obs};
    applyBindings(view, div[0]);
    assert.equal(domData.get(div[0], 'conditional').elseChainSatisfied(), false)
  })

  it("sets `elseChainSatisfied` to true for a non-empty array", function () {
    var div = $("<div data-bind='foreach: obs'><i data-bind='text: $data'></i></div>");
    var obs = [1,2,3];
    var view = {obs: obs};
    applyBindings(view, div[0]);
    assert.equal(domData.get(div[0], 'conditional').elseChainSatisfied(), true)
  })

  it("sets `elseChainSatisfied` to true for a non-empty obs array", function () {
    var div = $("<div data-bind='foreach: obs'><i data-bind='text: $data'></i></div>");
    var obs = observableArray([1,2,3]);
    var view = {obs: obs};
    applyBindings(view, div[0]);
    assert.equal(domData.get(div[0], 'conditional').elseChainSatisfied(), true)
  })

  it("sets `elseChainSatisfied` to true after array is filled", function () {
    var div = $("<div data-bind='foreach: obs'><i data-bind='text: $data'></i></div>");
    var obs = observableArray([]);
    var view = {obs: obs};
    applyBindings(view, div[0]);
    obs([1, 2, 3])
    assert.equal(domData.get(div[0], 'conditional').elseChainSatisfied(), true)
  })

  it("sets `elseChainSatisfied` to false after array is emptied", function () {
    var div = $("<div data-bind='foreach: obs'><i data-bind='text: $data'></i></div>");
    var obs = observableArray([1, 2, 3]);
    var view = {obs: obs};
    applyBindings(view, div[0]);
    obs([])
    assert.equal(domData.get(div[0], 'conditional').elseChainSatisfied(), false)
  })
})


describe("observable array changes", function () {
  var div, obs, view;

  beforeEach(function () {
    div = $("<div data-bind='foreach: obs'><i data-bind='text: $data'></i></div>");
    obs = observableArray();
    view = {obs: obs};
  })

  it("adds an item to an empty list", function () {
    applyBindings(view, div[0]);
    obs(['a'])
    assert.equal(div.text(), 'a')
  })

  it("adds an item to the end of a pre-existing list", function () {
    obs(['a'])
    applyBindings(view, div[0]);
    obs.push('b')
    assert.equal(div.text(), 'ab')
  })

  it("adds an item to the beginning of a pre-existing list", function () {
    obs(['a'])
    applyBindings(view, div[0]);
    obs.unshift('b')
    assert.equal(div.text(), 'ba')
  })

  it("adds an item to the middle of a pre-existing list", function () {
    obs(['a', 'b'])
    applyBindings(view, div[0]);
    obs.splice(1, 0, 'c')
    assert.equal(div.text(), 'acb')
  })

  it("splices items at the beginning of a pre-existing list", function () {
    obs(['a', 'b', 'c'])
    applyBindings(view, div[0]);
    obs.splice(0, 1, 'd')
    assert.equal(div.text(), 'dbc')
  })

  it("removes items at the middle of a pre-existing list", function () {
    obs(['a', 'b', 'c'])
    applyBindings(view, div[0]);
    obs.splice(0, 1)
    assert.equal(div.text(), 'bc')
  })

  it("splices items at the middle of a pre-existing list", function () {
    obs(['a', 'b', 'c'])
    applyBindings(view, div[0]);
    obs.splice(1, 1, 'D')
    assert.equal(div.text(), 'aDc')
  })

  it("splices items at the end of a pre-existing list", function () {
    obs(['a', 'b', 'c'])
    applyBindings(view, div[0]);
    obs.splice(2, 1, 'D')
    assert.equal(div.text(), 'abD')
  })

  it("deletes the last item", function () {
    obs(['a'])
    applyBindings(view, div[0]);
    obs([])
    assert.equal(div.text(), '')
  })

  it("deletes text nodes", function () {
    div = $("<div data-bind='foreach: obs'>x<i data-bind='text: $data'></i>y</div>");
    applyBindings(view, div[0]);
    obs(['a', 'b', 'c'])
    assert.equal(div.text(), 'xayxbyxcy')
    obs(['a', 'c'])
    assert.equal(div.text(), 'xayxcy')
    obs(['a'])
    assert.equal(div.text(), 'xay')
    obs([])
    assert.equal(div.text(), '')
  })

  it("deletes from virtual elements", function () {
    div = $("<div>")
    div.append(document.createComment("ko foreach: obs"))
    div.append($("<i data-bind='text: $data'></i>")[0])
    div.append(document.createComment("/ko"))
    applyBindings(view, div[0]);
    obs(['a', 'b', 'c'])
    assert.equal(div.text(), 'abc')
    obs(['a', 'c'])
    assert.equal(div.text(), 'ac')
    obs(['a'])
    assert.equal(div.text(), 'a')
    obs([])
    assert.equal(div.text(), '')
    obs(['a', 'b'])
    assert.equal(div.text(), 'ab')
    obs([])
    assert.equal(div.text(), '')
    obs(['a', 'b', 'c'])
    assert.equal(div.text(), 'abc')
    obs(['a'])
    assert.equal(div.text(), 'a')
    obs(['a', 'b', 'c'])
    assert.equal(div.text(), 'abc')
    obs(['c'])
    assert.equal(div.text(), 'c')
  })

  it("deletes from the beginning", function () {
    obs(['a', 'b', 'c'])
    applyBindings(view, div[0]);
    obs.shift()
    assert.equal(div.text(), 'bc')
  })

  it("deletes from the beginning", function () {
    obs(['a', 'b', 'c'])
    applyBindings(view, div[0]);
    obs.pop()
    assert.equal(div.text(), 'ab')
  })

  it("combines multiple adds and deletes", function () {
    obs(['A', 'B', 'C', 'D', 'E', 'F'])
    applyBindings(view, div[0]);
    obs(['x', 'B', 'C', 'D', 'z', 'F'])
    assert.equal(div.text(), 'xBCDzF')
  })

  it("processes multiple deletes", function () {
    // Per issue #6
    applyBindings(view, div[0]);
    obs([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    assert.equal(div.text(), '0123456789')
    obs([1, 2, 3, 4, 5, 6, 7, 8])
    assert.equal(div.text(), '12345678')
    obs([2, 3, 4, 5, 6, 7, 8, 9])
    assert.equal(div.text(), '23456789')
    obs([3, 4, 5, 6, 7, 8, 9])
    assert.equal(div.text(), '3456789')
    obs([2, 3, 4, 5, 6, 7, 8, 9])
    assert.equal(div.text(), '23456789')
    obs([6, 7, 8, 9])
    assert.equal(div.text(), '6789')
    obs([1, 2, 3, 6, 7, 8])
    assert.equal(div.text(), '123678')
    obs([0, 1, 2, 3, 4])
    assert.equal(div.text(), '01234')
    obs([1, 2, 3, 4])
    assert.equal(div.text(), '1234')
    obs([3, 4])
    assert.equal(div.text(), '34')
    obs([3])
    assert.equal(div.text(), '3')
    obs([])
    assert.equal(div.text(), '')
  })

  it("processes numerous changes", function () {
    applyBindings(view, div[0]);
    obs([5, 6, 7, 8, 9])
    assert.equal(div.text(), '56789')
    obs([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    assert.equal(div.text(), '0123456789')
    obs(['a', 'b', 'c'])
    assert.equal(div.text(), 'abc')
  })

  it("processes numerous changes with splice", function () {
    applyBindings(view, div[0]);
    obs([5, 6, 7, 8, 9])
    assert.equal(div.text(), '56789')
    obs.splice(1, 2, 16, 17);
    assert.equal(div.text(), '5161789')
    obs.splice(0, 5, 'a', 'b', 'c');
    assert.equal(div.text(), 'abc')
  })

  it("accepts changes via a computed observable", function() {
    var target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>");
    var toggle = observable(true);
    var list1 = [1, 2, 3];
    var list2 = [1, 2, 3, 4, 5, 6];
    applyBindings(computed({
      read: function() { return toggle() ? list1 : list2; }
    }), target[0])
    assert.equal(target.text(), "123")
    toggle(false)
    assert.equal(target.text(), "123456")
  })

  describe("DOM move capabilities", function() {
    it("sorting complex data moves 1 DOM node", function() {
      div = $("<div data-bind='foreach: obs'><div data-bind='html: testHtml'></div></div>");
      applyBindings(view, div[0]);
      obs([{ id: 4, testHtml: '<span>A</span>' }, { id: 6, testHtml: '<span>B</span>' }, { id: 1, testHtml: '<span>C</span>' }])
      var nodes = div.children().toArray()
      assert.equal(div.text(), 'ABC')
      obs.sort(function(a, b) { return a.id - b.id; })
      var nodes2 = div.children().toArray()
      assert.strictEqual(nodes[1], nodes2[2])
      assert.strictEqual(nodes[2], nodes2[0])
      assert.strictEqual(nodes[0], nodes2[1])
      assert.equal(div.text(), 'CAB')
    })

    it("sorting complex data moves all DOM nodes", function() {
      div = $("<div data-bind='foreach: obs'><div data-bind='html: testHtml'></div></div>");
      applyBindings(view, div[0]);
      obs([{ id: 7, testHtml: '<span>A</span>' }, { id: 6, testHtml: '<span>B</span>' }, { id: 1, testHtml: '<span>C</span>' }, { id: 9, testHtml: '<span>D</span>' }])
      var nodes = div.children().toArray()
      assert.equal(div.text(), 'ABCD')
      obs.reverse();
      var nodes2 = div.children().toArray()
      assert.strictEqual(nodes[0], nodes2[3])
      assert.strictEqual(nodes[1], nodes2[2])
      assert.strictEqual(nodes[2], nodes2[1])
      assert.strictEqual(nodes[3], nodes2[0])
      assert.equal(div.text(), 'DCBA')
    })

    it("sorting complex data recreates DOM nodes if move disabled", function () {
      var originalShouldDelayDeletion = ForEach.prototype.shouldDelayDeletion;
      ForEach.prototype.shouldDelayDeletion = function(/*data*/) { return false; }
      div = $("<div data-bind='foreach: { data: obs }'><div data-bind='html: testHtml'></div></div>");
      applyBindings(view, div[0]);
      obs([{ id: 7, testHtml: '<span>A</span>' }, { id: 6, testHtml: '<span>B</span>' }, { id: 1, testHtml: '<span>C</span>' }])
      var nodes = div.children().toArray()
      assert.equal(div.text(), 'ABC')
      obs.sort(function(a, b) { return a.id - b.id; })
      var nodes2 = div.children().toArray()
      assert.equal(div.text(), 'CBA')
      assert.notStrictEqual(nodes[1], nodes2[2])
      assert.notStrictEqual(nodes[2], nodes2[0])
      assert.notStrictEqual(nodes[0], nodes2[1])
      ForEach.prototype.shouldDelayDeletion = originalShouldDelayDeletion;
    })

    it("Sort large complex array makes correct DOM moves", function() {
      var itemNumber = 100;
      div = $("<div data-bind='foreach: { data: obs }'><div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div></div></div>");
      applyBindings(view, div[0]);
      var arr = [], i;
      for (i = 0; i != itemNumber; ++i) {
        arr.push({ id: Math.floor(Math.random() * itemNumber), testHtml: '<span>Item ' + i + '</span>' });
      }
      obs(arr)
      assert.equal(div.children().length, itemNumber)
      div.children().prop("testprop", 10)
      // console.time("with move");
      obs.sort(function(a, b) { return a.id - b.id; })
      // console.timeEnd("with move");
      for (i = 0; i != itemNumber; ++i) {
        arr[i].num = i;
      }
      assert.equal(div.children().length, itemNumber)
      assert.equal(div.children().filter(function() { return this.testprop == 10; }).length, itemNumber)
      div.children().each(function(index) {
        assert.equal(index, dataFor(this).num)
      })
    })

    it("Sort large complex array makes correct DOM order without move", function() {
      var originalShouldDelayDeletion = ForEach.prototype.shouldDelayDeletion;
      ForEach.prototype.shouldDelayDeletion = function (/*data*/) { return false; }
      var itemNumber = 100;
      div = $("<div data-bind='foreach: { data: obs }'><div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div></div></div>");
      applyBindings(view, div[0]);
      var arr = [], i;
      for (i = 0; i != itemNumber; ++i) {
        arr.push({ id: Math.floor(Math.random() * itemNumber), testHtml: '<span>Item ' + i + '</span>' });
      }
      obs(arr)
      assert.equal(div.children().length, itemNumber)
      obs.sort(function(a, b) { return a.id - b.id; })
      for (i = 0; i != itemNumber; ++i) {
        arr[i].num = i;
      }
      assert.equal(div.children().length, itemNumber)
      div.children().each(function(index) {
        assert.equal(index, dataFor(this).num)
      })
      ForEach.prototype.shouldDelayDeletion = originalShouldDelayDeletion;
    })

    it("processes duplicate data 1", function () {
      div = $("<div data-bind='foreach: obs'><div data-bind='html: testHtml'></div></div>");
      applyBindings(view, div[0]);
      var itemA = { id: 4, testHtml: '<span>A</span>' };
      var itemB = { id: 6, testHtml: '<span>B</span>' };
      obs([itemB, itemA, itemA, itemA])
      var nodes = div.children().toArray()
      assert.equal(div.text(), 'BAAA')
      obs([itemA, itemB])
      var nodes2 = div.children().toArray()
      assert.strictEqual(nodes[3], nodes2[0])
      assert.strictEqual(nodes[0], nodes2[1])
      assert.equal(div.text(), 'AB')
    })

    it("processes duplicate data 2", function () {
      div = $("<div data-bind='foreach: obs'><div data-bind='html: testHtml'></div></div>");
      applyBindings(view, div[0]);
      var itemA = { id: 4, testHtml: '<span>A</span>' };
      var itemB = { id: 6, testHtml: '<span>B</span>' };
      var others = [1, 2, 3, 4].map(function(e) { return { id: e, testHtml: '' } });
      obs([itemB, others[0], others[1], others[2], others[3], itemA, itemA])
      // var nodes =
      div.children().each(function() { this.test = 1; }).toArray()
      assert.equal(div.text(), 'BAA')
      obs([itemB, itemA, itemA, itemA, itemA, others[0], others[1], others[2], others[3]])
      // var nodes2 =
      div.children().toArray()
      // reuses two 'A' node set
      assert.equal(div.children().filter(function () { return this.test == 1; }).length, 7)
      // ... and creates two new
      assert.equal(div.children().filter(function () { return this.test === undefined; }).length, 2)
      assert.equal(div.text(), "BAAAA")
    })

    it("processes changes from more changesets 1", function () {
      var originalAnimateFrame = ForEach.animateFrame;
      ForEach.animateFrame = function() { };
      div = $("<div data-bind='visible: true'></div>");
      applyBindings({}, div[0]);

      var itemA = { id: 4, testHtml: '<span>A</span>' };
      var others = [11, 12, 13, 14].map(function (e) { return { id: e, testHtml: 'C'+e } });
      obs([itemA, others[0], others[1], others[2], others[3]])

      // manual initialization to be able to access processQueue method
      var ffe = new ForEach({
        element: div[0],
        data: obs,
        $context: contextFor(div[0]),
        templateNode: $("<template><div data-bind='html: testHtml'></div></template>")[0]
      });

      ffe.processQueue();
      // var nodes =
      div.children().each(function () { this.test = 1; }).toArray()
      assert.equal(div.text(), "AC11C12C13C14")
      obs([others[0], others[1], others[2], others[3], itemA])
      obs([others[1], itemA, others[2], others[3]])
      obs.sort(function (a, b) { return b.id - a.id; });
      assert.equal(div.text(), "AC11C12C13C14")

      ffe.processQueue();
      assert.equal(div.text(), "C14C13C12A")
      // moved all five nodes around
      assert.equal(div.children().filter(function () { return this.test == 1; }).length, 4)
      ForEach.animateFrame = originalAnimateFrame;
    })

    it("processes changes from more changesets 2", function () {
      var originalAnimateFrame = ForEach.animateFrame;
      ForEach.animateFrame = function () { };
      div = $("<div data-bind='visible: true'></div>");
      applyBindings({}, div[0]);

      var itemA = { id: 4, testHtml: '<span>A</span>' };
      var itemB = { id: 5, testHtml: '<span>B</span>' };
      obs([itemA, itemB])

      // manual initialization to be able to access processQueue method
      var ffe = new ForEach({
        element: div[0],
        data: obs,
        $context: contextFor(div[0]),
        templateNode: $("<script type='text/html'><div data-bind='html: testHtml'></div></script>")[0]
      });

      ffe.processQueue();
      // var nodes =
      div.children().each(function () { this.test = 1; }).toArray()
      assert.equal(div.text(), "AB")
      obs.remove(itemB)
      obs.push(itemB)
      obs.remove(itemB)
      obs.push(itemB)
      obs.remove(itemB)
      obs.push(itemB)
      assert.equal(div.text(), "AB")

      ffe.processQueue();
      assert.equal(div.text(), "AB")
      assert.equal(div.children().filter(function () { return this.test == 1; }).length, 2)
      ForEach.animateFrame = originalAnimateFrame;
    })

    it("cleans data objects", function () {
      div = $("<div data-bind='foreach: obs'><div data-bind='html: testHtml'></div></div>");
      applyBindings(view, div[0]);
      var itemA = { id: 4, testHtml: '<span>A</span>' };
      var itemB = { id: 6, testHtml: '<span>B</span>' };
      var itemC = { id: 6, testHtml: '<span>C</span>' };
      obs([itemA, itemB, itemC, itemA])
      var nodes = div.children().toArray()
      assert.equal(div.text(), 'ABCA')
      obs([itemC, itemA, itemB])
      var nodes2 = div.children().toArray()
      assert.equal(itemA[ForEach.PENDING_DELETE_INDEX_KEY], undefined)
      assert.equal(itemB[ForEach.PENDING_DELETE_INDEX_KEY], undefined)
      assert.equal(itemC[ForEach.PENDING_DELETE_INDEX_KEY], undefined)
      assert.equal(nodes[0], nodes2[1])
      assert.equal(div.text(), 'CAB')
    })
  })

  describe('afterAdd', function () {
    it("emits on changes to an observable array", function () {
      var calls = 0;
      var nodes = 0
      var arr = observableArray([])
      function cb(v) { calls++; nodes += v.nodeOrArrayInserted.length }
      var target = $("<ul data-bind='foreach: { data: arr, afterAdd: cb }'><li data-bind='text: $data'></li></div>");
      applyBindings({arr: arr, cb: cb}, target[0])
      assert.equal(calls, 0)
      assert.equal(nodes, 0)
      arr.push('x')
      assert.equal(calls, 1)
      assert.equal(nodes, 1)
      arr([2,3,4])
      assert.equal(calls, 2)
      assert.equal(nodes, 4, 'n4')
    })

    it("is called with initial data", function () {
      var calls = 0;
      var nodes = 0
      var arr = observableArray(['a', 'b', 'c'])
      function cb(v) { calls++; nodes += v.nodeOrArrayInserted.length }
      var target = $("<ul data-bind='foreach: { data: arr, afterAdd: cb }'><li data-bind='text: $data'></li></div>");
      applyBindings({arr: arr, cb: cb}, target[0])
      assert.equal(calls, 1)
      assert.equal(nodes, 3)
    })

  })

  describe('beforeRemove', function () {
    it("emits on remove", function () {
      var cbi = 0;
      var arr = observableArray(['a1', 'b1', 'c1'])
      function cb(v) {
        arrayForEach(v.nodesToRemove, function (n) { removeNode(n); });
        cbi++;
      }
      var target = $("<ul data-bind='foreach: { data: arr, beforeRemove: cb }'><li data-bind='text: $data'></li></div>");
      applyBindings({arr: arr, cb: cb}, target[0])
      assert.equal(cbi, 0)
      assert.equal(target.text(), 'a1b1c1')
      arr.pop()
      assert.equal(target.text(), 'a1b1')
      assert.equal(cbi, 1)
      arr([])
      assert.equal(cbi, 3)
      assert.equal(target.text(), '')
    })

    it("removes an element if a `then`-able is passed", function () {
      var cbi = 0;
      var arr = observableArray(['a2', 'b2', 'c2'])
      function cb(/*v*/) { cbi++; return {then: function (cb) { cb() }} }
      var target = $("<ul data-bind='foreach: { data: arr, beforeRemove: cb }'><li data-bind='text: $data'></li></div>");
      applyBindings({arr: arr, cb: cb}, target[0])
      assert.equal(cbi, 0)
      assert.equal(target.text(), 'a2b2c2')
      arr.pop()
      assert.equal(target.text(), 'a2b2')
      assert.equal(cbi, 1)
      arr([])
      assert.equal(cbi, 3)
      assert.equal(target.text(), '')
    })
  })


  describe("$index", function () {
    it("is present on the children", function () {
      var target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>");
      var list = ['a', 'b', 'c'];
      applyBindings(list, target[0])
      assert.equal(contextFor(target.children()[0]).$index(), 0)
      assert.equal(contextFor(target.children()[1]).$index(), 1)
      assert.equal(contextFor(target.children()[2]).$index(), 2)
    })

    it("is present on children of virtual nodes", function () {
      var target = $("<div><!-- ko foreach: $data -->" +
        "<b data-bind='text: $data'></b>" +
        "<!-- /ko --></div>");
      var list = ['a', 'b', 'c'];
      applyBindings(list, target[0])
      assert.equal(contextFor(target.children()[0]).$index(), 0)
      assert.equal(contextFor(target.children()[1]).$index(), 1)
      assert.equal(contextFor(target.children()[2]).$index(), 2)
    })

    it("is present when template starts with a text node", function() {
      var target = document.createElement('ul')
      target.innerHTML = "<ul data-bind='foreach: $data'>" +
          " <li data-bind='text: $index()'></li>" +
        "</ul>"
      var list = ['a', 'b', 'c'];
      applyBindings(list, target)
      assert.equal($(target).text(), ' 0 1 2')
    })

    it("updates the first list item", function () {
      var target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>");
      var list = observableArray([]);
      applyBindings(list, target[0])
      list.push('a')
      assert.equal(contextFor(target.children()[0]).$index(), 0)
    })

    it("updates on append", function () {
      var target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>");
      var list = observableArray(['a', 'b', 'c']);
      applyBindings(list, target[0])
      list.push('d')
      assert.equal(contextFor(target.children()[0]).$index(), 0)
      assert.equal(contextFor(target.children()[1]).$index(), 1)
      assert.equal(contextFor(target.children()[2]).$index(), 2)
      assert.equal(contextFor(target.children()[3]).$index(), 3)
    })

    it("updates on prepend", function () {
      var target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>");
      var list = observableArray(['a', 'b', 'c']);
      applyBindings(list, target[0])
      list.unshift('e')
      assert.equal(contextFor(target.children()[0]).$index(), 0)
      assert.equal(contextFor(target.children()[1]).$index(), 1)
      assert.equal(contextFor(target.children()[2]).$index(), 2)
      assert.equal(contextFor(target.children()[3]).$index(), 3)
    })

    it("updates on splice", function () {
      var target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>");
      var list = observableArray(['a', 'b', 'c']);
      applyBindings(list, target[0])
      // Delete 2 at 1, insert 2
      list.splice(1, 2, 'r', 'q')
      assert.equal(contextFor(target.children()[0]).$index(), 0)
      assert.equal(contextFor(target.children()[1]).$index(), 1)
      assert.equal(contextFor(target.children()[2]).$index(), 2)
    })

    it("is disabled with noIndex", function () {
      var target = $("<ul data-bind='foreach: {data: $data, noIndex: true}'><li data-bind='text: $data'></li></div>");
      var list = observableArray(['a']);
      applyBindings(list, target[0])
      assert.equal(contextFor(target.children()[0]).$index, undefined)
    })

    it("is present with `as`", function () {
      var target = $("<ul data-bind='foreach: {data: $data, as: \"$item\"}'><li data-bind='text: $item'></li></div>");
      var list = observableArray(['a', 'b']);
      applyBindings(list, target[0])
      assert.equal(contextFor(target.children()[0]).$index(), 0)
      assert.equal(contextFor(target.children()[1]).$index(), 1)
    })
  })

  describe('`as` parameter', function () {
    it("is used when present", function () {
      var target = $("<ul data-bind='foreach: { data: $data, as: \"xyz\" }'><li data-bind='text: xyz'></li></div>");
      var list = ['a', 'b', 'c'];
      applyBindings(list, target[0])
      assert.equal(target.text(), 'abc')
    })

    it("each item has the same $data as its parent", function () {
      var target = $("<ul data-bind='foreach: { data: $data, as: \"xyz\" }'><li data-bind='text: xyz'></li></div>");
      var list = ['a', 'b', 'c'];
      applyBindings(list, target[0])
      assert.strictEqual(dataFor(target.children()[0]).$data, dataFor(target))
      assert.strictEqual(dataFor(target.children()[1]).$data, dataFor(target))
      assert.strictEqual(dataFor(target.children()[2]).$data, dataFor(target))
    })

    it("has an $index", function () {
      var target = $("<ul data-bind='foreach: { data: $data, as: \"xyz\" }'><li data-bind='text: xyz'></li></div>");
      var list = ['a', 'b', 'c'];
      applyBindings(list, target[0])
      assert.equal(contextFor(target.children()[0]).$index(), 0)
      assert.equal(contextFor(target.children()[1]).$index(), 1)
      assert.equal(contextFor(target.children()[2]).$index(), 2)
    })

    it("respects `noIndex`", function () {
      var target = $("<ul data-bind='foreach: { data: $data, as: \"xyz\", noIndex: true }'><li data-bind='text: xyz'></li></div>");
      var list = ['a', 'b', 'c'];
      applyBindings(list, target[0])
      assert.equal(contextFor(target.children()[0]).$index, undefined)
      assert.equal(contextFor(target.children()[1]).$index, undefined)
      assert.equal(contextFor(target.children()[2]).$index, undefined)
    })

    it("respects `noIndex` on allBindings", function () {
      var target = $("<ul data-bind='foreach: $data, as: \"xyz\", noIndex: true'><li data-bind='text: xyz'></li></div>");
      var list = ['a', 'b', 'c'];
      applyBindings(list, target[0])
      assert.equal(contextFor(target.children()[0]).$index, undefined)
      assert.equal(contextFor(target.children()[1]).$index, undefined)
      assert.equal(contextFor(target.children()[2]).$index, undefined)
    })

    it("reads `as` from peer binding parameters", function () {
      var target = $("<ul data-bind='foreach: $data, as: \"xyz\"'><li data-bind='text: xyz'></li></div>");
      var list = ['a', 'b', 'c'];
      applyBindings(list, target[0])
      assert.equal(target.text(), 'abc')
    })
  })
})


describe("$list", function () {
  it("exposes a list", function () {
    var target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>");
    var list = ['a', 'b', 'c'];
    applyBindings(list, target[0])
    assert.strictEqual(
      contextFor(target.children()[1]).$list, list
    )
  })

  it("exposes an observable array", function () {
    var target = $("<ul data-bind='foreach: $data'><li data-bind='text: $data'></li></div>");
    var list = observableArray(['a', 'b', 'c']);
    applyBindings(list, target[0])
    assert.strictEqual(
      contextFor(target.children()[1]).$list, list
    )
  })

  it("exposes an observable array with `as`", function () {
    var target = $("<ul data-bind='foreach: $data, as: \"x\"'><li data-bind='text: x'></li></div>");
    var list = observableArray(['a', 'b', 'c']);
    applyBindings(list, target[0])
    assert.strictEqual(
      contextFor(target.children()[1]).$list, list
    )
  })

  it("exposes an observable array with `as` + noIndex", function () {
    var target = $("<ul data-bind='foreach: $data, as: \"x\", noIndex: true'><li data-bind='text: x'></li></div>");
    var list = observableArray(['a', 'b', 'c']);
    applyBindings(list, target[0])
    assert.strictEqual(
      contextFor(target.children()[1]).$list, list
    )
  })

  it("exposes an observable array with noIndex", function () {
    var target = $("<ul data-bind='foreach: $data, noIndex: true'><li data-bind='text: $data'></li></div>");
    var list = observableArray(['a', 'b', 'c']);
    applyBindings(list, target[0])
    assert.strictEqual(
      contextFor(target.children()[1]).$list, list
    )
  })
})