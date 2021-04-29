
const {argv} = process
const {SAUCE_USERNAME, SAUCE_ACCESS_KEY} = process.env

const {pkg, COMMON_CONFIG} = require('./tools/karma')
const {SAUCE_LAUNCHERS} = require('./tools/saucelabs')

function sauceConfig (config) {
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
    browserDisconnectTimeout: 100000,
    browserNoActivityTimeout: 100000,
    customLaunchers: SAUCE_LAUNCHERS,
    browsers: Object.keys(SAUCE_LAUNCHERS),
    reporters: ['dots', 'saucelabs'],
    singleRun: true
  }, COMMON_CONFIG))
}

function localConfig (config) {
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

module.exports = (config) => {
  if (argv.includes('--sauce')) {
    sauceConfig(config)
  } else {
    localConfig(config)
  }
}
