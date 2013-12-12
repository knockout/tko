module.exports = function (grunt) {
  // ref: http://www.thomasboyt.com/2013/09/01/maintainable-grunt.html
  require('colors');

  require('load-grunt-config')(grunt, {
    config: {
      pkg: grunt.file.readJSON('package.json'),
      env: process.env,
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-m-d") %>\n' +
      ' * <%= pkg.homepage %>\n' +
      ' * Copyright (c) <%= grunt.template.today("yyyy") %> ' +
      '<%= pkg.author.name %>;' +
      ' License: MIT %> */',
    },
  });
};
