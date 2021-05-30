/**
 * Config for karma.
 */
const fs = require('fs')

const {argv} = process
const {SAUCE_USERNAME, SAUCE_ACCESS_KEY} = process.env

const pkg = JSON.parse(fs.readFileSync('package.json'))

const CommonConfig = {
  basePath: process.cwd(),
  frameworks: pkg.karma.frameworks,
  files: pkg.karma.files || [
    { pattern: 'spec/**/*.js', watched: false },
    { pattern: 'spec/**/*.ts', watched: false }
  ],
  preprocessors: {
    'spec/**/*.js': ['esbuild'],
    'spec/**/*.ts': ['esbuild']
  },
  esbuild: {
    // See: https://esbuild.github.io/api/
    format: 'iife',
    bundle: false,
    define: {
      BUILD_VERSION: '"test"',
    }
  }
}


/**
 * Configuration for testing in Sauce Labs browsers.
 */
 const VERSIONS_SYM = Symbol('Versions List')

 // For options, see https://saucelabs.com/platforms
 // https://wiki.saucelabs.com/display/DOCS/Platform+Configurator#/
 //
 // NOTE:  When a selection below is unavailable the following unhelpful error
 // is produced from webdriver.js:
 //
 // TypeError: Cannot read property 'value' of undefined
 //
 const SauceBrowsers = {
   CHROME: {
     base: 'SauceLabs',
     browserName: 'chrome',
     [VERSIONS_SYM]: ['latest']//, 50, 45, 40, 35, 30]
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

   // 🚨  The iPhone emulater on SauceLabs requires a huge connectionRetryTimeout
   // because its startup time is around 90 seconds.
   // IOS_SAFARI: {
   //   base: 'SauceLabs',
   //   browserName: 'iphone',
   //   version: 'latest'
   // },

   launchersFor (browser) {
     const BROWSER = SauceBrowsers[browser]
     return BROWSER[VERSIONS_SYM].map(
       v => ({ [`SL_${browser}_${v}`]: Object.assign({version: v}, BROWSER) })
     )
   }
 }

 const SauceLaunchers = Object.assign(
   ...SauceBrowsers.launchersFor('CHROME'),
   ...SauceBrowsers.launchersFor('FIREFOX'),
  //  ...SauceBrowsers.launchersFor('SAFARI')
   // ...SauceBrowsers.launchersFor('EDGE'),
 )


function sauceConfig (config) {
  if (!SAUCE_USERNAME) {
    throw new Error('Environment needs SAUCE_USERNAME')
  }
  if (!SAUCE_ACCESS_KEY) {
    throw new Error('Environment needs SAUCE_ACCESS_KEY')
  }
  config.set({
    ...CommonConfig,
    sauceLabs: {
      testName: `${pkg.name} @ ${pkg.version}`,
      startConnect: argv.includes('--startConnect'),
      public: 'public'
    },
    colors: true,
    captureTimeout: 120000,
    browserDisconnectTimeout: 100000,
    browserNoActivityTimeout: 100000,
    customLaunchers: SauceLaunchers,
    browsers: Object.keys(SauceLaunchers),
    reporters: ['dots', 'saucelabs'],
    singleRun: true
  })
}

function localConfig (config) {
  config.set({
    ...CommonConfig,
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
  })
}

module.exports = (config) => {
  if (argv.includes('--sauce')) {
    sauceConfig(config)
  } else {
    localConfig(config)
  }
}
