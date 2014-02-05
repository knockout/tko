var gulp = require('gulp'),
    gutil = require('gulp-util'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    header = require('gulp-header'),
    bump = require('gulp-bump'),
    jshint = require('gulp-jshint'),
    connect = require('gulp-connect'),
    watch = require('gulp-watch'),
    url = require('url'),
    colors = require('colors'),

    pkg = require('./package.json'),
    now = new Date(),

    scripts = [
      'src/head.js',
      'src/identifier.js',
      'src/expression.js',
      'src/parser.js',
      'src/provider.js',
      'src/tail.js'
    ],

    banner = '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
      '<%= today.toJSON().substr(0,10) %>\n' +
      ' *  <%= pkg.homepage %>\n' +
      ' *  Copyright (c) 2013 - <%= today.getFullYear() %> ' +
      '<%= pkg.author.name %>;' +
      ' License: MIT */\n',

    policy_map = "default-src 'none'; \
font-src 'none'; \
frame-src 'none'; \
img-src 'none'; \
media-src 'none'; \
object-src 'none'; \
script-src 'self' localhost:36551; \
connect-src ws://localhost:36551; \
style-src 'self'; \
report-uri /csp".replace(/\s+/g, " ");

gulp.task('concat', function () {
  gulp.src(scripts)
      .pipe(concat("knockout-secure-binding.js"))
      .pipe(header(banner, { pkg: pkg, today: now }))
      .pipe(gulp.dest("./dist"))
})

gulp.task('minify', function () {
  gulp.src(scripts)
      .pipe(concat("knockout-secure-binding.min.js"))
      .pipe(uglify())
      .pipe(header(banner, { pkg: pkg, today: now }))
      .pipe(gulp.dest("./dist"))
})

gulp.task('watch', function () {
  gulp.watch(scripts, ['concat', 'lint'])
})

gulp.task('lint', function () {
  gulp.src(scripts.slice(1, -1)) // ignore head.js & tail.js
      .pipe(jshint())
      .pipe(jshint.reporter('jshint-stylish'));
})

gulp.task('bump', ['concat', 'minify'], function () {
  gulp.src('./package.json')
      .pipe(bump())
      .pipe(gulp.dest('./'));
})

gulp.task('connect', connect.server({
  root: __dirname,
  base: [
    'node_modules/mocha/',
    'node_modules/chai/',
    'node_modules/sinon/pkg/',
    'node_modules/knockout/build/output/',
    'dist/',
    'spec/',
  ],
  port: 7777,
  livereload: {
    port: 36551
  },
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
}))

gulp.task('live', ['watch', 'connect'], function () {
  console.log("WATching", pkg.main, "then relaoding")
  gulp.src([pkg.main, "spec/*"])
      .pipe(watch())
      .pipe(connect.reload())
})

gulp.task('test', ['connect'], function () {
  require('./spec/runner.js').init_client()
})

gulp.task('default', ['concat', 'minify', 'lint']);

// TODO: external chromedriver daemon (see grunt-external-daemon)
// var net = require('net'),
//     chromedriver_started = false;
// chromedriver: {
//   cmd: 'chromedriver',
//   args: ['--url-base=/wd/hub', '--port=4445'],
//   options: {
//     startCheck: function startCheck(stdout, stderr) {
//       var client = net.connect({port: 4445},
//         function() {
//           chromedriver_started = true;
//           client.end();
//         });
//       return chromedriver_started;
//     },
//     verbose: true
//   }
// }
