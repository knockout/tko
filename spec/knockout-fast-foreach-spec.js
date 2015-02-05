
/*

  Knockout Else --- Tests

 */

mocha.setup('bdd')
assert = chai.assert;

var xarrSize = 500;


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

// mocha.run();