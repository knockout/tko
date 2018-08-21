/**
 * Config for karma.
 */
const fs = require('fs')
const path = require('path')
const nodeResolve = require('rollup-plugin-node-resolve')
const rollupCommonJS = require('rollup-plugin-commonjs')
const rollupVisualizer = require('rollup-plugin-visualizer')
const typescript = require('typescript')

const replacerPlugin = require('./rollup.replacerPlugin')

const {argv} = process
const root = path.join(process.cwd(), 'spec')

const pkg = JSON.parse(fs.readFileSync('package.json'))

console.log(`
    🏕  Karma being loaded at:
        ${process.cwd()}
`)

if (!pkg.karma || !pkg.karma.frameworks) {
  console.warn(`
    ⚠️  package.json at ${process.cwd()} does not have "karma.frameworks"
  `)
  process.exit()
}

const rollupPreprocessor = {
  output: {
    format: 'iife',
    name: pkg.name.replace('@tko/', ''),
    /**
     * Source maps often link multiple files (e.g. tko.utils/src/object.js)
     * from different spec/ files.  This causes problems e.g. a breakpoints
     * occur in the wrong spec/ file.
     *
     * Nevertheless enabling source maps when there's only one test file
     * can be illuminating, so it's an option.
     */
    sourcemap: argv.includes('--sourcemap') ? 'inline' : false
  },

  plugins: [
    replacerPlugin,
    nodeResolve({ module: true }),
    rollupCommonJS(),
    rollupVisualizer({ filename: './visual.html' })
  ]
}

const typescriptPreprocessor = {
  typescript,
  options: {
    target: 'ES2017',
    // lib: ['DOM', 'ES5', 'ES6', 'ScriptHost', 'ES2015', 'ES2016', 'ES2017'],
    removeComments: false,
    downlevelIteration: true
  }
}

const COMMON_CONFIG = {
  rollupPreprocessor,
  typescriptPreprocessor,
  basePath: process.cwd(),
  frameworks: pkg.karma.frameworks,
  resolve: { root },
  files: pkg.karma.files || [
    { pattern: 'spec/**/*.js', watched: false }
  ],
  preprocessors: {
    'spec/**/*.js': ['rollup', 'typescript']
  }
}

module.exports = {COMMON_CONFIG, pkg}
