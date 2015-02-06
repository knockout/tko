
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

// render_test(document.getElementById("Ffixture"), document.getElementById("FfR"));
// render_test(document.getElementById("Ofixture"), document.getElementById("OfR"));
