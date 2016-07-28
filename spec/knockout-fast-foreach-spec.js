/* eslint semi: 0 */
/*

  Knockout Else --- Tests

 */

//
//   Unit Tests
//

assert = chai.assert;

// Make the frame animation synchronous; simplifies testing.
function setupSynchronousFrameAnimation () {
  var originalAnimateFrame = FastForEach.animateFrame;
  beforeEach(function () {
    originalAnimateFrame = FastForEach.animateFrame;
    FastForEach.animateFrame = function(frame) { frame() };
  })
  afterEach(function () {
    FastForEach.animateFrame = originalAnimateFrame;
  })
  return originalAnimateFrame;
}

describe("applying bindings", function () {
  var originalAnimateFrame = setupSynchronousFrameAnimation()

  it("works with a static list", function () {
    var target = $("<ul data-bind='fastForEach: $data'><li data-bind='text: $data'></li></div>");
    var list = [1, 2, 3];
    ko.applyBindings(list, target[0])
    assert.equal($(target).find("li").length, 3)
  })

  it("works with an observable array", function () {
    var target = $("<ul data-bind='fastForEach: $data'><li data-bind='text: $data'></li></div>");
    var list = [1, 2, 3];
    ko.applyBindings(ko.observableArray(list), target[0])
    assert.equal($(target).find("li").length, 3)
  })

  it("works with a plain observable with an array", function () {
    var target = $("<ul data-bind='fastForEach: $data'><li data-bind='text: $data'></li></div>");
    var list = [1, 2, 3];
    ko.applyBindings(ko.observable(list), target[0])
    assert.equal($(target).find("li").length, 3)
  })

  it("works with a computed observable", function () {
    var target = $("<ul data-bind='fastForEach: $data'><li data-bind='text: $data'></li></div>");
    var list = [1, 2, 3];
    ko.applyBindings(ko.computed({read: function () { return list }}), target[0])
    assert.equal($(target).find("li").length, 3)
  })

  it("processes initial data synchronously", function () {
    // reset to the defailt animateFrame
    var currentAnimateFrame = FastForEach.animateFrame;
    FastForEach.animateFrame = originalAnimateFrame;
    var target = $("<ul data-bind='fastForEach: $data'><li data-bind='text: $data'></li></div>");
    var list = [1, 2, 3];
    ko.applyBindings(ko.computed({ read: function () { return list } }), target[0])
    assert.equal($(target).find("li").length, 3)
    FastForEach.animateFrame = currentAnimateFrame;
  })

  it("processes initial data synchronously but is later asynchronous", function () {
    // reset to the defailt animateFrame
    var currentAnimateFrame = FastForEach.animateFrame;
    FastForEach.animateFrame = originalAnimateFrame;
    var target = $("<ul data-bind='fastForEach: $data'><li data-bind='text: $data'></li></div>");
    var list = ko.observableArray([1, 2, 3]);
    ko.applyBindings(list, target[0])
    assert.equal($(target).find("li").length, 3)

    list.push(4);
    assert.equal($(target).find("li").length, 3)

    // TODO: add logic to test if the update really happened

    FastForEach.animateFrame = currentAnimateFrame;
  })

  it("applies bindings to the immediate child", function () {
    var target = $("<ul data-bind='fastForEach: $data'><li data-bind='text: $data'></li></div>");
    var list = ['a', 'b', 'c'];
    ko.applyBindings(list, target[0])
    assert.equal($(target).find("li").text(), "abc")
  })

  it("applies to inner children", function () {
    var target = $("<ul data-bind='fastForEach: $data'><li><em data-bind='text: $data'></em></li></div>");
    var list = ['a', 'b', 'c'];
    ko.applyBindings(list, target[0])
    assert.equal($(target).html(), '<li><em data-bind="text: $data">a</em></li>' +
                                   '<li><em data-bind="text: $data">b</em></li>' +
                                   '<li><em data-bind="text: $data">c</em></li>')
  })

  it("works with virtual elements", function () {
    var target = $("<div><!-- ko fastForEach: $data --><em data-bind='text: $data'></em><!-- /ko --></div>")
    var list = ['A', 'B'];
    ko.applyBindings(list, target[0])
    assert.equal($(target).html(), '<!-- ko fastForEach: $data -->' +
                                   '<em data-bind="text: $data">A</em>' +
                                   '<em data-bind="text: $data">B</em>' +
                                   '<!-- /ko -->')
  })

  it("bindings only inner (virtual) element", function () {
    var target = $("<ul data-bind='fastForEach: $data'><!-- ko text: $data -->Z<!-- /ko --></ul>");
    var list = ['E', 'V'];
    ko.applyBindings(list, target[0])
    assert.equal(target.html(), '<!-- ko text: $data -->E<!-- /ko -->' +
                                '<!-- ko text: $data -->V<!-- /ko -->')
  })

  it("bindings mixed inner virtual elements", function () {
    var target = $("<ul data-bind='fastForEach: $data'>Q<!-- ko text: $data -->Z2<!-- /ko -->R</ul>");
    var list = ['E2', 'V2'];
    ko.applyBindings(list, target[0])
    assert.equal(target.html(), 'Q<!-- ko text: $data -->E2<!-- /ko -->R' +
                                'Q<!-- ko text: $data -->V2<!-- /ko -->R')
  })

  it("uses the name/id of a <template>", function () {
    var target = $("<ul data-bind='fastForEach: {name: \"tID\", data: $data}'>Zee</ul>");
    var list = ['F1', 'F2'];
    var $template = $("<template id='tID'>X<!-- ko text: $data--><!--/ko--></template>")
      .appendTo(document.body)
    ko.applyBindings(list, target[0])
    assert.equal(target.html(), "X<!-- ko text: $data-->F1<!--/ko-->" +
                                "X<!-- ko text: $data-->F2<!--/ko-->");
    $template.remove();
  })

  it("uses the name/id of a <script>", function () {
    var target = $("<ul data-bind='fastForEach: {name: \"tID\", data: $data}'>Zee</ul>");
    var list = ['G1', 'G2'];
    var $template = $("<script type='text/ko-template' id='tID'></script>")
      .appendTo(document.body)
    $template.text("Y<!-- ko text: $data--><!--/ko-->");
    ko.applyBindings(list, target[0])
    assert.equal(target.html(), "Y<!-- ko text: $data-->G1<!--/ko-->" +
                                "Y<!-- ko text: $data-->G2<!--/ko-->");
    $template.remove();
  })

  it("uses the name/id of a <div>", function () {
    var target = $("<ul data-bind='fastForEach: {name: \"tID2\", data: $data}'>Zee</ul>");
    var list = ['H1', 'H2'];
    var $template = $("<div id='tID2'>Z<!-- ko text: $data--><!--/ko--></div>")
      .appendTo(document.body)
    ko.applyBindings(list, target[0])
    assert.equal(target.html(), "Z<!-- ko text: $data-->H1<!--/ko-->" +
                                "Z<!-- ko text: $data-->H2<!--/ko-->");
    $template.remove();
  })
})

