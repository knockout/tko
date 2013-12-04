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


capabilities = {
  browserName: "chrome"
}


if (process.env['SAUCE_USERNAME']) {
  // use sauce; see
  // eg http://about.travis-ci.org/docs/user/gui-and-headless-browsers/
  console.log("\nTesting with Sauce Labs".bold)

  capabilities["build"] = process.env.TRAVIS_BUILD_NUMBER
  capabilities["javascriptEnabled"] = true
  capabilities["tunnel-identifier"] = process.env.TRAVIS_JOB_NUMBER,
  capabilities["tags"] = ["CI"]
  capabilities["name"] = "Knockout Secure Binding"

  client = webdriverjs.remote({
    host: "localhost",
    port: 4445,
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    desiredCapabilities: capabilities
  })

} else {
  // don't forget to start chromedriver with:
  //  $ chromedriver --url-base=/wd/hub
  // see https://github.com/camme/webdriverjs/issues/113

  console.log("\nTesting with local chromedriver".bold)
  console.log("\nDon't forget to start chromedriver with" +
              " $ chromedriver --url-base=/wd/hub".blue)

  client = webdriverjs.remote({
    host: "localhost",
    port: 9515,
    // logLevel: 'data',
    desiredCapabilities: capabilities
  })
}


process.on("SIGINT", function () {
  console.log("\tCtrl-C received; shutting down browser".red)
  client.end(function () {
    process.exit(1)
  })
})


function waitForExecute(script, callback, test_done, timeout) {
  if (!timeout) {
    timeout = 150
  }

  this.execute(script, null, function(err, res) {
    if (err || test_done(res)) {
      callback.call(this, err, res)
      return
    }

    setTimeout(waitForExecute.bind(this, script, callback, test_done,
      timeout), timeout)
  })
}


function on_results(err, res) {
  // print output of the tests
  var results,
      fails = 0;

  if (err) {
    throw new Error(err)
  }

  results = res.value;
  console.log("\n\tBrowser test results\n".yellow)
  results.results.forEach(function (result) {
    var state = result.state;
    if (state !== 'passed') {
      fails++
      state = ("  \u2714 " + state).red.bold
    } else {
      state = "  \u2713 ".green
    }
    console.log(state + " " + result.title)
  })
  console.log("\n\tTotal: ", results.results.length, " fails: ", fails, "\n")

  // quit the client and exit with appropriate code
  this.end(function () {
    process.exit(fails)
  })
}


function run_browser_tests() {
  var uri = 'http://' + server.host + ":" + server.port,
    remote_script = "return window.tests";

  function test_done(result) {
    return result.value.complete
  }

  client.init()
    .url(uri)
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
    .call(waitForExecute.bind(client, remote_script, on_results, test_done))
  return
}


// when the server is listening we run our tests
server.instance.on("listening", run_browser_tests)
