#!/usr/bin/env node
require('colors')

var webdriver = require('selenium-webdriver'),
    server = require("./server"),

    expect_title;

// we use this for ensuring the document is loaded, below
expect_title = "Knockout Secure Binding - Local unit tests"

function run_browser_tests() {
  var uri = 'http://' + server.host + ":" + server.port,
    remote_script = "return window.tests",
    results = false,
    fails = 0;

  var driver = new webdriver.Builder().
     withCapabilities(webdriver.Capabilities.chrome()).
     build();

  driver.get(uri)

  // wait for title to load - make sure we're at the right spot
  driver.wait(function() {
   return driver.getTitle().then(function(title) {
     return title === expect_title;
   })
  }, 1000)

  // let the scripts run and get the mocha test results
  driver.wait(function () {
    return driver.executeScript(remote_script).then(function (res) {
      results = res;
      return res.complete;
    })
  }, 1000).then(function () {
    results.results.forEach(function (result) {
      var state = result.state;
      if (state !== 'passed') {
        fails++
        state = state.red.bold
      } else {
        state = state.blue
      }

      console.log(state + "  " + result.title)
    });

    console.log("Total: ", results.results.length, " fails: ", fails)
  })

  // quit the driver and exit with appropriate code
  driver.quit().then(function () {
    // exit code 0 when there are no fails.
    process.exit(fails)
  });
}


// when the server is listening we run our tests
server.instance.on("listening", run_browser_tests)
