/*
    Run after our *_spec.js
 */
mocha.run(function (res) {
  window.fails = []
  for (var i = 0; i < window.tests.length; ++i) {
    var test = window.tests[i];
    if (test.state != 'passed') {
      fails.push(test.fullTitle() + " (Message: \"" + test.err.message + "\")")
    }
  }
  window.tests_complete = true;
});
