module.exports = function (grunt) {
  require('colors')
  var url = require('url'),
      test_policy_map;

  test_policy_map =
    "default-src 'none'; \
    font-src 'none'; \
    frame-src 'none'; \
    img-src 'none'; \
    media-src 'none'; \
    object-src 'none'; \
    script-src 'self'; \
    style-src 'self'; \
    report-uri /csp".replace(/\s+/g, " ")

// default-src 'none'; font-src 'none'; frame-src 'none'; img-src 'none'; media-src 'none'; object-src 'none'; script-src 'self'; style-src 'self'; report-uri /csp

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    browserify: {
      dist: {
        files: {
          'build/knockout-secure-binding.js': ["src/**/*.js"]
        },
        shim: {

        }
      }
    },

    watchify: {
      options: {
        keepalive: true,
        callback: function (b) {
          return b
        }
      },
      dist: {
        src: './src/**/*.js',
        dest: "build/knockout-secure-binding.js"
      },
    },

    connect: { server: { options: {
      port: 7777,
      base: [
      'node_modules/mocha/',
      'node_modules/chai/',
      'node_modules/sinon/pkg/',
      'node_modules/knockout/build/output/',
      'build/',
      'spec/',
      ],
      keepalive: true,
      middleware: function (connect, options) {
        middlewares = [
        function(req, res, next) {
          console.log(req.method.blue, url.parse(req.url).pathname)
          if (url.parse(req.url).pathname.match(/^\/$/)) {
            req.url = req.url.replace("/", "/runner.html")
            res.setHeader('Content-Security-Policy', test_policy_map)
          }
          next()
        }
        ]
        options.base.forEach(function(base) {
          middlewares.push(connect.static(base))
        })
        return middlewares
      }}}
    }
  });

grunt.loadNpmTasks("grunt-browserify")
grunt.loadNpmTasks("grunt-watchify")
grunt.loadNpmTasks('grunt-contrib-connect')

grunt.registerTask("default", ['browserify'])
};
