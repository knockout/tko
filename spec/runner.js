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
    expect_title = "Knockout Secure Binding - Local unit tests",

    webdriver_host = "localhost",
    webdriver_port = 4445;


capabilities = {
  browserName: "chrome"
}


process.on("SIGINT", function () {
  function close_client() {
    if (client) {
      client.end(function () {
        process.exit(1)
      })
    } else {
      process.exit(1)
    }
  }

  console.log("\tCtrl-C received; shutting down browser".red)
  if (server.instance) {
    server.instance.close(close_client)
  } else {
    close_client()
  }
})


function waitForExecute(script, callback, test_done, timeout) {
  if (!timeout) {
    timeout = 250
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
  console.log("\n\tBROWSER TEST RESULTS".yellow +
              "\n\t--------------------\n".bold)
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


function init_chrome_client() {
  // don't forget to start chromedriver with:
  //  $ chromedriver --url-base=/wd/hub
  // see https://github.com/camme/webdriverjs/issues/113

  console.log(
    "\n-----------------------------------------------------".bold +
    "\n       Don't forget to start chromedriver with" +
    "\n\n    $ chromedriver --url-base=/wd/hub --port=4445".bold.blue +
    "\n\n-----------------------------------------------------".bold
  )

  client = webdriverjs.remote({
    host: webdriver_host,
    port: webdriver_port,
    // logLevel: 'data',
    desiredCapabilities: capabilities
  })
}


function init_sauce_client() {
  // use sauce; see
  // eg http://about.travis-ci.org/docs/user/gui-and-headless-browsers/
  console.log("\nTesting with Sauce Labs".bold)

  capabilities["build"] = process.env.TRAVIS_BUILD_NUMBER
  capabilities["javascriptEnabled"] = true
  capabilities["tunnel-identifier"] = process.env.TRAVIS_JOB_NUMBER,
  capabilities["tags"] = ["CI"]
  capabilities["name"] = "Knockout Secure Binding"

  client = webdriverjs.remote({
    host: webdriver_host,
    port: webdriver_port,
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    desiredCapabilities: capabilities
  })
}


function init_client() {
  if (process.env['SAUCE_USERNAME']) {
    init_sauce_client()
  } else {
    init_chrome_client()
  }

  run_browser_tests()
}


// when the server is listening we run our tests
server.instance.on("listening", init_client)
