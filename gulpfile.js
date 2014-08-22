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
    yaml = require('js-yaml'),
    Q = require('q'),

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

    // Unless noted otherwise, browsers are disabled here because of
    // Selenium/BrowserStack issues.
    platforms = yaml.safeLoad(
      fs.readFileSync("./platforms.yaml", 'utf8')
    ),

    // how many parallel browser instances?
    browser_streams = 2;


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


function platform_as_obj(platform_str) {
  var parts = platform_str.split(/[:\/]/);
  return {
    browser_name: parts[0],
    browser_ver: parts[1],
    os_name: parts[2],
    os_ver: parts[3],
    name: "" + parts[0] + " " + parts[1] + " on " +
      parts[2] + " " + parts[3],
  };
}

function test_platform(platform_str) {
  var platform = platform_as_obj(platform_str);
  return runner
    .start_tests(platform, verbose)
    .then(function () {
      gutil.log(" ✓ ".green + "All tests passed.")
    })

}

// Add individual tasks for platforms e.g.
platforms.forEach(function (platform_str) {
  var platform = platform_as_obj(platform_str);
  // full name e.g. chrome:29/windows:8
  gulp.task(platform_str, ['connect'], function (done) {
    verbose = true;
    gutil.log()
    gutil.log("Testing " + platform.name.yellow)
    test_platform(platform_str)
      .fail(function (msg) {
        gutil.log("FAIL: ".red + msg.message);
        process.exit(1);
      })
      .then(done)
      .then(process.exit)
      .done();
  });
  // add e.g. chrome:32
  // FIXME (all os's (or at least a sane choice))
  gulp.task(platform.browser_name + ":" + platform.browser_ver,
    [platform_str])
})

gulp.task('test', ['connect'], function (done) {
  var i = 0;
  var fails = [];
  var streams = [];

  function test_multiple_platforms() {
    return test_platform(platforms[i++])
      .fail(function (msg) {
        gutil.log("FAIL: ".red + msg.message)
        fails.push(i - 1);
      })
      .then(function () {
        if (platforms[i]) {
          return test_multiple_platforms()
        }
      })
  }

  gutil.log("Running ".blue + browser_streams +
    " browser streams in parallel.".blue)
  while (browser_streams--) {
    streams.push(test_multiple_platforms());
  }

  Q.all(streams)
    .then(function () {
      gutil.log()
      gutil.log(("========= Tested " + i + " platforms =========").bold)
      gutil.log()
      platforms.forEach(function (platform_str, idx) {
        var platform = platform_as_obj(platform_str);
        gutil.log("  - " +
          (fails.indexOf(idx) >= 0 ? "FAIL".red : "PASS".green) +
          "  " + platform.name.yellow
        );
      });
      gutil.log()
      process.exit(fails.length);
    })
    .done()
})

gulp.task('default', ['concat', 'minify', 'lint']);
