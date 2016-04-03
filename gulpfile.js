var fs = require('fs'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    header = require('gulp-header'),
    footer = require('gulp-footer'),
    bump = require('gulp-bump'),
    changelog = require("conventional-changelog"),
    watch = require('gulp-watch'),
    url = require('url'),
    colors = require('colors'),
    yaml = require('js-yaml'),

    now = new Date(),

    scripts = [
      'src/head.js',
      'src/identifier.js',
      'src/expression.js',
      'src/parser.js',
      'src/provider.js',
    ],

    banner = '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
      '<%= today.toJSON().substr(0,10) %>\n' +
      ' *  <%= pkg.homepage %>\n' +
      ' *  Copyright (c) 2013 - <%= today.getFullYear() %> ' +
      '<%= pkg.author.name %>;' +
      ' License: MIT */\n' +
      ';(function(factory) {\n' +
      '    //AMD\n' +
      '    if (typeof define === "function" && define.amd) {\n' +
      '        define(["knockout", "exports"], factory);\n' +
      '        //normal script tag\n' +
      '    } else {\n' +
      '        factory(ko);\n' +
      '    }\n' +
      '}(function(ko, exports, undefined) {\n',

    tail = '    if (!exports) {\n' +
    '        ko.secureBindingsProvider = secureBindingsProvider;\n' +
    '    }\n' +
    '    return secureBindingsProvider;\n' +
    '}));';


gulp.task('concat', function () {
  var pkg = require('./package.json');
  gulp.src(scripts)
      .pipe(concat("knockout-secure-binding.js"))
      .pipe(header(banner, { pkg: pkg, today: now }))
      .pipe(footer(tail))
      .pipe(gulp.dest("./dist"))
})

gulp.task('minify', function () {
  var pkg = require('./package.json');
  gulp.src(scripts)
      .pipe(concat("knockout-secure-binding.min.js"))
      .pipe(uglify())
      .pipe(header(banner, { pkg: pkg, today: now }))
      .pipe(footer(tail))
      .pipe(gulp.dest("./dist"))
})

gulp.task('lint', function () {
  gulp.src("src/*.js") // ignore head.js & tail.js
      .pipe(jshint())
      .pipe(jshint.reporter('jshint-stylish'));
})

gulp.task('bump', function () {
  gulp.src('./package.json')
      .pipe(bump())
      .pipe(gulp.dest('./'));
})

gulp.task('changelog', function (done) {
  changelog({
    repository: "https://github.com/brianmhunt/knockout-secure-binding",
    version: require('./package.json').version,
  }, function (err, log) {
    if (err) {
      throw new Error("Unable to make changelog: " + err);
    }
    fs.writeFileSync('CHANGELOG.md', log);
    gutil.log("Changelog updated.".green)
  })
})

gulp.task('default', ['concat', 'minify']);
