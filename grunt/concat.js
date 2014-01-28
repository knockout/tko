module.exports = {
  options: {
    stripBanners: true,
    banner: '<%= banner %>'
  },
  dist: {
    src: [
    'src/head.js',
    'src/identifier.js',
    'src/expression.js',
    'src/parser.js',
    'src/provider.js',
    'src/tail.js'
    ],
    // dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js',
    dest: '<%= pkg.main %>',
  },
}
