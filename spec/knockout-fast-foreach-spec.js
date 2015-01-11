
/*

  Knockout Else --- Tests

 */

mocha.setup('bdd')
assert = chai.assert;

var view = {
  test_items: ko.observableArray()
};

var i = 60;
while(i--) {
  view.test_items.push(i);
}

var startTime = performance.now();
ko.applyBindings(view, document.getElementById("FFfixture"))
console.log("FF: " + (performance.now() - startTime) + "ms")

startTime = performance.now();
ko.applyBindings(view, document.getElementById("Ofixture"))
console.log("Original: " + (performance.now() - startTime) + "ms")

mocha.run();