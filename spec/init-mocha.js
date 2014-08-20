/*
  Called before our *_spec.js file
 */
mocha.ui('bdd');
mocha.reporter("html");
window.assert = chai.assert;
window.expect = chai.expect;
window.tests = [];

afterEach(function () {
  console.log(" --- ", this.currentTest.fullTitle());
  window.tests.push(this.currentTest);
});
