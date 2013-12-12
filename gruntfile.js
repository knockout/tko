module.exports = function (grunt) {
  // ref: http://www.thomasboyt.com/2013/09/01/maintainable-grunt.html
  require('colors');
  var config = {
    pkg: grunt.file.readJSON('package.json'),
    env: process.env
  }

  function loadConfig(path) {
    var glob = require('glob');
    var object = {};
    var key;

    glob.sync('*', {cwd: path}).forEach(function(option) {
      key = option.replace(/\.js$/,'');
      object[key] = require(path + option);
    });

    return object;
  }

  grunt.util._.extend(config, loadConfig('./tasks/options/'));

  grunt.initConfig(config)

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('runner', function () {
    var done = this.async()
    require('./spec/runner.js').init_client()
  })
  grunt.registerTask("server", "connect:server:keepalive:true")
  grunt.registerTask("test-chromedriver", "Run tests with chromedriver",
    ['external_daemon:chromedriver', 'connect', 'runner'])
  grunt.registerTask("test", ['connect', 'runner'])
  grunt.registerTask("default", ['concat'])

};
