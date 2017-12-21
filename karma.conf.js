const fs = require('fs')
const path = require('path')

const nodeResolve = require('rollup-plugin-node-resolve')
const rollupCommonJS = require('rollup-plugin-commonjs')
const rollupVisualizer = require('rollup-plugin-visualizer')
const typescript = require('typescript')

const pkg = JSON.parse(fs.readFileSync('package.json'))
const {SAUCE_USERNAME, SAUCE_ACCESS_KEY} = process.env

const root = path.join(process.cwd(), 'spec')
const {argv} = process

const VERSIONS_SYM = Symbol('Versions List')

// For options, see https://saucelabs.com/platforms
// https://wiki.saucelabs.com/display/DOCS/Platform+Configurator#/
const SL_BROWSERS = {
  CHROME: {
    base: 'SauceLabs',
    browserName: 'chrome',
    [VERSIONS_SYM]: ['latest', 60, 55] //, 50, 45, 40, 35, 30]
  },

  FIREFOX: {
    base: 'SauceLabs',
    browserName: 'firefox',
    [VERSIONS_SYM]: ['latest']
  },

  SAFARI: {
    base: 'SauceLabs',
    browserName: 'safari',
    [VERSIONS_SYM]: ['latest']
  },

  EDGE: {
    base: 'SauceLabs',
    browserName: 'microsoftedge',
    [VERSIONS_SYM]: ['latest']
  },

  IE: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    [VERSIONS_SYM]: [11, 10, 9]
  },

  // 🚨  The iPhone emulater on SauceLabs requires a huge connectionRetryTimeout
  // because its startup time is around 90 seconds.
  // IOS_SAFARI: {
  //   base: 'SauceLabs',
  //   browserName: 'iphone',
  //   version: 'latest'
  // },

  launchersFor (browser) {
    const BROWSER = SL_BROWSERS[browser]
    return BROWSER[VERSIONS_SYM].map(
      v => ({ [`SL_${browser}_${v}`]: Object.assign({version: v}, BROWSER) })
    )
  }
}

const SAUCE_LAUNCHERS = Object.assign(
  ...SL_BROWSERS.launchersFor('CHROME'),
  ...SL_BROWSERS.launchersFor('FIREFOX'),
  ...SL_BROWSERS.launchersFor('SAFARI'),
  ...SL_BROWSERS.launchersFor('EDGE')
)

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
    lib: ['DOM', 'ES5', 'ES6', 'ScriptHost', 'ES2015', 'ES2016', 'ES2017'],
    removeComments: false,
    downlevelIteration: true,
    sourceMap: true
  }
}

const COMMON_CONFIG = {
  rollupPreprocessor,
  typescriptPreprocessor,
  basePath: process.cwd(),
  frameworks: pkg.karma.frameworks,
  resolve: { root },
  files: [
    { pattern: 'spec/*.js', watched: false }
  ],
  preprocessors: {
    'spec/**/*.js': ['rollup', 'typescript']
  }
}

module.exports = (config) => {
  if (argv.includes('--sauce')) {
    if (!SAUCE_USERNAME) {
      throw new Error('Environment needs SAUCE_USERNAME')
    }
    if (!SAUCE_ACCESS_KEY) {
      throw new Error('Environment needs SAUCE_ACCESS_KEY')
    }
    config.set(Object.assign({
      sauceLabs: {
        testName: `${pkg.name} @ ${pkg.version}`,
        startConnect: !argv.includes('--noStartConnect'),
        public: 'public'
      },
      colors: true,
      captureTimeout: 120000,
      browserDisconnectTimeout: 50000,
      browserNoActivityTimeout: 50000,
      customLaunchers: SAUCE_LAUNCHERS,
      browsers: Object.keys(SAUCE_LAUNCHERS),
      reporters: ['dots', 'saucelabs'],
      singleRun: true
    }, COMMON_CONFIG))
  } else {
    config.set(Object.assign({
      electronOpts: {
        frame: false,
        resizable: false,
        focusable: false,
        show: false,
        fullscreenable: false,
        hasShadow: false
      },
      browsers: ['Electron'],
      singleRun: argv.includes('--once')
    }, COMMON_CONFIG))
  }
}
