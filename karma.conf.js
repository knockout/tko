/* eslint semi: 0 */

const fs = require('fs')
const path = require('path')

const nodeResolve = require('rollup-plugin-node-resolve')
const rollupCommonJS = require('rollup-plugin-commonjs')
const rollupVisualizer = require('rollup-plugin-visualizer')
const includePaths = require('rollup-plugin-includepaths')

const pkg = JSON.parse(fs.readFileSync('package.json'))

const root = path.join(process.cwd(), 'spec')

console.log(` 🏕  Karma being loaded at ${process.cwd()}.`)

if (!pkg.karma || !pkg.karma.frameworks) {
  console.warn(`
    ⚠️  package.json at ${process.cwd()} does not have "karma.frameworks"
  `)
  process.exit(0)
}

const frameworks = pkg.karma.frameworks
const browsers = ['Electron']

const files = [
  { pattern: 'src/*.js', included: false, watched: true },
  { pattern: 'spec/*.js' }
]

const preprocessors = {
  'src/**/*.js': ['rollup'],
  'spec/**/*.js': ['rollup']
}

const ROLLUP_CONFIG = {
  INCLUDE_PATHS: { paths: [ path.join(root, '../..') ] },
  RESOLVE: {jsnext: true},
  VISUALIZER: { filename: './visual.html' },
  COMMONJS: {}
}

// The following can be used to identify
// const seen = []
// SEEN_PLUGIN = { name: 'inline',
//   load(x) {
//     if (seen.includes(x)) { return }
//     seen.push(x)
//     console.info(x.replace('/Users/bmh/Repos/tko/packages/',''))
//   }
// }

const rollupPreprocessor = Object.assign({}, {
  format: 'iife',
  moduleName: pkg.name,
  plugins: [
    includePaths(ROLLUP_CONFIG.INCLUDE_PATHS),
    nodeResolve(ROLLUP_CONFIG.RESOLVE),
    rollupVisualizer(ROLLUP_CONFIG.VISUALIZER),
    rollupCommonJS(ROLLUP_CONFIG.COMMONJS)
  ],
  sourceMap: process.argv.includes('--sourcemap') ? 'inline' : false
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
    electronOpts: {
      frame: false,
      resizable: false,
      focusable: false,
      show: false,
      fullscreenable: false,
      hasShadow: false
    },
    singleRun: process.argv.includes('--once')
  })
}
