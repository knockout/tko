#!/usr/bin/env node
//
//  runner.js
//  ---------
//
//  Automated testing of Knockout-Secure-Binding
//
//
//  Some handy webdriver docs
//  https://code.google.com/p/selenium/wiki/WebDriverJs
//
require('colors')

var webdriver = require('selenium-webdriver'),
    server = require("./server"),

    // our Sauce webdriver url
    hub_url,

    // what our webdriver may provide
    capabilities,

    // sauce options
    sauce,

    // we use this for ensuring the document is loaded, below
    expect_title = "Knockout Secure Binding - Local unit tests"

if (process.env['SAUCE_USERNAME']) {
  // use sauce; see
  // eg http://about.travis-ci.org/docs/user/gui-and-headless-browsers/
  console.log("\nTesting with Sauce Labs".bold)
  capabilities = webdriver.Capabilities.chrome()

  capabilities["build"] = process.env['TRAVIS_BUILD_NUMBER']

  hub_url = "" + process.env['SAUCE_USERNAME']
    + ":" + process.env['SAUCE_ACCESS_KEY']
    + "@localhost:4445"

  console.log("Sauce HUB URL ", hub_url)

  driver = webdriver.Remote(desired_capabilities=capabilities,
    command_executor="http://" + hub_url + "/wd/hub")
} else {
  console.log("\nTesting with local chromedriver".bold)
  driver = new webdriver.Builder().
    withCapabilities(webdriver.Capabilities.chrome())
}


function run_browser_tests() {
  var uri = 'http://' + server.host + ":" + server.port,
    remote_script = "return window.tests",
    results = false,
    fails = 0;

  var client = driver.build();

  client.get(uri)

  // wait for title to load - make sure we're at the right spot
  client.wait(function() {
   return client.getTitle().then(function(title) {
     return title === expect_title;
   })
  }, 1000)

  // let the scripts run and get the mocha test results
  client.wait(function () {
    return client.executeScript(remote_script).then(function (res) {
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

  // quit the client and exit with appropriate code
  client.quit().then(function () {
    // exit code 0 when there are no fails.
    process.exit(fails)
  });
}


// when the server is listening we run our tests
server.instance.on("listening", run_browser_tests)
