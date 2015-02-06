
/*

  Knockout Else --- Tests

 */

//
//   Unit Tests
//

mocha.setup('bdd')
assert = chai.assert;

describe("applying bindings", function () {
  var originalAnimateFrame = 
  beforeEach(function () {
    originalAnimateFrame = FastForEach.animateFrame;
    FastForEach.animateFrame = function(frame) { frame() };
  })
  afterEach(function () {
    FastForEach.animateFrame = originalAnimateFrame;
  })

  it("works with a static list", function () {
    var target = $("<ul data-bind='fastForEach: $data'><li data-bind='text: $data'></li></div>");
    var list = [1, 2, 3];
    ko.applyBindings(list, target[0])
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
})

mocha.run();


//
//    Some performance tests
//

var xarrSize = 200;


function createView() {
  var i = xarrSize;
  var view = { xarr: ko.observableArray() };
  while(i--) { view.xarr.push(i); }
  return view;
}


function report(reportingNode, text, time) {
  var p = document.createElement("p");
  p.innerText = text + " — " + time.toFixed(1) + "ms";
  reportingNode.appendChild(p);
}

// Making the changes synchronous so the time comparison works better.
// The requestAnimationFrame should only speed things up by eliminating
// reflows.
FastForEach.animateFrame = function(frame) { frame() };

function render_test(target, resultNode) {
  var startTime = performance.now();
  var view = createView();
  // Bind
  ko.applyBindings(view, target);
  
  report(resultNode, "Bind ", (performance.now() - startTime))

  // Deletes
  startTime = performance.now()
  var i = Math.floor(xarrSize / 3);
  // Remove every third item.
  while (i--) view.xarr.shift();
  report(resultNode, "Remove 1/3rd ", (performance.now() - startTime))

  // Adds to middle
  startTime = performance.now();
  var i = Math.floor(xarrSize / 3);
  while (i--) view.xarr.unshift("+" + i)
  report(resultNode, "Add 1/3rd ", (performance.now() - startTime))
}

render_test(document.getElementById("Ffixture"), document.getElementById("FfR"));
render_test(document.getElementById("Ofixture"), document.getElementById("OfR"));
