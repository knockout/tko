var fs = require('fs'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    header = require('gulp-header'),
    bump = require('gulp-bump'),
    jshint = require('gulp-jshint'),
    exec = require('gulp-exec'),
    connect = require('gulp-connect'),
    changelog = require("conventional-changelog"),
    watch = require('gulp-watch'),
    url = require('url'),
    colors = require('colors'),
    runner = require('./spec/runner.js'),

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
report-uri /csp".replace(/\s+/g, " "),

    use_csp = true,
    verbose = false,

    // See: https://www.browserstack.com/automate/node#setting-os-and-browser
    // Unless noted otherwise, browsers are disabled here because of
    // Selenium/BrowserStack issues.
    platforms = [
      { browser: "chrome:28", os: "windows:8" },
      { browser: "chrome:29", os: "windows:8" },
      { browser: "chrome:30", os: "windows:8" },
      { browser: "chrome:31", os: "windows:8" },
      { browser: "chrome:32", os: "windows:8" },
      { browser: "chrome:33", os: "windows:8" },
      { browser: "chrome:34", os: "windows:8" },
      { browser: "chrome:35", os: "windows:8" },
      { browser: "chrome:36", os: "windows:8.1" },
      { browser: "firefox:25", os: "windows:8.1" },
      { browser: "firefox:26", os: "windows:8.1" },
      { browser: "firefox:27", os: "windows:8.1" },
      { browser: "firefox:28", os: "windows:8.1" },
      { browser: "firefox:29", os: "windows:8.1" },
      { browser: "firefox:30", os: "windows:8.1" },
      { browser: "firefox:31", os: "windows:8.1" },
      // { browser: "opera:20.0", os: "windows:8.1" },
      // { browser: "opera:21.0", os: "windows:8.1" },
      // { browser: "opera:22.0", os: "windows:8.1" },
      // { browser: "opera:23.0", os: "windows:8.1" },
      // { browser: "safari:5.1", os: "windows:8.1" },

      // Internet Explorer may need some work.
      // { browser: "ie:7.0", os: "windows:xp" },
      // { browser: "ie:8.0", os: "windows:7" },
      // { browser: "ie:9.0", os: "windows:7" },
      // { browser: "ie:10.0", os: "windows:7" },
      // { browser: "ie:11.0", os: "windows:7" },

      // { browser: "safari:6.1", os: "OS X:Mountain Lion" },
      // { browser: "safari:7", os: "OS X:Mavericks" },
    ];

gulp.task('concat', function () {
  var pkg = require('./package.json');

  gulp.src(scripts)
      .pipe(concat("knockout-secure-binding.js"))
      .pipe(header(banner, { pkg: pkg, today: now }))
      .pipe(gulp.dest("./dist"))
})

gulp.task('minify', function () {
  var pkg = require('./package.json');
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

gulp.task("release", ['concat', 'minify'], function () {
  // see eg
  //  https://github.com/tomchentw/gulp-livescript/blob/master/gulpfile.ls
  // Note: http://stackoverflow.com/questions/9210542
  delete require.cache[require.resolve('./package.json')];
  var pkg = require('./package.json'),
      version = pkg.version,
      commit_msg = "Release: " + version;

  // Conventional changelog:
  // https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit
  gulp.src('.')
      .pipe(gulp.dest("."))
      .pipe(exec("git add -A"))
      .pipe(exec("git commit -m '" + commit_msg + "'"))
      .pipe(exec("git tag -a " + version + " -m '" + commit_msg + "'"))
      .pipe(exec("git push"))
      .pipe(exec("git push origin refs/tags/" + version +
        ":refs/tags/" + version))
      .pipe(exec("npm publish"))  // always ahead by one???
})

gulp.task('connect', function () {
  connect.server({
    root: __dirname,
    base: [
      'node_modules/mocha/',
      'node_modules/chai/',
      'node_modules/sinon/pkg/',
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
          if (verbose) {
            console.log("  (connect)  ".grey + req.method + ":" +
              url.parse(req.url).pathname)
          }
          // / => /runner.html
          if (url.parse(req.url).pathname.match(/^\/$/)) {
            req.url = req.url.replace("/", "/runner.html")
            if (use_csp) {
              res.setHeader('Content-Security-Policy', policy_map)
            }
          }
          next()
        }
      ]
      options.base.forEach(function(base) {
        middlewares.push(connect.static(base))
      })
      return middlewares
    }
  })
})

gulp.task('no-csp', function() {
  gutil.log(">>> DISABLING CSP <<<".red)
  use_csp = false;
});

gulp.task('live-no-csp', ['no-csp', 'live']);

gulp.task('live', ['watch', 'connect'], function () {
  gutil.log(">>> Starting Live. <<< ".green)
  var pkg = require('./package.json');
  gulp.src([pkg.main, "spec/*"])
      .pipe(watch())
      .pipe(connect.reload())
})


gulp.task('test', ['connect'], function (done) {
  var i = 0;
  var fails = [];

  function test_platform(platform) {
    var browser_name = platform.browser.split(":")[0];
    var browser_version = platform.browser.split(":")[1];
    var os_name = platform.os.split(":")[0];
    var os_version = platform.os.split(":")[1]
    var target_string = "" + browser_name + " (" + browser_version + ") on " +
      os_name + " " + os_version;
    platform.target_string = target_string; // for logs, later.
    return runner
      .start_tests(browser_name, browser_version, os_name, os_version, target_string)
      .then(function () {
        gutil.log("   All tests passed for " + target_string.yellow)
      })
      .fail(function (msg) {
        gutil.log(msg.message)
        fails.push(i);
      })
      .then(function () {
        if (platforms[++i]) {
          return test_platform(platforms[i])
        }
      })
  }

  test_platform(platforms[0])
    .then(function () {
      gutil.log()
      gutil.log(("========= Tested " + i + " platforms =========").bold)
      gutil.log()
      platforms.forEach(function (platform, idx) {
        gutil.log("  - " +
          (fails.indexOf(idx) >= 0 ? "FAIL".red : "PASS".green) +
          "  " + platform.target_string.yellow
        );
      });
      gutil.log()
      if (fails.length != 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    })
    .done()
})

gulp.task('default', ['concat', 'minify', 'lint']);
