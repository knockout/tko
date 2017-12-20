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

// For options, see https://saucelabs.com/platforms
// https://wiki.saucelabs.com/display/DOCS/Platform+Configurator#/
const SAUCE_LAUNCHERS = {
  sl_chrome_latest: {
    base: 'SauceLabs',
    browserName: 'chrome',
    version: 'latest'
  },
  SL_Firefox_latest: {
    base: 'SauceLabs',
    browserName: 'firefox',
    version: 'latest'
  }
 /*,
  sl_chrome_60: {
    base: 'SauceLabs',
    browserName: 'chrome',
    version: '60'
  },
  sl_chrome_45: {
    base: 'SauceLabs',
    browserName: 'chrome',
    version: '45'
  },
  SL_iOS_latest: {
    base: 'SauceLabs',
    browserName: 'iphone',
    version: 'latest'
  },
  SL_iOS_10_0: {
    base: 'SauceLabs',
    browserName: 'iphone',
    version: '10.0'
  },
  SL_iOS_9_1: {
    base: 'SauceLabs',
    browserName: 'iphone',
    version: '9.1'
  },
  SL_Safari_latest: {
    base: 'SauceLabs',
    browserName: 'safari',
    version: 'latest'
  },
  SL_Safari_10: {
    base: 'SauceLabs',
    browserName: 'safari',
    version: 10
  },
  SL_Safari_9: {
    base: 'SauceLabs',
    browserName: 'safari',
    version: 9
  },
  SL_Edge_latest: {
    base: 'SauceLabs',
    browserName: 'microsoftedge',
    version: 'latest'
  },
  SL_IE_11: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    version: 11
  }*/

  // sl_firefox: {
  //   base: 'SauceLabs',
  //   browserName: 'firefox',
  //   version: '30'
  // },
  // sl_ios_safari: {
  //   base: 'SauceLabs',
  //   browserName: 'iphone',
  //   platform: 'OS X 10.9',
  //   version: '7.1'
  // },
  // sl_ie_11: {
  //   base: 'SauceLabs',
  //   browserName: 'internet explorer',
  //   platform: 'Windows 8.1',
  //   version: '11'
  // },
  // sl_android: {
  //   base: 'SauceLabs',
  //   browserName: 'Browser',
  //   platform: 'Android',
  //   version: '4.4',
  //   deviceName: 'Samsung Galaxy S3 Emulator',
  //   deviceOrientation: 'portrait'
  // }
}

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
    removeComments: false,
    downlevelIteration: true
  }
}

const COMMON_CONFIG = {
  rollupPreprocessor,
  // typescriptPreprocessor, // Waiting on https://stackoverflow.com/questions/47210133
  basePath: process.cwd(),
  frameworks: pkg.karma.frameworks,
  resolve: { root },
  files: [
    { pattern: 'spec/*.js', watched: false }
  ],
  preprocessors: {
    'spec/**/*.js': ['rollup'] //, 'typescript']
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
      customLaunchers: SAUCE_LAUNCHERS,
      browsers: ['Electron', ...Object.keys(SAUCE_LAUNCHERS)],
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
