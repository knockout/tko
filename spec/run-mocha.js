/*
    Run after our *_spec.js
 */
mocha.run(function (res) {
  window.tests.complete = true;
});
