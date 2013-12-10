#!/usr/bin/env node
require('colors')

var http = require('http'),
    fs = require('fs'),
    url = require('url'),
    path = require('path'),

    // Note that this port must be forwarded by sauce
    // see https://saucelabs.com/docs/connect
    server_port = parseInt(process.env.SERVER_PORT) || 2310,
    server_host = 'localhost',
    server_responses,
    policy_map,
    policy_list,
    policy_string,
    content_types;

// change to this scripts directory for referencing paths
process.chdir(__dirname)

// we may change this accordingly
policy_map = {
  "default-src": "'none'",
  "font-src": "'none'",
  "frame-src": "'none'",
  "img-src": "'none'",
  "media-src": "'none'",
  "object-src": "'none'",
  "script-src": "'self'",
  "style-src": "'self'",
  "report-uri": "/csp",
};

policy_list = [];
for (var policy in policy_map) {
  policy_list.push(policy + " " + policy_map[policy]);
}

server_responses = {
  "/": {
    path: "./runner.html",
    headers: {
      "Content-Security-Policy": policy_list.join("; "),
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
    path: "../build/knockout-secure-binding.js"
  },
  "/knockout_secure_binding_spec.js": {
    path: "./knockout_secure_binding_spec.js"
  },
  "/init-mocha": {
    path: "./init-mocha.js"
  },
  "/run-mocha": {
    path: "./run-mocha.js"
  }
}

content_types = {
  '.css': "text/css",
  ".js": "text/javascript"
}

// set up the server
server = http.createServer(function (request, response) {
  var uri = url.parse(request.url).pathname,
    serve = server_responses[uri];

  if (!serve) {
    console.log(" \u2711 404 ".red, request.url);
    response.writeHead(404, {});
    response.write("404");
    response.end();
    return
  }

  if (!serve.headers) {
    serve.headers = {}
  }

  serve.headers["Content-Type"] = content_types[
    path.extname(serve.path)
  ]

  console.log(" \u2712 200 ".green, request.url);

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

server.on("listening", function () {
    var uri = "http://" + server_host + ":" + server_port
    console.log("\n \u2699  Test server:\t\t" + uri.bold.yellow)
    console.log(" \u2699  Listening ...")
})

// defer so our code finishes loading and any event handlers are bound.
setTimeout(function () {
    server.listen(server_port, server_host);
}, 0)

module.exports = {
    port: server_port,
    host: server_host,
    instance: server,
}

