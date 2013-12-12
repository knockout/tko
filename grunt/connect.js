
var url = require('url'),
policy_map =
"default-src 'none'; \
font-src 'none'; \
frame-src 'none'; \
img-src 'none'; \
media-src 'none'; \
object-src 'none'; \
script-src 'self' localhost:35729; \
connect-src ws://localhost:35729; \
style-src 'self'; \
report-uri /csp".replace(/\s+/g, " ");


module.exports = {
  server: {
   options: {
    port: 7777,
    // keepalive: true,
    base: [
    'node_modules/mocha/',
    'node_modules/chai/',
    'node_modules/sinon/pkg/',
    'node_modules/knockout/build/output/',
    'dist/',
    'spec/',
    ],
    middleware: function (connect, options) {
      middlewares = [
      function(req, res, next) {
        console.log(req.method.blue, url.parse(req.url).pathname)

        // / => /runner.html
        if (url.parse(req.url).pathname.match(/^\/$/)) {
          req.url = req.url.replace("/", "/runner.html")
          res.setHeader('Content-Security-Policy', policy_map)
        }
        next()
      }
      ]
      options.base.forEach(function(base) {
        middlewares.push(connect.static(base))
      })
      return middlewares
    }
  }
}
}
