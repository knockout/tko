/*
    Run after our *_spec.js
 */
mocha.run(function (res) {
  window.tests_complete = true;
});
