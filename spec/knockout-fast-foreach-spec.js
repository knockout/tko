
/*

  Knockout Else --- Tests

 */

//
//   Unit Tests
//

mocha.setup('bdd')
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
}

describe("applying bindings", function () {
  setupSynchronousFrameAnimation()

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

})

mocha.run();
