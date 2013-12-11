module.exports = function (grunt) {
  url = require('url')

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
      port: 2310,
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
          if (url.parse(req.url).pathname.match(/\.html$/)) {
            console.log("REQ URL", req.url)
            req.headers['X-Content-Security-Policy'] = 'xyz'
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

// grunt.registerTask("server", "Start test server", function () {
//   var done = this.async()
//   grunt.log.write("Starting web server")
//   require("./spec/server.js").instance.on("close", done)
// })
};
