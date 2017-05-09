/* eslint semi: 0 */

const fs = require('fs')
const path = require('path')

const nodeResolve = require('rollup-plugin-node-resolve')
const rollupCommonJs = require('rollup-plugin-commonjs')
const rollupBabel = require('rollup-plugin-babel')
const rollupVisualizer = require('rollup-plugin-visualizer')
const includePaths = require('rollup-plugin-includepaths')

const pkg = JSON.parse(fs.readFileSync('package.json'))

const root = path.join(process.cwd(), 'spec')

const frameworks = pkg.karma.frameworks
const browsers = ['PhantomJS']

const files = [
  { pattern: "polyfills.js" },
  { pattern: "src/*.js", included: false, watched: true },
  { pattern: "spec/*.js" },
]

const preprocessors = {
  'polyfills.js': ['rollup'],
  'src/**/*.js': ['rollup'],
  'spec/**/*.js': ['rollup'],
}

const ROLLUP_CONFIG = {
  INCLUDE_PATHS: { paths: [ path.join(root, "../..") ] },
  RESOLVE: {jsnext: true},
  BABEL: {},
  COMMONJS: {},
  VISUALIZER: { filename: './visual.html' },
}

const rollupPreprocessor = Object.assign({}, {
  format: 'iife',
  moduleName: pkg.name,
  plugins: [
      includePaths(ROLLUP_CONFIG.INCLUDE_PATHS),
      nodeResolve(ROLLUP_CONFIG.RESOLVE),
      rollupCommonJs(ROLLUP_CONFIG.COMMONJS),
      rollupBabel(ROLLUP_CONFIG.BABEL),
      rollupVisualizer(ROLLUP_CONFIG.VISUALIZER),
  ],
  sourceMap: process.argv.includes('--sourcemap') ? 'inline': false,
})

module.exports = (config) => {
  config.set({
    basePath: process.cwd(),
    files,
    preprocessors,
    rollupPreprocessor,
    frameworks,
    browsers,
    resolve: { root },
    singleRun: process.argv.includes('--once')
  })
}
