module.exports = function (grunt) {

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

    // connect: {
    //   server: {
    //     options: {
    //       port: 2310,
    //       base: [
    //       'node_modules/mocha/',
    //       'node_modules/chai/',
    //       'node_modules/sinon/pkg/',
    //       'node_modules/knockout/build/output/',
    //       'build/',
    //       'spec/',
    //       ],
    //       keepalive: true,
    //       middleware: function (connect, options) {
    //         console.log("CONNECT", connect, "OPTIONS", options)
    //         return [
    //         connect.static(options.base),
    //         function (req, res, next) {
    //           console.log("REQ", req, "RES", res, "NEXT", next)
    //           res.end('Hello from port ' + options.port)
    //         }
    //         ]
    //       }
    //     }
    //   }
    // }
  });


  grunt.loadNpmTasks("grunt-browserify")
  grunt.loadNpmTasks("grunt-watchify")
  grunt.loadNpmTasks('grunt-contrib-connect')

  grunt.registerTask("default", ['browserify'])

  grunt.registerTask("server", "Start test server", function () {
    var done = this.async()
    grunt.log.write("Starting web server")
    require("./spec/server.js").instance.on("close", done)
  })
};
