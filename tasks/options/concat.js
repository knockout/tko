module.exports = {
  options: {
    stripBanners: true,
    banner:  '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
    '<%= grunt.template.today("yyyy-m-d") %>\n' +
    ' * <%= pkg.homepage %>\n' +
    ' * Copyright (c) <%= grunt.template.today("yyyy") %> ' +
    '<%= pkg.author.name %>;' +
    ' License: MIT %> */',
  },
  dist: {
    src: [
    'src/head.js',
    'src/parser.js',
    'src/provider.js',
    'src/tail.js'
    ],
    // dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js',
    dest: 'dist/<%= pkg.name %>-latest.js',
  },
}
