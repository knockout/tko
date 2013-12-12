module.exports = function (grunt) {
  require('colors');
  require('load-grunt-config')(grunt, {
    config: {
      pkg: grunt.file.readJSON('package.json'),
      env: process.env,
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-m-d") %>\n' +
      ' *  <%= pkg.homepage %>\n' +
      ' *  Copyright (c) <%= grunt.template.today("yyyy") %> ' +
      '<%= pkg.author.name %>;' +
      ' License: MIT */\n',
    },
  });
};
