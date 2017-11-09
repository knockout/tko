const fs = require('fs')
const path = require('path')

const nodeResolve = require('rollup-plugin-node-resolve')
const rollupCommonJS = require('rollup-plugin-commonjs')
const rollupVisualizer = require('rollup-plugin-visualizer')
const typescript = require('typescript')

const pkg = JSON.parse(fs.readFileSync('package.json'))

const root = path.join(process.cwd(), 'spec')
const {argv} = process

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
  // 'spec/**/*.js': ['rollup'] //, 'typescript']
}

const replacerPlugin = {
  name: 'tko-package-imports',
  /**
   * Resolve the path of tko.* packages, so
   *
   *    tko.utils   =>   packages/tko.utils/src/index.js
   *
   * We use sources so that we don't have multiple references
   * from different sources e.g. `tko.computed` and `tko.observable`
   * both importing `tko.utils` would generate multiple versions
   * of objectMap that rollup transpiles as objectMap$1 and
   * objectMap$2.
   *
   * Plus by doing this we won't need to rebuild dist/ files
   * whenever we make changes to the source.
   */
  resolveId (importee, importer) {
    if (importee.includes('/')) { return }
    const packagePath = path.join(__dirname, 'packages', importee, 'src/index.js')
    if (fs.existsSync(packagePath)) { return packagePath }
  }
}

const rollupPreprocessor = {
  format: 'iife',
  name: pkg.name,
  plugins: [
    replacerPlugin,
    nodeResolve({ module: true }),
    rollupCommonJS(),
    rollupVisualizer({ filename: './visual.html' })
  ],
  /**
   * Source maps often link multiple files (e.g. tko.utils/src/object.js)
   * from different spec/ files.  This causes problems e.g. a breakpoints
   * occur in the wrong spec/ file.
   *
   * Nevertheless enabling source maps when there's only one test file
   * can be illuminating, so it's an option.
   */
  sourcemap: argv.includes('--sourcemap') ? 'inline' : false
}

const typescriptPreprocessor = {
  typescript,
  options: {
    target: 'ES5',
    removeComments: false,
    downlevelIteration: true
  }
}

module.exports = (config) => {
  config.set({
    basePath: process.cwd(),
    files,
    preprocessors,
    rollupPreprocessor,
    typescriptPreprocessor, Waiting on https://stackoverflow.com/questions/47210133
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
    singleRun: argv.includes('--once')
  })
}
