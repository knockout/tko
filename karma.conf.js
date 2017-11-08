const fs = require('fs')
const path = require('path')

const nodeResolve = require('rollup-plugin-node-resolve')
const rollupCommonJS = require('rollup-plugin-commonjs')
const rollupVisualizer = require('rollup-plugin-visualizer')

const pkg = JSON.parse(fs.readFileSync('package.json'))

const root = path.join(process.cwd(), 'spec')

console.log(`
    🏕  Karma being loaded at:
        ${process.cwd()}
`)

if (!pkg.karma || !pkg.karma.frameworks) {
  console.warn(`
    ⚠️  package.json at ${process.cwd()} does not have "karma.frameworks"
  `)
  process.exit(0)
}

const frameworks = pkg.karma.frameworks
const browsers = ['Electron']

const files = [
  { pattern: 'spec/*.js', watched: false }
]

const preprocessors = {
  'spec/**/*.js': ['rollup']
}

const ROLLUP_CONFIG = {
  RESOLVE: {module: true},
  VISUALIZER: { filename: './visual.html' },
  COMMONJS: {}
}

const rollupPreprocessor = Object.assign({}, {
  format: 'iife',
  name: pkg.name,
  plugins: [
    nodeResolve(ROLLUP_CONFIG.RESOLVE),
    rollupVisualizer(ROLLUP_CONFIG.VISUALIZER),
    rollupCommonJS(ROLLUP_CONFIG.COMMONJS)
    // Add the following to `plugins` to print every import.
    // { name: 'display', load (...x) { console.log(...x) } }
  ],
  sourcemap: process.argv.includes('--sourcemap') ? 'inline' : false
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