describe("observable array changes", function () {
  setupSynchronousFrameAnimation();
  var div, obs, view;

  beforeEach(function () {
    div = $("<div data-bind='fastForEach: obs'><i data-bind='text: $data'></i></div>");
    obs = ko.observableArray();
    view = {obs: obs};
  })

  it("adds an item to an empty list", function () {
    ko.applyBindings(view, div[0]);
    obs(['a'])
    assert.equal(div.text(), 'a')
  })

  it("adds an item to the end of a pre-existing list", function () {
    obs(['a'])
    ko.applyBindings(view, div[0]);
    obs.push('b')
    assert.equal(div.text(), 'ab')
  })

  it("adds an item to the beginning of a pre-existing list", function () {
    obs(['a'])
    ko.applyBindings(view, div[0]);
    obs.unshift('b')
    assert.equal(div.text(), 'ba')
  })

  it("adds an item to the middle of a pre-existing list", function () {
    obs(['a', 'b'])
    ko.applyBindings(view, div[0]);
    obs.splice(1, 0, 'c')
    assert.equal(div.text(), 'acb')
  })

  it("splices items at the beginning of a pre-existing list", function () {
    obs(['a', 'b', 'c'])
    ko.applyBindings(view, div[0]);
    obs.splice(0, 1, 'd')
    assert.equal(div.text(), 'dbc')
  })

  it("removes items at the middle of a pre-existing list", function () {
    obs(['a', 'b', 'c'])
    ko.applyBindings(view, div[0]);
    obs.splice(0, 1)
    assert.equal(div.text(), 'bc')
  })

  it("splices items at the middle of a pre-existing list", function () {
    obs(['a', 'b', 'c'])
    ko.applyBindings(view, div[0]);
    obs.splice(1, 1, 'D')
    assert.equal(div.text(), 'aDc')
  })

  it("splices items at the end of a pre-existing list", function () {
    obs(['a', 'b', 'c'])
    ko.applyBindings(view, div[0]);
    obs.splice(2, 1, 'D')
    assert.equal(div.text(), 'abD')
  })

  it("deletes the last item", function () {
    obs(['a'])
    ko.applyBindings(view, div[0]);
    obs([])
    assert.equal(div.text(), '')
  })

  it("deletes text nodes", function () {
    div = $("<div data-bind='fastForEach: obs'>x<i data-bind='text: $data'></i>y</div>");
    ko.applyBindings(view, div[0]);
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
    div.append(document.createComment("ko fastForEach: obs"))
    div.append($("<i data-bind='text: $data'></i>")[0])
    div.append(document.createComment("/ko"))
    ko.applyBindings(view, div[0]);
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
    ko.applyBindings(view, div[0]);
    obs.shift()
    assert.equal(div.text(), 'bc')
  })

  it("deletes from the beginning", function () {
    obs(['a', 'b', 'c'])
    ko.applyBindings(view, div[0]);
    obs.pop()
    assert.equal(div.text(), 'ab')
  })

  it("combines multiple adds and deletes", function () {
    obs(['A', 'B', 'C', 'D', 'E', 'F'])
    ko.applyBindings(view, div[0]);
    obs(['x', 'B', 'C', 'D', 'z', 'F'])
    assert.equal(div.text(), 'xBCDzF')
  })

  it("processes multiple deletes", function () {
    // Per issue #6
    ko.applyBindings(view, div[0]);
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
    ko.applyBindings(view, div[0]);
    obs([5, 6, 7, 8, 9])
    assert.equal(div.text(), '56789')
    obs([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    assert.equal(div.text(), '0123456789')
    obs(['a', 'b', 'c'])
    assert.equal(div.text(), 'abc')
  })

  it("processes numerous changes with splice", function () {
    ko.applyBindings(view, div[0]);
    obs([5, 6, 7, 8, 9])
    assert.equal(div.text(), '56789')
    obs.splice(1, 2, 16, 17);
    assert.equal(div.text(), '5161789')
    obs.splice(0, 5, 'a', 'b', 'c');
    assert.equal(div.text(), 'abc')
  })

  it("accepts changes via a computed observable", function() {
    var target = $("<ul data-bind='fastForEach: $data'><li data-bind='text: $data'></li></div>");
    var toggle = ko.observable(true);
    var list1 = [1, 2, 3];
    var list2 = [1, 2, 3, 4, 5, 6];
    ko.applyBindings(ko.computed({
      read: function() { return toggle() ? list1 : list2; }
    }), target[0])
    assert.equal(target.text(), "123")
    toggle(false)
    assert.equal(target.text(), "123456")
  })

  describe("DOM move capabilities", function() {
    it("sorting complex data moves 1 DOM node", function() {
      div = $("<div data-bind='fastForEach: obs'><div data-bind='html: testHtml'></div></div>");
      ko.applyBindings(view, div[0]);
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
      div = $("<div data-bind='fastForEach: obs'><div data-bind='html: testHtml'></div></div>");
      ko.applyBindings(view, div[0]);
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
      var originalShouldDelayDeletion = FastForEach.prototype.shouldDelayDeletion;
      FastForEach.prototype.shouldDelayDeletion = function(data) { return false; }
      div = $("<div data-bind='fastForEach: { data: obs }'><div data-bind='html: testHtml'></div></div>");
      ko.applyBindings(view, div[0]);
      obs([{ id: 7, testHtml: '<span>A</span>' }, { id: 6, testHtml: '<span>B</span>' }, { id: 1, testHtml: '<span>C</span>' }])
      var nodes = div.children().toArray()
      assert.equal(div.text(), 'ABC')
      obs.sort(function(a, b) { return a.id - b.id; })
      var nodes2 = div.children().toArray()
      assert.equal(div.text(), 'CBA')
      assert.notStrictEqual(nodes[1], nodes2[2])
      assert.notStrictEqual(nodes[2], nodes2[0])
      assert.notStrictEqual(nodes[0], nodes2[1])
      FastForEach.prototype.shouldDelayDeletion = originalShouldDelayDeletion;
    })

    it("Sort large complex array makes correct DOM moves", function() {
      var itemNumber = 100;
      div = $("<div data-bind='fastForEach: { data: obs }'><div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div></div></div>");
      ko.applyBindings(view, div[0]);
      var arr = [], i;
      for (i = 0; i != itemNumber; ++i) {
        arr.push({ id: Math.floor(Math.random() * itemNumber), testHtml: '<span>Item ' + i + '</span>' });
      }
      obs(arr)
      assert.equal(div.children().length, itemNumber)
      div.children().prop("testprop", 10)
      console.time("with move");
      obs.sort(function(a, b) { return a.id - b.id; })
      console.timeEnd("with move");
      for (i = 0; i != itemNumber; ++i) {
        arr[i].num = i;
      }
      assert.equal(div.children().length, itemNumber)
      assert.equal(div.children().filter(function() { return this.testprop == 10; }).length, itemNumber)
      div.children().each(function(index) {
        assert.equal(index, ko.dataFor(this).num)
      })
    })

    it("Sort large complex array makes correct DOM order without move", function() {
      var originalShouldDelayDeletion = FastForEach.prototype.shouldDelayDeletion;
      FastForEach.prototype.shouldDelayDeletion = function (data) { return false; }
      var itemNumber = 100;
      div = $("<div data-bind='fastForEach: { data: obs }'><div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div><div data-bind='html: testHtml'></div></div></div>");
      ko.applyBindings(view, div[0]);
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
        assert.equal(index, ko.dataFor(this).num)
      })
      FastForEach.prototype.shouldDelayDeletion = originalShouldDelayDeletion;
    })

    it("processes duplicate data 1", function () {
      div = $("<div data-bind='fastForEach: obs'><div data-bind='html: testHtml'></div></div>");
      ko.applyBindings(view, div[0]);
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
      div = $("<div data-bind='fastForEach: obs'><div data-bind='html: testHtml'></div></div>");
      ko.applyBindings(view, div[0]);
      var itemA = { id: 4, testHtml: '<span>A</span>' };
      var itemB = { id: 6, testHtml: '<span>B</span>' };
      var others = [1, 2, 3, 4].map(function(e) { return { id: e, testHtml: '' } });
      obs([itemB, others[0], others[1], others[2], others[3], itemA, itemA])
      var nodes = div.children().each(function() { this.test = 1; }).toArray()
      assert.equal(div.text(), 'BAA')
      obs([itemB, itemA, itemA, itemA, itemA, others[0], others[1], others[2], others[3]])
      var nodes2 = div.children().toArray()
      // reuses two 'A' node set
      assert.equal(div.children().filter(function () { return this.test == 1; }).length, 7)
      // ... and creates two new
      assert.equal(div.children().filter(function () { return this.test === undefined; }).length, 2)
      assert.equal(div.text(), "BAAAA")
    })

    it("processes changes from more changesets 1", function () {
      var originalAnimateFrame = FastForEach.animateFrame;
      FastForEach.animateFrame = function() { };
      div = $("<div data-bind='visible: true'></div>");
      ko.applyBindings({}, div[0]);

      var itemA = { id: 4, testHtml: '<span>A</span>' };
      var others = [11, 12, 13, 14].map(function (e) { return { id: e, testHtml: 'C'+e } });
      obs([itemA, others[0], others[1], others[2], others[3]])

      // manual initialization to be able to access processQueue method
      var ffe = new FastForEach({
        element: div[0],
        data: obs,
        $context: ko.contextFor(div[0]),
        templateNode: $("<template><div data-bind='html: testHtml'></div></template>")[0]
      });

      ffe.processQueue();
      var nodes = div.children().each(function () { this.test = 1; }).toArray()
      assert.equal(div.text(), "AC11C12C13C14")
      obs([others[0], others[1], others[2], others[3], itemA])
      obs([others[1], itemA, others[2], others[3]])
      obs.sort(function (a, b) { return b.id - a.id; });
      assert.equal(div.text(), "AC11C12C13C14")

      ffe.processQueue();
      assert.equal(div.text(), "C14C13C12A")
      // moved all five nodes around
      assert.equal(div.children().filter(function () { return this.test == 1; }).length, 4)
      FastForEach.animateFrame = originalAnimateFrame;
    })

    it("processes changes from more changesets 2", function () {
      var originalAnimateFrame = FastForEach.animateFrame;
      FastForEach.animateFrame = function () { };
      div = $("<div data-bind='visible: true'></div>");
      ko.applyBindings({}, div[0]);

      var itemA = { id: 4, testHtml: '<span>A</span>' };
      var itemB = { id: 5, testHtml: '<span>B</span>' };
      obs([itemA, itemB])

      // manual initialization to be able to access processQueue method
      var ffe = new FastForEach({
        element: div[0],
        data: obs,
        $context: ko.contextFor(div[0]),
        templateNode: $("<script type='text/html'><div data-bind='html: testHtml'></div></script>")[0]
      });

      ffe.processQueue();
      var nodes = div.children().each(function () { this.test = 1; }).toArray()
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
      FastForEach.animateFrame = originalAnimateFrame;
    })

    it("cleans data objects", function () {
      div = $("<div data-bind='fastForEach: obs'><div data-bind='html: testHtml'></div></div>");
      ko.applyBindings(view, div[0]);
      var itemA = { id: 4, testHtml: '<span>A</span>' };
      var itemB = { id: 6, testHtml: '<span>B</span>' };
      var itemC = { id: 6, testHtml: '<span>C</span>' };
      obs([itemA, itemB, itemC, itemA])
      var nodes = div.children().toArray()
      assert.equal(div.text(), 'ABCA')
      obs([itemC, itemA, itemB])
      var nodes2 = div.children().toArray()
      assert.equal(itemA[FastForEach.PENDING_DELETE_INDEX_KEY], undefined)
      assert.equal(itemB[FastForEach.PENDING_DELETE_INDEX_KEY], undefined)
      assert.equal(itemC[FastForEach.PENDING_DELETE_INDEX_KEY], undefined)
      assert.equal(nodes[0], nodes2[1])
      assert.equal(div.text(), 'CAB')
    })
  })

  describe('afterAdd', function () {
    it("emits on changes to an observable array", function () {
      var calls = 0;
      var nodes = 0
      var arr = ko.observableArray([])
      function cb(v) { calls++; nodes += v.nodeOrArrayInserted.length }
      var target = $("<ul data-bind='fastForEach: { data: arr, afterAdd: cb }'><li data-bind='text: $data'></li></div>");
      ko.applyBindings({arr: arr, cb: cb}, target[0])
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
      var arr = ko.observableArray(['a', 'b', 'c'])
      function cb(v) { calls++; nodes += v.nodeOrArrayInserted.length }
      var target = $("<ul data-bind='fastForEach: { data: arr, afterAdd: cb }'><li data-bind='text: $data'></li></div>");
      ko.applyBindings({arr: arr, cb: cb}, target[0])
      assert.equal(calls, 1)
      assert.equal(nodes, 3)
    })

  })

  describe('beforeRemove', function () {
    it("emits on remove", function () {
      var cbi = 0;
      var arr = ko.observableArray(['a1', 'b1', 'c1'])
      function cb(v) {
        ko.utils.arrayForEach(v.nodesToRemove, function (n) { ko.removeNode(n); });
        cbi++;
      }
      var target = $("<ul data-bind='fastForEach: { data: arr, beforeRemove: cb }'><li data-bind='text: $data'></li></div>");
      ko.applyBindings({arr: arr, cb: cb}, target[0])
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
      var arr = ko.observableArray(['a2', 'b2', 'c2'])
      var p
      function cb(v) { cbi++; return {then: function (cb) { cb() }} }
      var target = $("<ul data-bind='fastForEach: { data: arr, beforeRemove: cb }'><li data-bind='text: $data'></li></div>");
      ko.applyBindings({arr: arr, cb: cb}, target[0])
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
      var target = $("<ul data-bind='fastForEach: $data'><li data-bind='text: $data'></li></div>");
      var list = ['a', 'b', 'c'];
      ko.applyBindings(list, target[0])
      assert.equal(ko.contextFor(target.children()[0]).$index(), 0)
      assert.equal(ko.contextFor(target.children()[1]).$index(), 1)
      assert.equal(ko.contextFor(target.children()[2]).$index(), 2)
    })

    it("is present on children of virtual nodes", function () {
      var target = $("<div><!-- ko fastForEach: $data -->" +
        "<b data-bind='text: $data'></b>" +
        "<!-- /ko --></div>");
      var list = ['a', 'b', 'c'];
      ko.applyBindings(list, target[0])
      assert.equal(ko.contextFor(target.children()[0]).$index(), 0)
      assert.equal(ko.contextFor(target.children()[1]).$index(), 1)
      assert.equal(ko.contextFor(target.children()[2]).$index(), 2)
    })

    it("is present when template starts with a text node", function() {
      var target = document.createElement('ul')
      target.innerHTML = "<ul data-bind='fastForEach: $data'>" +
          " <li data-bind='text: $index()'></li>" +
        "</ul>"
      var list = ['a', 'b', 'c'];
      ko.applyBindings(list, target)
      assert.equal($(target).text(), ' 0 1 2')
    })

    it("updates the first list item", function () {
      var target = $("<ul data-bind='fastForEach: $data'><li data-bind='text: $data'></li></div>");
      var list = ko.observableArray([]);
      ko.applyBindings(list, target[0])
      list.push('a')
      assert.equal(ko.contextFor(target.children()[0]).$index(), 0)
    })

    it("updates on append", function () {
      var target = $("<ul data-bind='fastForEach: $data'><li data-bind='text: $data'></li></div>");
      var list = ko.observableArray(['a', 'b', 'c']);
      ko.applyBindings(list, target[0])
      list.push('d')
      assert.equal(ko.contextFor(target.children()[0]).$index(), 0)
      assert.equal(ko.contextFor(target.children()[1]).$index(), 1)
      assert.equal(ko.contextFor(target.children()[2]).$index(), 2)
      assert.equal(ko.contextFor(target.children()[3]).$index(), 3)
    })

    it("updates on prepend", function () {
      var target = $("<ul data-bind='fastForEach: $data'><li data-bind='text: $data'></li></div>");
      var list = ko.observableArray(['a', 'b', 'c']);
      ko.applyBindings(list, target[0])
      list.unshift('e')
      assert.equal(ko.contextFor(target.children()[0]).$index(), 0)
      assert.equal(ko.contextFor(target.children()[1]).$index(), 1)
      assert.equal(ko.contextFor(target.children()[2]).$index(), 2)
      assert.equal(ko.contextFor(target.children()[3]).$index(), 3)
    })

    it("updates on splice", function () {
      var target = $("<ul data-bind='fastForEach: $data'><li data-bind='text: $data'></li></div>");
      var list = ko.observableArray(['a', 'b', 'c']);
      ko.applyBindings(list, target[0])
      // Delete 2 at 1, insert 2
      list.splice(1, 2, 'r', 'q')
      assert.equal(ko.contextFor(target.children()[0]).$index(), 0)
      assert.equal(ko.contextFor(target.children()[1]).$index(), 1)
      assert.equal(ko.contextFor(target.children()[2]).$index(), 2)
    })

    it("is disabled with noIndex", function () {
      var target = $("<ul data-bind='fastForEach: {data: $data, noIndex: true}'><li data-bind='text: $data'></li></div>");
      var list = ko.observableArray(['a']);
      ko.applyBindings(list, target[0])
      assert.equal(ko.contextFor(target.children()[0]).$index, undefined)
    })

    it("is present with noContext", function () {
      var target = $("<ul data-bind='fastForEach: {data: $data, noContext: true}'><li data-bind='text: $data'></li></div>");
      var list = ko.observableArray(['a', 'b']);
      ko.applyBindings(list, target[0])
      assert.equal(ko.contextFor(target.children()[0]).$index(), 0)
      assert.equal(ko.contextFor(target.children()[1]).$index(), 1)
    })
  })
})
