/*
  Called before our *_spec.js file
 */
mocha.ui('bdd');
mocha.reporter("html");
window.assert = chai.assert;
window.expect = chai.expect;
window.tests = {
    complete: false,
    results: []
};

afterEach(function () {
  console.log(" --- ", this.currentTest.fullTitle());
  window.tests.results.push({
    title: this.currentTest.fullTitle(),
    state: this.currentTest.state,
  })
});
