#!/usr/bin/env node
var
    webdriver = require('selenium-webdriver'),
    http = require('http'),
    fs = require('fs'),
    url = require('url'),
    path = require('path'),

    server_port = 7887,
    server_host = 'localhost',
    server_responses,
    expect_title,
    server,
    policy_map,
    policy_list,
    policy_string,
    browser_args = { browserName: "chrome", port: 4444 };

// we use this for ensuring the document is loaded, below
expect_title = "Knockout Secure Binding - Local unit tests"

// we may change this accordingly
policy_map = {
  "default-src": "'none'",
  "font-src": "'none'",
  "frame-src": "'none",
  "img-src": "'none'",
  "media-src": "'none",
  "object-src": "'none'",
  "script-src": "'none'",
  "style-src": "'none'",
  "report-uri": "/csp",
};

policy_list = [];
for (var policy in policy_map) {
  policy_list.push(policy + ": " + policy_map[policy]);
}

server_responses = {
  "/runner.html": {
    path: "./runner.html",
    headers: {
      "Content-Security-Policy": policy_list.join("; "),
      "X-Content-Security-Policy": policy_list.join("; ")
    }
  },
  "/mocha.css": {
    path: "../node_modules/mocha/mocha.css"
  },
  "/mocha.js": {
    path: "../node_modules/mocha/mocha.js"
  },
  "/chai.js": {
    path: "../node_modules/chai/chai.js"
  },
  "/sinon.js": {
    path: "../node_modules/sinon/pkg/sinon.js"
  },
  "/knockout.js": {
    path: "../node_modules/knockout/build/output/knockout-latest.debug.js"
  },
  "/knockout-secure-binding.js": {
    path: "../src/knockout-secure-binding.js"
  },
  "/knockout_secure_binding_spec.js": {
    path: "./knockout_secure_binding_spec.js"
  }
}

// set up the server
server = http.createServer(function (request, response) {
  var uri = url.parse(request.url).pathname,
    serve = server_responses[uri];

  if (!serve) {
    console.log("> 404: ", request.url);
    response.writeHead(404, {});
    response.write("404");
    response.end();
    return
  }

  console.log("> 200: ", request.url);

  fs.readFile(serve.path, function (err, data) {
    if (err) {
      console.log("Error", err);
      process.exit(1);
    };
    response.writeHead(200, serve.headers || {});
    response.write(data);
    response.end()
  });
})


function run_browser_tests() {
  var uri = 'http://' + server_host + ":" + server_port + '/runner.html',
    remote_script = "return window.results",
    results = false;

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
      return res;
    })
  }, 1000).then(function () {
    console.log("Tests complete.")
  })

  // quit the driver and exit without issue
  driver.quit().then(function () {
    process.exit(0)
  });
}


// when the server is listening we run our tests
server.on("listening", run_browser_tests)
server.listen(server_port, server_host);
