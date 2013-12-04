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
'use strict'
require('colors')

var webdriverjs = require('webdriverjs'),
    server = require("./server"),

    // our webdriver desired capabilities
    capabilities,

    // what our webdriver may provide
    client,

    // we use this for ensuring the document is loaded, below
    expect_title = "Knockout Secure Binding - Local unit tests"

console.log("WJS")

capabilities = {
  browserName: "chrome"
}

if (process.env['SAUCE_USERNAME']) {
  // use sauce; see
  // eg http://about.travis-ci.org/docs/user/gui-and-headless-browsers/
  console.log("\nTesting with Sauce Labs".bold)

  capabilities["build"] = process.env['TRAVIS_BUILD_NUMBER']
  capabilities["javascriptEnabled"] = true

  client = webdriverjs.remote({
    host: "localhost",
    port: 4445,
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    desiredCapabilities: capabilities
  }).init()

} else {
  // don't forget to start chromedriver with:
  //  $ chromedriver --url-base=/wd/hub
  // see https://github.com/camme/webdriverjs/issues/113

  console.log("\nTesting with local chromedriver".bold)

  client = webdriverjs.remote({
    host: "localhost",
    port: 9515,
    logLevel: 'data',
    desiredCapabilities: capabilities
  }).init()
}


function run_browser_tests() {
  var uri = 'http://' + server.host + ":" + server.port,
    remote_script = "return window.tests",
    results = false,
    WAIT = 1000,
    fails = 0;

  client.url(uri)
    .pause(WAIT)
    .getTitle(function (err, title) {
      // just make sure we're at the right place
      if (err) {
        throw new Error(err)
      }
      if (title !== expect_title) {
        throw new Error("Expected title " + expect_title + " but got "
          + title)
      }
    })
    .execute(remote_script, null, function (err, res) {
      // print output of the tests
      if (err) {
        throw new Error(err)
      }
      results = res.value;
      console.log("\n\tBrowser test results\n".yellow)
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

      console.log("\n\tTotal: ", results.results.length, " fails: ", fails, "\n")

      // quit the client and exit with appropriate code
      client.end(function () {
        process.exit(fails)
      })
    })
}


// when the server is listening we run our tests
server.instance.on("listening", run_browser_tests)
