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
    env = process.env,

    // our webdriver desired capabilities
    capabilities,

   // Address of the server that is serving up our tests. (i.e. our
  //  local server with CSP headers)
    local_server = {
      host: "localhost",
      port: 7777
    },

    // we use this for ensuring the document is loaded, below
    EXPECT_TITLE = "Knockout Secure Binding - Local unit tests",

    webdriver_host = "localhost",
    webdriver_port = 4445;

function on_results(results) {
  // print output of the tests
  var fails = 0;

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
  if (fails != 0) {
    throw new Error("Some tests failed.")
  }
}

exports.start_tests =
function start_tests() {
  var username, token;
  var capabilities = {
    project: env.BS_AUTOMATE_PROJECT || 'Outside CI',
    build: env.CI_AUTOMATE_BUILD || 'N/A',
    platform: env.SELENIUM_PLATFORM || 'ANY',
    browser: env.SELENIUM_BROWSER || 'chrome',
    browserName: env.SELENIUM_BROWSER || 'chrome',
    browser_version: env.SELENIUM_VERSION || '',
    javascriptEnabled: true,
    'tunner-identifier': env.TRAVIS_JOB_NUMBER,
    tags: ['CI'],
    name: env.JOB_NAME || 'KSB'
  }

  username = env.SAUCE_USERNAME;
  token = env.SAUCE_ACCESS_KEY;
  // username = env.BS_USER
  // token = env.BS_KEY

  var browser =  webdriver.promiseChainRemote(
    env.SELENIUM_HOST, (env.SELENIUM_PORT || 80), username, token
  );

  var uri = 'http://' + local_server.host + ":" + local_server.port;

  // extra logging.
  browser.on('status', function(info) {
    console.log(info.cyan);
  });
  browser.on('command', function(eventType, command, response) {
    console.log(' > ' + eventType.blue, command, (response || '').grey);
  });
  browser.on('http', function(meth, path, data) {
    console.log(' > ' + meth.yellow, path, (data || '').grey);
  });

  process.on("SIGINT", function () {
    console.log("\n\tCtrl-C received; shutting down browser\n".red)
    if (browser) {
      browser.quit(function () { process.exit(1) })
    } else {
      process.exit(1)
    }
  })

  var poll_script = "return window.tests_complete";
  var results_script = "return window.tests";
  var attempts = 10;
  var poll = 1500;

  return browser
    .init(capabilities)
    .get(uri)
    .title()
    .then(function (title) {
      if (title !== EXPECT_TITLE) {
        throw new Error("Expected title " + EXPECT_TITLE + " but got "
          + title)
      }
    })
    .then(function () {
      // Our custom polling, because waitForConditionInBrowser calls 'eval'.
      // i.e. Our CSP prevents wd's safeExecute* (basically anything
      // in wd/browser-scripts).
      function exec() {
        return browser
          .chain()
          .delay(poll)
          .execute(poll_script)
          .then(function (complete) {
            if (--attempts == 0) {
              throw new Error("Taking too long.")
            }
            if (!complete) {
              return exec()
            }
          });
      }
      return exec()
    })
    .execute(results_script)
    .then(on_results)
    .fin(function() { return browser.quit(); })
}
