#!/usr/bin/env node
var
    webdriver = require('wd'),
    chai = require('chai'),
    http = require('http'),
    fs = require('fs'),
    url = require('url'),
    path = require('path'),

    server_port = 7887,
    server_host = 'localhost',
    server_responses,
    server,
    policy_map,
    policy_list,
    policy_string,
    browser_args = { browserName: "chrome", port: 4444 };

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
  var client = webdriver.remote(),
    browser = client.browser,
    sync = client.sync;

  sync(function () {
    browser.init(browser_args)
    browser.get("http://localhost:7887/runner.html")
    browser.get({
         port: server_port,
      host: server_host,
      path: "/runner.html",
    })
    console.log("TITLE",  browser.title())

  })
}


// browser.on('status', function(info){
//   console.log('\x1b[36m%s\x1b[0m', info);
// });

// browser.on('command', function(meth, path){
//   console.log(' > \x1b[33m%s\x1b[0m: %s', meth, path);
// });

// when the server is listening we run our tests
server.on("listening", run_browser_tests)
server.listen(server_port, server_host);
