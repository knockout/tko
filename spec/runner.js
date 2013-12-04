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
    SeleniumServer = require('selenium-webdriver/remote').SeleniumServer,
    server = require("./server"),

    // selenium setup for standalone servers
    selenium_jar = "selenium-server-standalone-2.37.0.jar",
    selenium_port = 4444,
    selenium_server,

    // this is used below for the driver
    driver,

    // we use this for ensuring the document is loaded, below
    expect_title = "Knockout Secure Binding - Local unit tests"

// we accept an argument of "firefox" to start Selenium
if (process.argv[2] == "firefox") {
  //selenium_server = new SeleniumServer(selenium_jar,
  //  { port: selenium_port })
  //selenium_server.start()
  driver = new webdriver.Builder().
    //usingServer(selenium_server.address()).
    usingServer("http://localhost:4444").
    withCapabilities(webdriver.Capabilities.firefox())
} else {
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
