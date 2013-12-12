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


var webdriver = require('wd'),

    // our webdriver desired capabilities
    capabilities,

    // what our webdriver may provide
    client,

    // server config
    server = {
      host: 'localhost',
      port: 7777
    },

    // we use this for ensuring the document is loaded, below
    expect_title = "Knockout Secure Binding - Local unit tests",

    webdriver_host = "localhost",
    webdriver_port = 4445;


capabilities = {
  browserName: process.env.BROWSER || "chrome"
}


process.on("SIGINT", function () {
  console.log("\n\tCtrl-C received; shutting down browser\n".red)
  if (client) {
    client.quit(function () { process.exit(1) })
  } else {
    process.exit(1)
  }
})


function on_results(err, results) {
  // print output of the tests
  var fails = 0;

  if (err) {
    throw new Error(err)
  }

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
  client.quit(function () {
    process.exit(fails)
  })
}


function get_mocha_results() {
  var remote_script = "return window.tests && window.tests.complete";

  function on_complete() {
    console.log("Tests complete.")
    client.execute("return window.tests", on_results)
  }

  client.waitForConditionInBrowser(remote_script, 1000, 200, on_complete)
}


function test_title() {
  client.title(function (err, title) {
    // just make sure we're at the right place
    if (err) {
      throw new Error(err)
    }
    if (title !== expect_title) {
      throw new Error("Expected title " + expect_title + " but got "
        + title)
    }

    get_mocha_results()
  })
}


function run_browser_tests() {
  var uri = 'http://' + server.host + ":" + server.port;

  client.init(capabilities, function () {
    client.get(uri, test_title)
  })
  return
}


function init_chrome_client() {
  client = webdriver.remote({
    hostname: webdriver_host,
    port: webdriver_port,
    // logLevel: 'data',
    // desiredCapabilities: capabilities
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
  capabilities["name"] = process.env.JOB_NAME
    || "Knockout Secure Binding"

  client = webdriver.remote({
    hostname: "ondemand.saucelabs.com",
    port: 80,
    user: process.env.SAUCE_USERNAME,
    pwd: process.env.SAUCE_ACCESS_KEY
    // desiredCapabilities: capabilities
  })
}


function init_client() {
  if (process.env['SAUCE_USERNAME']) {
    init_sauce_client()
  } else {
    init_chrome_client()
  }

  client.on('status', function(info) {
    console.log(info.cyan);
  });
  client.on('command', function(meth, path, data) {
    console.log(' > ' + meth.yellow, path.grey, data || '');
  });

  run_browser_tests()
}

exports.init_client = init_client
