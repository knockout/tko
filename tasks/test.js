//
// Test task
//
var fs = require('fs')
var path = require('path')

var _ = require('lodash')
var figlet = require('figlet')
var karma = require('karma')
var nodeResolve = require('rollup-plugin-node-resolve');

var stub = require('rollup-plugin-stub');

var gulp = global.__tko_gulp


const SPEC_DIR = path.join(process.cwd(), 'spec')

function test(extra_config) {
    var options = Object.assign({}, config.karma, extra_config)

    options.files = [
      { pattern: "src/*.js", included: false, watched: true },
      { pattern: "spec/*.js" },
    ]

    options.preprocessors = {
      '**/*.js': ['rollup'],
    }

    options.rollupPreprocessor = {
      plugins: [
        // stub(),  see:
        //  https://github.com/eventualbuddha/rollup-plugin-stub/issues/2
        nodeResolve({ jsnext: true, }),
      ],
      sourceMap: 'inline',
    }

    if (process.argv.indexOf('--debug') >= 0) {
      options.logLevel = 'DEBUG'
    }

    options.resolve = options.resolve || {}
    options.resolve.root = SPEC_DIR

    if (process.argv.indexOf("--once") >= 0) { options.singleRun = true; }
    if (process.argv.indexOf("--watch") >= 0) { options.singleRun = false; }

    new karma.Server(options)
      .on('browser_error', function(browser, error) {
          console.log(browser.name.cyan, " 🚨  Error:".red, error)
      })
      .on('run_complete', function(browsers, results) {
          console.log(" 🏁  Run complete.".green)
      })
      .start()
}

gulp.task('test', 'Run Karma tests', function () {
  var runner = process.argv.indexOf('--chrome') >= 0 ? 'Chrome' : "PhantomJS"

  test({browsers: [runner]})
}, {
  options: {
    'once': 'Run the test once, then quit.',
    'watch': 'Watch for changes, re-testing on change.',
    'debug': 'Print task debugging.',
    'chrome': 'Use Chrome test runner'
  }
})
