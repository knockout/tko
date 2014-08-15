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

    // what our webdriver may provide
    client,

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


capabilities = {
  project: env.BS_AUTOMATE_PROJECT || 'Outside CI',
  build: env.BS_AUTOMATE_BUILD || 'N/A',
  platform: env.SELENIUM_PLATFORM || 'ANY',
  browser: env.SELENIUM_BROWSER || 'chrome',
  browser_version: env.SELENIUM_VERSION || '',
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
    if (title !== EXPECT_TITLE) {
      throw new Error("Expected title " + EXPECT_TITLE + " but got "
        + title)
    }

    get_mocha_results()
  })
}


function run_browser_tests() {
  var uri = 'http://' + local_server.host + ":" + local_server.port;

  client.init(capabilities, function () {
    client.get(uri, test_title)
  })
  return
}

exports.start_tests =
function start_tests() {
  var browser =  webdriver.promiseChainRemote(
    env.SELENIUM_HOST,
    (env.SELENIUM_PORT || 80),
    env.BS_USER,
    env.BS_KEY
  );
  var uri = 'http://' + local_server.host + ":" + local_server.port;

  // extra logging.
  browser.on('status', function(info) {
    console.log(info.cyan);
  });
  browser.on('command', function(eventType, command, response) {
    console.log(' > ' + eventType.cyan, command, (response || '').grey);
  });
  browser.on('http', function(meth, path, data) {
    console.log(' > ' + meth.magenta, path, (data || '').grey);
  });

  return browser
    .init(capabilities)
    .get(uri)
    .title(function (title) {
      var title = browser.title()
      console.log("TITLE", title, "E", EXPECT_TITLE)
      if (title !== EXPECT_TITLE) {
        throw new Error("Expected title " + EXPECT_TITLE + " but got "
          + title)
      }
      console.log("Title", browser.title)
    })
    .then()
    .fin(function() { return browser.quit(); })
}
